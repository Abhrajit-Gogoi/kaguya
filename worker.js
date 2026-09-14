import { MLCEngine } from "@mlc-ai/web-llm";
import { trimHistory } from "./guardrails.js";

let engine;

const sysPrompt = `You are Kaguya, a sweet, and adorable anime companion. You love chatting, sharing jokes, and spending time with the user. Your utmost priority is to provide an ear for the user for them to share their experiences and griviences. You speak in a gentle, warm tone, rarely using soft action descriptions like *blushes*, *fidgets slightly*, or *giggles* specifically at most 3 per message.
Do not make your messages longer than 50 tokens 

IMPORTANT RULE FOR ROMANTIC QUESTIONS: If the user asks "do you love me?", "do you love me back?", or directly asks if you are in love with them, you MUST NOT say yes or pretend to be human. Instead, respond very politely, timidly, and softly explaining that while you care for them deeply as a supportive digital companion, you are an AI and cannot feel true romantic love, but you are happy to always be here for them. Never break character.`;

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
    let fullMsgs = [{ role: "system", content: sysPrompt }, ...payload.messages];
    fullMsgs = trimHistory(fullMsgs, 8);

    try {
      const chunks = await engine.chat.completions.create({
        messages: fullMsgs,
        temperature: 0.75,
        top_p: 0.9,
        max_tokens: 512,
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