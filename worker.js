import { MLCEngine } from "@mlc-ai/web-llm";
import { trimHistory } from "./guardrails.js";

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
    const { messages, sysPrompt, temp, topP, maxTok } = payload;
    let fullMsgs = [];
    if (sysPrompt) {
      fullMsgs.push({ role: "system", content: sysPrompt });
    }
    fullMsgs = fullMsgs.concat(messages);
    fullMsgs = trimHistory(fullMsgs, 8);

    try {
      const chunks = await engine.chat.completions.create({
        messages: fullMsgs,
        temperature: temp ?? 0.7,
        top_p: topP ?? 0.9,
        max_tokens: maxTok ?? 512,
        stream: true
      });

      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          self.postMessage({ type: "token", data: content });
        }
      }
      self.postMessage({ type: "done" });
    } catch (err) {
      self.postMessage({ type: "error", data: err.message });
    }
  }
};