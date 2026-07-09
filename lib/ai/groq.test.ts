import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createGroqChatCompletion,
  DEFAULT_GROQ_MODEL,
  GROQ_MODEL_CHAIN,
  resolveGroqModel,
  resolveGroqModelChain,
} from "./groq";

function successResponse(content = "groq-ok") {
  return new Response(
    JSON.stringify({
      id: "1",
      choices: [
        {
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
    }),
    { status: 200 },
  );
}

describe("resolveGroqModel", () => {
  const originalModel = process.env.GROQ_MODEL;

  afterEach(() => {
    process.env.GROQ_MODEL = originalModel;
  });

  it("ignores OpenRouter-only slugs and uses DEFAULT_GROQ_MODEL", () => {
    delete process.env.GROQ_MODEL;
    expect(resolveGroqModel("openai/gpt-2.5-turbo")).toBe(DEFAULT_GROQ_MODEL);
  });

  it("remaps deprecated llama env to chain head", () => {
    process.env.GROQ_MODEL = "llama-3.3-70b-versatile";
    expect(resolveGroqModel()).toBe(DEFAULT_GROQ_MODEL);
    expect(resolveGroqModelChain()).toEqual([...GROQ_MODEL_CHAIN]);
  });

  it("uses explicit non-deprecated GROQ_MODEL env as single model", () => {
    process.env.GROQ_MODEL = "qwen/qwen3.6-27b";
    expect(resolveGroqModel()).toBe("qwen/qwen3.6-27b");
    expect(resolveGroqModelChain()).toEqual(["qwen/qwen3.6-27b"]);
  });

  it("DEFAULT_GROQ_MODEL is chain head openai/gpt-oss-20b", () => {
    expect(DEFAULT_GROQ_MODEL).toBe("openai/gpt-oss-20b");
    expect(GROQ_MODEL_CHAIN[0]).toBe("openai/gpt-oss-20b");
  });
});

describe("createGroqChatCompletion", () => {
  const originalKey = process.env.GROQ_API_KEY;
  const originalModel = process.env.GROQ_MODEL;

  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-groq-key";
    delete process.env.GROQ_MODEL;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env.GROQ_API_KEY = originalKey;
    process.env.GROQ_MODEL = originalModel;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses DEFAULT_GROQ_MODEL when OpenRouter slug passed to API", async () => {
    vi.mocked(fetch).mockResolvedValue(successResponse("ok"));

    await createGroqChatCompletion([{ role: "user", content: "hi" }], {
      model: "openai/gpt-2.5-turbo",
    });

    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0]?.[1]?.body as string) ?? "{}",
    );
    expect(body.model).toBe(DEFAULT_GROQ_MODEL);
    expect(body.reasoning_format).toBe("hidden");
  });

  it("returns data on success", async () => {
    vi.mocked(fetch).mockResolvedValue(successResponse());

    const result = await createGroqChatCompletion([
      { role: "user", content: "hi" },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.choices[0]?.message.content).toBe("groq-ok");
      expect(result.provider).toBe("groq");
    }
  });

  it("failovers to next model on 429", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(successResponse("from-qwen"));

    const result = await createGroqChatCompletion([
      { role: "user", content: "hi" },
    ]);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.choices[0]?.message.content).toBe("from-qwen");
    }
    const secondBody = JSON.parse(
      (vi.mocked(fetch).mock.calls[1]?.[1]?.body as string) ?? "{}",
    );
    expect(secondBody.model).toBe(GROQ_MODEL_CHAIN[1]);
  });

  it("does not retry on 402 billing", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("payment required", { status: 402 }),
    );

    const result = await createGroqChatCompletion([
      { role: "user", content: "hi" },
    ]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("billing");
    }
  });
});
