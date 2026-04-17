function fallback(prompt, reason = '') {
  return {
    ok: true,
    source: reason ? 'fallback' : 'demo',
    warning: reason || undefined,
    strategy: {
      goal: 'جمع leads أو بدء محادثات واتساب',
      audience: 'عملاء يبحثون عن وضوح وثقة وتجربة مريحة',
      angle: `تحويل "${prompt}" إلى عرض واضح برسالة مباشرة ونبرة حديثة`,
    },
    copy: {
      headline: `حل أقوى لــ ${prompt}`,
      subheadline: 'رسالة مرتبة وجاهزة للعرض حتى لو تعطل الذكاء أو كان المفتاح غير جاهز.',
      cta: 'ابدأ الآن',
      benefits: [
        'رسالة أوضح من أول نظرة',
        'هيكل مناسب لصفحات الهبوط والإعلانات',
        'إمكانية تحسين النص والمعاينة فورًا'
      ],
      faq: [
        { q: 'هل هذه النتيجة تعمل الآن؟', a: 'نعم، هذه نتيجة احتياطية صالحة للعرض والمعاينة.' },
        { q: 'هل يمكن تحسينها لاحقًا؟', a: 'نعم، بعد ضبط المفتاح أو الموديل يمكن توليد نسخة أذكى.' }
      ]
    }
  };
}

function cleanText(value = '') {
  return String(value).replace(/\r/g, '').trim();
}

function extractSection(text, name) {
  const regex = new RegExp(`^${name}\\s*:\\s*(.+)$`, 'mi');
  const match = text.match(regex);
  return match ? cleanText(match[1]) : '';
}

function extractList(text, name) {
  const blockRegex = new RegExp(`${name}\\s*:\\s*([\\s\\S]*?)(?:\\n[A-Z_]+\\s*:|$)`, 'i');
  const block = text.match(blockRegex);
  if (!block) return [];
  return block[1]
    .split('\n')
    .map(line => line.replace(/^[-•*\d.\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function extractFaq(text) {
  const blockRegex = /FAQ\s*:\s*([\s\S]*?)$/i;
  const block = text.match(blockRegex);
  if (!block) return [];
  const lines = block[1].split('\n').map(l => l.trim()).filter(Boolean);
  const faq = [];
  for (const line of lines) {
    const parts = line.split('|').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) faq.push({ q: parts[0], a: parts.slice(1).join(' | ') });
  }
  return faq.slice(0, 2);
}

function normalizeParsed(text, prompt) {
  const goal = extractSection(text, 'GOAL') || 'تحويل الزائر إلى lead أو عميل محتمل';
  const audience = extractSection(text, 'AUDIENCE') || 'جمهور مستهدف يبحث عن حل واضح وسريع';
  const angle = extractSection(text, 'ANGLE') || 'زاوية تبرز الوضوح والثقة وسهولة القرار';
  const headline = extractSection(text, 'HEADLINE') || `حل أقوى لــ ${prompt}`;
  const subheadline = extractSection(text, 'SUBHEADLINE') || 'رسالة تسويقية مرتبة وجاهزة للعرض';
  const cta = extractSection(text, 'CTA') || 'ابدأ الآن';
  const benefits = extractList(text, 'BENEFITS');
  const faq = extractFaq(text);

  return {
    ok: true,
    source: 'openai',
    strategy: { goal, audience, angle },
    copy: {
      headline,
      subheadline,
      cta,
      benefits: benefits.length ? benefits : ['نتيجة أسرع', 'عرض أوضح', 'تحويل أعلى'],
      faq: faq.length ? faq : [
        { q: 'هل أقدر أعدل النص؟', a: 'نعم، من نفس الواجهة وبزر واحد.' },
        { q: 'هل يصلح لعدة مجالات؟', a: 'نعم، ما دام البرومبت واضحًا.' }
      ]
    }
  };
}

async function callOpenAI(env, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL || env.MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You write Arabic landing page strategy and copy. Return plain text only in this exact format with the same English keys: GOAL: ...\nAUDIENCE: ...\nANGLE: ...\nHEADLINE: ...\nSUBHEADLINE: ...\nCTA: ...\nBENEFITS:\n- ...\n- ...\n- ...\nFAQ:\nسؤال 1 | جواب 1\nسؤال 2 | جواب 2'
        },
        {
          role: 'user',
          content: `أنشئ استراتيجية ورسالة صفحة هبوط عربية قوية لهذا الوصف: ${prompt}`
        }
      ]
    })
  });

  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch {}

  if (!response.ok) {
    throw new Error(data?.error?.message || raw || 'OpenAI request failed');
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content || !String(content).trim()) {
    throw new Error('OpenAI returned empty content');
  }

  return normalizeParsed(String(content), prompt);
}

export async function onRequestPost({ request, env }) {
  try {
    const { prompt } = await request.json();
    if (!prompt || !String(prompt).trim()) {
      return Response.json({ ok: false, error: 'Prompt is required' }, { status: 400 });
    }

    if (!env.OPENAI_API_KEY) {
      return Response.json(fallback(prompt, 'OPENAI_API_KEY is missing'));
    }

    try {
      const result = await callOpenAI(env, String(prompt).trim());
      return Response.json(result);
    } catch (openaiError) {
      return Response.json(fallback(prompt, openaiError.message));
    }
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
