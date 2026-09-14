import { MLCEngine } from "@mlc-ai/web-llm";

let engine;

self.onmessage = async (evt) => {
  const { type, payload } = evt.data;

  if (type === "init") {
    engine = new MLCEngine();
    engine.setInitProgressCallback((p) => {
      self.postMessage({ type: "progress", data: p });
    });
    await engine.reload(payload.model || "Llama-3.2-1B-Instruct-q4f16_1-MLC");
    self.postMessage({ type: "ready" });
  } else if (type === "generate") {
    const chunks = await engine.chat.completions.create({
      messages: payload.messages,
      stream: true
    });
    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        self.postMessage({ type: "token", data: content });
      }
    }
    self.postMessage({ type: "done" });
  }
};