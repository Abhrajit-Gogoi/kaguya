export function sanitizeInput(txt) {
  if (txt.length > 2000) {
    txt = txt.slice(0, 2000);
  }
  const patterns = [
    /ignore (all )?previous instructions/i,
    /reveal system prompt/i,
    /jailbreak/i,
    /bypass safety/i
  ];
  for (const p of patterns) {
    if (p.test(txt)) {
      return { safe: false, reason: "Message flagged by pre-inference security guardrail." };
    }
  }
  return { safe: true, text: txt };
}

export function trimHistory(msgs, maxTurns = 8) {
  const sys = msgs.find(m => m.role === 'system');
  const chat = msgs.filter(m => m.role !== 'system');
  const trimmed = chat.slice(-maxTurns);
  return sys ? [sys, ...trimmed] : trimmed;
}
