

let brainAnswers=null;

async function runBrain(brief){
  let res=await fetch('/api/brain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief})});
  let data=await res.json();

  if(data.mode==="questions"){
    const a1=prompt(data.questions[0]);
    const a2=prompt(data.questions[1]);

    res=await fetch('/api/brain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({brief,answers:[a1,a2]})});
    return await res.json();
  }

  return data;
}
const el = {
  promptInput: document.getElementById('promptInput'),
  generateBtn: document.getElementById('generateBtn'),
  renderBtn: document.getElementById('renderBtn'),
  messages: document.getElementById('messages'),
  statusText: document.getElementById('statusText'),
  copyOutput: document.getElementById('copyOutput'),
  previewFrame: document.getElementById('previewFrame'),
  previewBadge: document.getElementById('previewBadge'),
  snapshotGoal: document.getElementById('snapshotGoal'),
  snapshotAudience: document.getElementById('snapshotAudience'),
  snapshotAngle: document.getElementById('snapshotAngle'),
  snapshotCta: document.getElementById('snapshotCta'),
  resetProject: document.getElementById('resetProject'),
  improveBtns: [...document.querySelectorAll('.improveBtn')],
  chips: [...document.querySelectorAll('.chip')],
};

let state = {
  idea: '',
  strategy: null,
  copy: null,
};

function addMessage(text, type = 'system') {
  const div = document.createElement('div');
  div.className = `message ${type}`;
  div.textContent = text;
  el.messages.appendChild(div);
  el.messages.scrollTop = el.messages.scrollHeight;
}

function setStatus(text) { el.statusText.textContent = text; }

function formatCopy(copy, strategy) {
  if (!copy) return 'هنا سيظهر النص المنظّم بعد التوليد.';
  const benefits = (copy.benefits || []).map((b, i) => `${i + 1}. ${b}`).join('\n');
  const faq = (copy.faq || []).map((item, i) => `${i + 1}) ${item.q}\n   ${item.a}`).join('\n\n');
  return [
    `Headline: ${copy.headline || '—'}`,
    `Subheadline: ${copy.subheadline || '—'}`,
    `Primary CTA: ${copy.cta || '—'}`,
    '',
    'Benefits:',
    benefits || '—',
    '',
    'Strategy:',
    `- Goal: ${strategy?.goal || '—'}`,
    `- Audience: ${strategy?.audience || '—'}`,
    `- Angle: ${strategy?.angle || '—'}`,
    '',
    'FAQ:',
    faq || '—',
  ].join('\n');
}

function applyState() {
  el.copyOutput.textContent = formatCopy(state.copy, state.strategy);
  el.copyOutput.classList.toggle('empty', !state.copy);
  el.renderBtn.disabled = !state.copy;
  el.improveBtns.forEach(btn => btn.disabled = !state.copy);
  el.snapshotGoal.textContent = state.strategy?.goal || '—';
  el.snapshotAudience.textContent = state.strategy?.audience || '—';
  el.snapshotAngle.textContent = state.strategy?.angle || '—';
  el.snapshotCta.textContent = state.copy?.cta || '—';
}

function localGenerateFallback(prompt) {
  return {
    ok: true,
    warning: 'API غير متاح حالياً على هذا الدبلوي. تم تشغيل وضع المعاينة المحلي.',
    strategy: {
      goal: 'جمع leads أو واتساب',
      audience: 'جمهور مهتم بالحل ويبحث عن وضوح وثقة',
      angle: `تقديم ${prompt} برسالة مباشرة وتجربة مريحة`,
    },
    copy: {
      headline: `خلّ ${prompt} يوصل بوضوح من أول نظرة`,
      subheadline: 'نسخة احتياطية محلية حتى تشتغل الـ Functions، لكنها كافية للمعاينة الأولية.',
      cta: 'ابدأ الآن',
      benefits: ['رسالة أوضح', 'عرض مرتب', 'CTA مباشر'],
      faq: [
        { q: 'ليش طلع fallback؟', a: 'لأن الـ API غير متاح حالياً أو لم يتم نشر الـ Functions.' },
        { q: 'هل أقدر أعاين الصفحة؟', a: 'نعم، تقدر تبني المعاينة وتجرب الفلو كامل.' }
      ]
    }
  };
}

function localImproveFallback(copy, instruction) {
  return {
    ok: true,
    warning: 'تم تنفيذ تحسين محلي لأن API التحسين غير متاح حالياً.',
    copy: {
      ...copy,
      subheadline: `${copy?.subheadline || ''} — ${instruction}`.trim(),
      benefits: Array.isArray(copy?.benefits) && copy.benefits.length ? copy.benefits : ['وضوح أعلى', 'إقناع أفضل', 'CTA أقوى']
    }
  };
}

async function post(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    if (url.includes('/api/generate')) return localGenerateFallback(body.prompt || body.idea || 'مشروعك');
    if (url.includes('/api/improve')) return localImproveFallback(body.copy || {}, body.instruction || 'تحسين');
    throw new Error('تعذر الوصول إلى الـ API');
  }

  const raw = await res.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (e) {
    // إذا رجع HTML أو هوم بدل JSON ففعّل fallback محلي
    if (raw && /<html|<!doctype/i.test(raw)) {
      if (url.includes('/api/generate')) return localGenerateFallback(body.prompt || body.idea || 'مشروعك');
      if (url.includes('/api/improve')) return localImproveFallback(body.copy || {}, body.instruction || 'تحسين');
      throw new Error('الـ API أعاد HTML بدل JSON');
    }
    throw new Error(raw || 'Empty response from server');
  }

  if (!res.ok) throw new Error(data.error || data.warning || 'Request failed');
  return data;
}

async function generate() {
  const prompt = el.promptInput.value.trim();
  if (!prompt) {
    addMessage('اكتب وصفًا أولًا قبل التوليد.', 'system');
    return;
  }
  state.idea = prompt;
  addMessage(prompt, 'user');
  setStatus('Generating...');
  el.generateBtn.disabled = true;
  try {
    const data = await post('/api/generate', { prompt });
    state.strategy = data.strategy;
    state.copy = data.copy;
    if (data.warning) addMessage(`ملاحظة: ${data.warning}`, 'system');
    addMessage('تم التوليد. تقدر الآن تبني الصفحة أو تطلب تحسينات.', 'bot');
    applyState();
    setStatus('جاهز للمعاينة');
  } catch (error) {
    addMessage(error.message, 'system');
    setStatus('Error');
  } finally {
    el.generateBtn.disabled = false;
  }
}

async function improve(instruction) {
  if (!state.copy) return;
  setStatus('Improving...');
  try {
    addMessage(`تحسين مطلوب: ${instruction}`, 'user');
    const data = await post('/api/improve', { instruction, copy: state.copy, idea: state.idea });
    state.copy = data.copy;
    if (data.strategy) state.strategy = data.strategy;
    if (data.warning) addMessage(`ملاحظة: ${data.warning}`, 'system');
    addMessage('تم تحديث النص.', 'bot');
    applyState();
    setStatus('جاهز');
  } catch (error) {
    addMessage(error.message, 'system');
    setStatus('Error');
  }
}

async function renderLanding() {
  if (!state.copy) return;
  setStatus('Rendering...');
  try {
    const data = await post('/api/render', { idea: state.idea, copy: state.copy });
    el.previewFrame.srcdoc = data.html;
    el.previewBadge.textContent = 'Rendered';
    addMessage('تم بناء المعاينة.', 'bot');
    setStatus('تمت المعاينة');
  } catch (error) {
    addMessage(error.message, 'system');
    setStatus('Error');
  }
}

function resetProject() {
  state = { idea: '', strategy: null, copy: null };
  el.promptInput.value = '';
  el.messages.innerHTML = '';
  el.previewFrame.srcdoc = '';
  el.previewBadge.textContent = 'No page yet';
  setStatus('جاهز');
  applyState();
}

el.generateBtn.addEventListener('click', generate);
el.renderBtn.addEventListener('click', renderLanding);
el.resetProject.addEventListener('click', resetProject);
el.improveBtns.forEach(btn => btn.addEventListener('click', () => improve(btn.dataset.instruction)));
el.chips.forEach(chip => chip.addEventListener('click', () => {
  const current = el.promptInput.value.trim();
  el.promptInput.value = current ? `${current}، ${chip.dataset.chip}` : chip.dataset.chip;
  el.promptInput.focus();
}));
applyState();
addMessage('أهلًا. اكتب وصف مشروعك وسأحوّله إلى استراتيجية ورسالة ومعاينة صفحة.', 'bot');
