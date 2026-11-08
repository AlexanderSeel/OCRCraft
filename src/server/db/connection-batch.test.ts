import { expect, it } from "vitest";
import { createConnectionBatcher } from "./connection-batch";

it("serializes queued callbacks on one short-lived connection and closes after draining", async () => {
  let opens = 0, closes = 0, concurrent = 0;
  const batcher = createConnectionBatcher(async (work) => {
    opens += 1;
    try { await work({ id: opens }); } finally { closes += 1; }
  });
  const values = await Promise.all([1, 2, 3].map((value) => batcher.run(async () => {
    concurrent += 1;
    expect(concurrent).toBe(1);
    await new Promise<void>((resolve) => setImmediate(resolve));
    concurrent -= 1;
    return value;
  })));
  expect(values).toEqual([1, 2, 3]);
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(opens).toBe(1);
  expect(closes).toBe(1);
});

it("closes after a failed callback before using a new connection for subsequent work", async () => {
  let opens = 0, closes = 0;
  const batcher = createConnectionBatcher<{ id: number }>(async (work) => {
    opens += 1;
    try { await work({ id: opens }); } finally { closes += 1; }
  });
  const results = await Promise.allSettled([
    batcher.run(async () => { throw new Error("failed transaction"); }),
    batcher.run(async (connection) => { expect(closes).toBe(1); return connection.id; }),
  ]);
  expect(results[0]).toMatchObject({ status: "rejected" });
  expect(results[1]).toEqual({ status: "fulfilled", value: 2 });
});

it("rejects queued work on open failure and allows a later retry", async () => {
  let fail = true;
  const batcher = createConnectionBatcher<number>(async (work) => {
    if (fail) throw new Error("locked");
    await work(4);
  });
  await expect(batcher.run(async (connection) => connection)).rejects.toThrow("locked");
  fail = false;
  await expect(batcher.run(async (connection) => connection)).resolves.toBe(4);
});

it("fails nested callbacks immediately instead of deadlocking the queue", async () => {
  const batcher = createConnectionBatcher<number>(async (work) => work(1));
  await expect(batcher.run(async () => batcher.run(async (value) => value))).rejects.toThrow("existing connection");
});

it("releases the connection after a bounded batch even when more work is queued", async () => {
  let opens = 0;
  const batcher = createConnectionBatcher<number>(async (work) => work(++opens), 2);
  const result = await Promise.all([1, 2, 3].map(() => batcher.run(async (value) => value)));
  expect(result).toEqual([1, 1, 2]);
});
import { AsyncLocalStorage } from "node:async_hooks";

it("keeps each caller's request context across awaits when sharing a connection", async () => {
  const request = new AsyncLocalStorage<string>();
  const batcher = createConnectionBatcher<number>(async (work) => work(1));
  const readIdentity = () => batcher.run(async () => {
    await new Promise<void>((resolve) => setImmediate(resolve));
    return request.getStore();
  });
  expect(await Promise.all([
    request.run("trainer-a", readIdentity),
    request.run("trainer-b", readIdentity),
  ])).toEqual(["trainer-a", "trainer-b"]);
});
