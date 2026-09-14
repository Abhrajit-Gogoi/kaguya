const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

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
    // Shows detailed percentage and download status
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

  const userEl = document.createElement('div');
  userEl.className = 'msg user';
  userEl.textContent = txt;
  chat.appendChild(userEl);

  msgs.push({ role: 'user', content: txt });
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
