import WebWorker from './worker.js?worker';
import { sanitizeInput } from './guardrails.js';

const worker = new WebWorker();

const chat = document.getElementById('chat');
const input = document.getElementById('input');
const btn = document.getElementById('send');
const status = document.getElementById('status');

let ready = false;
let msgs = [];
let curEl = null;

worker.onmessage = (evt) => {
  const { type, data } = evt.data;

  if (type === 'progress') {
    status.textContent = typeof data === 'string' ? data : data.text;
  } else if (type === 'ready') {
    status.textContent = 'Online & ready';
    ready = true;
    btn.disabled = false;
  } else if (type === 'token') {
    if (!curEl) {
      const row = document.createElement('div');
      row.className = 'msg-row assistant-row';

      const av = document.createElement('div');
      av.className = 'msg-av kaguya-av';

      curEl = document.createElement('div');
      curEl.className = 'msg-text assistant';

      row.appendChild(av);
      row.appendChild(curEl);
      chat.appendChild(row);
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
    status.textContent = 'Error: ' + data;
    btn.disabled = false;
  }
};

function init() {
  btn.disabled = true;
  status.textContent = 'Warming up...';
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
    errEl.className = 'alert';
    errEl.textContent = check.reason;
    chat.appendChild(errEl);
    input.value = '';
    return;
  }

  const row = document.createElement('div');
  row.className = 'msg-row user-row';

  const av = document.createElement('div');
  av.className = 'msg-av user-av';

  const txtEl = document.createElement('div');
  txtEl.className = 'msg-text user';
  txtEl.textContent = check.text;

  row.appendChild(av);
  row.appendChild(txtEl);
  chat.appendChild(row);

  msgs.push({ role: 'user', content: check.text });
  input.value = '';
  btn.disabled = true;

  worker.postMessage({
    type: 'generate',
    payload: { messages: msgs }
  });
}

btn.addEventListener('click', send);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') send();
});

init();