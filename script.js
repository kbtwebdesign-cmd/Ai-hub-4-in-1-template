// ===== Helpers =====
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// ===== Year =====
$('#year').textContent = new Date().getFullYear();

// ===== Scroll reveal =====
const revTargets = $$('.card, .t-card, .sec-title, .dash, .faq details, .stat');
revTargets.forEach((el, i) => {
  el.classList.add('reveal');
  el.style.transitionDelay = (i % 6) * 70 + 'ms';
});
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
}), { threshold: .12 });
revTargets.forEach(el => io.observe(el));

// ===== Tool tabs =====
$$('.side-btn').forEach(b => b.addEventListener('click', () => {
  $$('.side-btn').forEach(x => {
    x.classList.toggle('active', x === b);
    x.setAttribute('aria-selected', x === b);
  });
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'p-' + b.dataset.tool));
}));

// ===== 1) AI Images =====
$('#imgBtn').addEventListener('click', () => {
  const v = $('#imgPrompt').value.trim();
  const st = $('#imgStatus');
  if (!v) { st.textContent = '⚠️ Describe an image first.'; return; }
  st.textContent = '✨ Painting…';
  const out = $('#imgOut');
  out.innerHTML = '';
  const img = new Image();
  img.alt = v;
  img.src = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(v) + '?width=768&height=512&nologo=true';
  img.onload = () => { st.textContent = '✅ Done — right-click / long-press to save.'; };
  img.onerror = () => { st.textContent = '😕 AI is busy — try again in a few seconds.'; };
  out.appendChild(img);
});

// ===== 2) AI Copy =====
$('#copyBtn').addEventListener('click', async () => {
  const topic = $('#copyTopic').value.trim();
  const st = $('#copyStatus');
  if (!topic) { st.textContent = '⚠️ Type a topic first.'; return; }
  const tone = $('#copyTone').value, type = $('#copyType').value;
  st.textContent = '✨ Writing…';
  const out = $('#copyOut');
  out.innerHTML = '';
  const prompt = `Write 3 short ${type} options about "${topic}" in a ${tone} tone. Return only the 3 options, each on its own line, no numbering.`;
  try {
    const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt));
    const text = (await res.text()).trim();
    const lines = text.split('\n').map(l => l.replace(/^[\d\-\.\)\*]+/, '').trim()).filter(l => l.length > 3).slice(0, 3);
    if (!lines.length) throw new Error();
    lines.forEach(l => {
      const card = document.createElement('div');
      card.className = 't-card';
      card.style.marginBottom = '10px';
      const p = document.createElement('p');
      p.textContent = l;
      const btn = document.createElement('button');
      btn.className = 'btn btn-ghost btn-sm';
      btn.style.marginTop = '10px';
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(l);
        btn.textContent = 'Copied ✓';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
      card.append(p, btn);
      out.appendChild(card);
    });
    st.textContent = '✅ Done! Tap copy to use.';
  } catch {
    st.textContent = '😕 AI is busy — try again in a few seconds.';
  }
});

// ===== 3) AI Chat =====
const chatOut = $('#chatOut');
const history = [];
function addMsg(role, text) {
  const p = document.createElement('p');
  p.className = 'msg ' + role;
  p.textContent = text;
  chatOut.appendChild(p);
  chatOut.scrollTop = chatOut.scrollHeight;
}
async function sendChat() {
  const input = $('#chatInput');
  const v = input.value.trim();
  if (!v) return;
  input.value = '';
  addMsg('user', v);
  history.push('User: ' + v);
  const thinking = '…';
  addMsg('ai', thinking);
  const prompt = 'You are a helpful, friendly assistant. Answer briefly.\n' + history.slice(-6).join('\n') + '\nAI:';
  try {
    const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt));
    const text = (await res.text()).trim() || '😕';
    chatOut.lastElementChild.textContent = text;
    history.push('AI: ' + text);
  } catch {
    chatOut.lastElementChild.textContent = '😕 Connection issue — try again.';
  }
}
$('#chatBtn').addEventListener('click', sendChat);
$('#chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });

// ===== 4) AI Hashtags =====
let allTags = '';
$('#tagBtn').addEventListener('click', async () => {
  const v = $('#tagTopic').value.trim();
  const st = $('#tagStatus');
  if (!v) { st.textContent = '⚠️ Type a topic first.'; return; }
  st.textContent = '✨ Collecting hashtags…';
  const out = $('#tagOut');
  out.innerHTML = '';
  const prompt = `Give 20 relevant hashtags for "${v}". Return only the hashtags, space separated, no numbering, no explanation.`;
  try {
    const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt));
    const text = (await res.text()).trim();
    let tags = text.match(/#[\p{L}\p{N}_]+/gu);
    if (!tags) tags = text.split(/\s+/).filter(w => w.length > 2).map(w => '#' + w.replace(/[^\p{L}\p{N}_]/gu, '')).filter(t => t.length > 1);
    tags = tags.slice(0, 20);
    if (!tags.length) throw new Error();
    allTags = tags.join(' ');
    tags.forEach(t => {
      const s = document.createElement('span');
      s.textContent = t;
      out.appendChild(s);
    });
    $('#tagCopy').hidden = false;
    st.textContent = '✅ ' + tags.length + ' hashtags ready.';
  } catch {
    st.textContent = '😕 AI is busy — try again in a few seconds.';
  }
});
$('#tagCopy').addEventListener('click', () => {
  navigator.clipboard.writeText(allTags);
  $('#tagCopy').textContent = 'Copied ✓';
  setTimeout(() => { $('#tagCopy').textContent = 'Copy all'; }, 1500);
});