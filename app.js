import WebWorker from './worker.js?worker';
import { sanitizeInput } from './guardrails.js';

const worker = new WebWorker();

const chat = document.getElementById('chat');
const input = document.getElementById('input');
const btn = document.getElementById('send');
const status = document.getElementById('status');

const personaSelect = document.getElementById('persona-select');
const sysPromptEl = document.getElementById('sys-prompt');
const tempEl = document.getElementById('temp');
const tempVal = document.getElementById('temp-val');
const topPEl = document.getElementById('top-p');
const topPVal = document.getElementById('topp-val');
const clearBtn = document.getElementById('clear-btn');

const personas = {
  helpful: "You are a helpful, respectful, and honest assistant. Always answer accurately and concisely.",
  coder: "You are an expert senior software developer. Give direct answers, focus on clean code, and omit unnecessary fluff.",
  concise: "You are a executive advisor. Keep all responses under 3 sentences and strictly to the point."
};

let ready = false;
let msgs = [];
let curEl = null;

sysPromptEl.value = personas.helpful;

personaSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val !== 'custom') {
    sysPromptEl.value = personas[val] || '';
  }
});

tempEl.addEventListener('input', (e) => tempVal.textContent = e.target.value);
topPEl.addEventListener('input', (e) => topPVal.textContent = e.target.value);

clearBtn.addEventListener('click', () => {
  msgs = [];
  chat.innerHTML = '';
});

worker.onmessage = (evt) => {
  const { type, data } = evt.data;

  if (type === 'progress') {
    status.textContent = typeof data === 'string' ? data : data.text;
  } else if (type === 'ready') {
    status.textContent = 'Model loaded and ready';
    ready = true;
    btn.disabled = false;
  } else if (type === 'token') {
    if (!curEl) {
      curEl = document.createElement('div');
      curEl.className = 'msg assistant';
      chat.appendChild(curEl);
    }
    curEl.textContent += data;
    chat.scrollTop = chat.scrollHeight;
  } else if (type === 'done') {
    if (curEl) {
      msgs.push({ role: 'assistant', content: curEl.textContent });
      curEl = null;
    }
    btn.disabled = false;
  } else if (type === 'error') {
    status.textContent = 'Error during generation: ' + data;
    btn.disabled = false;
  }
};

function init() {
  btn.disabled = true;
  status.textContent = 'Initializing engine...';
  worker.postMessage({
    type: 'init',
    payload: { model: 'Llama-3.2-1B-Instruct-q4f16_1-MLC' }
  });
}

function send() {
  const txt = input.value.trim();
  if (!txt || !ready) return;

  const check = sanitizeInput(txt);
  if (!check.safe) {
    const errEl = document.createElement('div');
    errEl.className = 'msg system-alert';
    errEl.textContent = check.reason;
    chat.appendChild(errEl);
    input.value = '';
    return;
  }

  const userEl = document.createElement('div');
  userEl.className = 'msg user';
  userEl.textContent = check.text;
  chat.appendChild(userEl);

  msgs.push({ role: 'user', content: check.text });
  input.value = '';
  btn.disabled = true;

  worker.postMessage({
    type: 'generate',
    payload: {
      messages: msgs,
      sysPrompt: sysPromptEl.value.trim(),
      temp: parseFloat(tempEl.value),
      topP: parseFloat(topPEl.value)
    }
  });
}

btn.addEventListener('click', send);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') send();
});

init();