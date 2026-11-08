export interface ConnectionBatcher<Connection> {
  run<T>(operation: (connection: Connection) => Promise<T>): Promise<T>;
}

interface PendingOperation<Connection> {
  execute(connection: Connection): Promise<boolean>;
  reject(error: unknown): void;
}

/** Reuses one short-lived connection for queued work; never executes it concurrently. */
export function createConnectionBatcher<Connection>(
  withConnection: (work: (connection: Connection) => Promise<void>) => Promise<void>,
  maxOperations = 32,
): ConnectionBatcher<Connection> {
  const queue: PendingOperation<Connection>[] = [];
  let draining = false;
  const executing = new AsyncLocalStorage<boolean>();

  async function drain() {
    if (draining) return;
    draining = true;
    try {
      await withConnection(async (connection) => {
        for (let count = 0; count < maxOperations; count += 1) {
          const pending = queue.shift();
          if (!pending) break;
          if (!await pending.execute(connection)) break;
          // Let awaiting repositories enqueue follow-up work before closing.
          await new Promise<void>((resolve) => setImmediate(resolve));
        }
      });
    } catch (error) {
      for (const pending of queue.splice(0)) pending.reject(error);
    } finally {
      draining = false;
      if (queue.length) void drain();
    }
  }

  return {
    run<T>(operation: (connection: Connection) => Promise<T>): Promise<T> {
      if (executing.getStore()) return Promise.reject(new Error("Nested database operations must use the existing connection."));
      // Preserve each caller's request stores (including Next headers/cookies)
      // rather than inheriting the first request that started this batch.
      const inCallerContext = AsyncLocalStorage.snapshot();
      const result = new Promise<T>((resolve, reject) => {
        queue.push({
          reject,
          async execute(connection) {
            try { resolve(await inCallerContext(() => executing.run(true, () => operation(connection)))); return true; }
            catch (error) { reject(error); return false; }
          },
        });
      });
      void drain();
      return result;
    },
  };
}
import { AsyncLocalStorage } from "node:async_hooks";

