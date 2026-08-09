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

// ===== Junk detector (canned/non-answers) =====
function junk(t) {
  if (!t) return true;
  const s = t.toLowerCase();
  return s.includes("not sure what you") || s.includes("let me know what you") || s.includes("as an ai language model") || s.includes("i can't help with that");
}

// ===== Free AI text — no API key =====
// ===== Fast fetch with timeout =====
function fetchT(url, opts, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, Object.assign({}, opts, { signal: c.signal })).finally(() => clearTimeout(t));
}

// ===== Free AI text — no API key (max 1.5s per source) =====
async function aiText(prompt) {
  const body = JSON.stringify({ messages: [{ role: 'user', content: prompt }] });
  try {
    const r = await fetchT('https://ai.hackclub.com/chat/completions', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: body }, 1500);
    if (r.ok) {
      const j = await r.json();
      const t = (j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : '').trim();
      if (t && !junk(t)) return t;
    }
  } catch (e) {}
  try {
    const r = await fetchT('https://text.pollinations.ai/openai', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ model: 'openai', messages: [{ role: 'user', content: prompt }] }) }, 1500);
    if (r.ok) {
      const j = await r.json();
      const t = (j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : '').trim();
      if (t && !junk(t)) return t;
    }
  } catch (e) {}
  return '';
}
// ===== Offline fallbacks (always works) =====
function localTags(topic) {
  const clean = topic.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).join('');
  const base = ['#' + clean, '#' + clean + 'life', '#' + clean + 'lover', '#' + clean + 'daily', '#' + clean + 'gram'];
  const generic = ['#love', '#instagood', '#photooftheday', '#beautiful', '#happy', '#follow', '#picoftheday', '#viral', '#trending', '#explore', '#explorepage', '#reels', '#instadaily', '#bestoftheday', '#lifestyle', '#passion', '#community', '#daily', '#inspiration', '#likeforlikes'];
  return base.concat(generic).slice(0, 20);
}
function localCopy(topic, tone, type) {
  const t = topic;
  const tn = (tone || '').toLowerCase();
  const ty = (type || '').toLowerCase();
  let pool;
  if (tn.includes('prof')) {
    pool = [
      t + ' delivers consistent, measurable quality. 📈',
      'Built for people who value precision — a ' + type + ' that reflects the ' + t + ' standard. 🤝',
      'Efficiency. Clarity. Results. ' + t + '. ✅'
    ];
  } else if (tn.includes('bold')) {
    pool = [
      'Why settle? ' + t + ' that actually delivers. Try it today! 🔥',
      'Stop scrolling. ' + t + ' is the upgrade you have been waiting for. ⚡',
      t + ' does not follow trends — it sets them. 💥'
    ];
  } else if (tn.includes('fun') || tn.includes('hum')) {
    pool = [
      'Our lawyer said we cannot call ' + t + ' "too good". So we will just wink. 😉',
      t + ': cheaper than therapy, twice the results. 😂',
      'Warning: ' + t + ' may cause extreme satisfaction. 🚨'
    ];
  } else if (tn.includes('lux') || tn.includes('eleg')) {
    pool = [
      'Indulge in ' + t + ' — where quality meets elegance. 🥂',
      t + ': for those who accept nothing less. ✨',
      'A finer standard begins with ' + t + '. 🖤'
    ];
  } else {
    pool = [
      'Discover ' + t + ' — fresh, warm and made with love. ✨',
      'We made ' + t + ' with one goal: make you smile. 💛',
      'Pull up a chair — ' + t + ' feels like home. 😊'
    ];
  }
  if (ty.includes('caption')) {
    const tag = '#' + t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    pool = pool.map(l => l + ' ' + tag + ' #trending');
  }
  if (ty.includes('bio')) {
    pool[0] = 'Hi, we are ' + t + ' — a ' + tn + ' team with a simple promise: quality first. 👋';
  }
  return pool;
}
function localChat(q) {
  const s = q.toLowerCase();
  if (/(hi|hello|hey)/.test(s)) return 'Hi there! 👋 Ask me anything — or try the AI Images, Copy and Hashtag tools above.';
  if (s.includes('caption') || s.includes('copy')) return 'Try the AI Copy tool — type a topic and it writes 3 options for you! ✍️';
  if (s.includes('hashtag')) return 'The AI Hashtag tool can generate 20 tags in one tap. Try it! #️⃣';
  if (s.includes('image') || s.includes('photo') || s.includes('picture')) return 'Use AI Images — describe anything and it paints it in seconds. 🎨';
  if (s.includes('name')) return 'Here are some ideas: BrightLab, NovaNest, Loopify — want more? Ask again!';
  return 'Good question! I am a lightweight assistant right now — for full AI answers try again in a bit. Meanwhile, all 4 tools above work instantly. ✨';
}

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
  const prompt = 'Write 3 short ' + type + ' options about "' + topic + '" in a ' + tone + ' tone. Return only the 3 options, each on its own line, no numbering.';
  let lines = [];
  const text = await aiText(prompt);
  if (text) {
    lines = text.split('\n').map(l => l.replace(/^[\d\-\.\)\*]+/, '').trim()).filter(l => l.length > 3).slice(0, 3);
  }
  if (!lines.length) lines = localCopy(topic, tone, type);
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
  addMsg('ai', '…');
  const prompt = 'You are a helpful, friendly assistant. Answer briefly.\n' + history.slice(-6).join('\n') + '\nAI:';
  const text = await aiText(prompt);
  chatOut.lastElementChild.textContent = text || localChat(v);
  if (text) history.push('AI: ' + text);
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
  const clean = v.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).join('');
  let tags = [];
  const text = await aiText('Give 20 relevant hashtags for "' + v + '". Return only the hashtags, space separated, no numbering, no explanation.');
  if (text) {
    tags = text.match(/#[\p{L}\p{N}_]+/gu) || [];
    if (!tags.length) tags = text.split(/\s+/).filter(w => w.length > 2).map(w => '#' + w.replace(/[^\p{L}\p{N}_]/gu, '')).filter(t => t.length > 1);
    tags = tags.slice(0, 20);
  }
  if (tags.length < 8 || !tags.some(t => t.toLowerCase().includes(clean))) tags = localTags(v);
  allTags = tags.join(' ');
  tags.forEach(t => {
    const s = document.createElement('span');
    s.textContent = t;
    out.appendChild(s);
  });
  $('#tagCopy').hidden = false;
  st.textContent = '✅ ' + tags.length + ' hashtags ready.';
});
$('#tagCopy').addEventListener('click', () => {
  navigator.clipboard.writeText(allTags);
  $('#tagCopy').textContent = 'Copied ✓';
  setTimeout(() => { $('#tagCopy').textContent = 'Copy all'; }, 1500);
});
    
