import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { OpenAIImageGenerationError, OpenAIImageGenerator } from "./openai-image-generator";

function pngBytes(): Buffer {
  const bytes = Buffer.alloc(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.writeUInt32BE(1536, 16);
  bytes.writeUInt32BE(1024, 20);
  return bytes;
}

function imageResponse(): Response {
  return new Response(JSON.stringify({ data: [{ b64_json: pngBytes().toString("base64") }] }), { status: 200 });
}

describe("OpenAI image generator", () => {
  it("sends one gpt-image-2 request and decodes its PNG response", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const fetchImplementation: typeof fetch = async (_input, init) => {
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return imageResponse();
    };
    const generator = new OpenAIImageGenerator({ apiKey: "test-key-not-a-real-secret", fetchImplementation });

    const image = await generator.generate("Draw a test illustration");

    expect(requestBody).toMatchObject({ model: "gpt-image-2", prompt: "Draw a test illustration", n: 1, size: "1536x1024", quality: "medium", output_format: "png" });
    expect(image).toMatchObject({ contentType: "image/png", width: 1536, height: 1024 });
    expect(Buffer.from(image.bytes)).toEqual(pngBytes());
  });

  it("retries rate limits using Retry-After and then succeeds", async () => {
    const fetchImplementation = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "Slow down" } }), { status: 429, headers: { "retry-after": "0" } }))
      .mockResolvedValueOnce(imageResponse());
    const sleep = vi.fn(async () => undefined);
    const generator = new OpenAIImageGenerator({ apiKey: "test-key", fetchImplementation, sleep });

    await expect(generator.generate("test prompt")).resolves.toMatchObject({ contentType: "image/png" });
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(0);
  });

  it("does not retry a permanent authorization error", async () => {
    const fetchImplementation = vi.fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ error: { message: "Invalid API key" } }), { status: 401 }));
    const generator = new OpenAIImageGenerator({ apiKey: "test-key", fetchImplementation });

    await expect(generator.generate("test prompt")).rejects.toMatchObject<Partial<OpenAIImageGenerationError>>({ status: 401, retryable: false });
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it("requires an environment API key only when a request is made", async () => {
    const generator = new OpenAIImageGenerator({ apiKey: "" });
    await expect(generator.generate("test prompt")).rejects.toMatchObject({ status: null, retryable: false });
  });
});
