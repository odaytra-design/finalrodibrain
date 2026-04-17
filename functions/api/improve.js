function fallback(copy, instruction = '', reason = '') {
  const current = copy || {};
  return {
    ok: true,
    source: reason ? 'fallback' : 'demo',
    warning: reason || undefined,
    copy: {
      headline: current.headline || 'عنوان محسن',
      subheadline: `${current.subheadline || 'نص محسّن'}${instruction ? ' — ' + instruction : ''}`.trim(),
      cta: current.cta || 'ابدأ الآن',
      benefits: Array.isArray(current.benefits) && current.benefits.length
        ? current.benefits.slice(0, 3)
        : ['رسالة أوضح', 'إقناع أعلى', 'CTA أقوى'],
      faq: Array.isArray(current.faq) && current.faq.length
        ? current.faq.slice(0, 2)
        : [
            { q: 'هل النص جاهز للتعديل؟', a: 'نعم، ويمكن تطويره أكثر لاحقًا.' },
            { q: 'هل هذه نسخة احتياطية؟', a: 'نعم، إذا تعطل OpenAI لن يتوقف المشروع.' }
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

function normalizeParsed(text, currentCopy) {
  return {
    ok: true,
    source: 'openai',
    copy: {
      headline: extractSection(text, 'HEADLINE') || currentCopy.headline || 'عنوان محسن',
      subheadline: extractSection(text, 'SUBHEADLINE') || currentCopy.subheadline || 'وصف محسن',
      cta: extractSection(text, 'CTA') || currentCopy.cta || 'ابدأ الآن',
      benefits: (() => {
        const benefits = extractList(text, 'BENEFITS');
        return benefits.length ? benefits : (currentCopy.benefits || []).slice(0, 3);
      })(),
      faq: (() => {
        const faq = extractFaq(text);
        return faq.length ? faq : (currentCopy.faq || []).slice(0, 2);
      })()
    }
  };
}

async function callOpenAI(env, idea, copy, instruction) {
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
          content: 'You improve Arabic landing page copy. Return plain text only in this exact format: HEADLINE: ...\nSUBHEADLINE: ...\nCTA: ...\nBENEFITS:\n- ...\n- ...\n- ...\nFAQ:\nسؤال 1 | جواب 1\nسؤال 2 | جواب 2'
        },
        {
          role: 'user',
          content: `الفكرة: ${idea || 'Landing page'}\nالتوجيه: ${instruction || 'اجعل النص أوضح وأكثر إقناعًا'}\nالنص الحالي: ${JSON.stringify(copy)}`
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

  return normalizeParsed(String(content), copy);
}

export async function onRequestPost({ request, env }) {
  try {
    const { instruction, copy, idea } = await request.json();
    if (!copy || typeof copy !== 'object') {
      return Response.json({ ok: false, error: 'Copy object is required' }, { status: 400 });
    }

    if (!env.OPENAI_API_KEY) {
      return Response.json(fallback(copy, instruction, 'OPENAI_API_KEY is missing'));
    }

    try {
      const result = await callOpenAI(env, idea, copy, instruction);
      return Response.json(result);
    } catch (openaiError) {
      return Response.json(fallback(copy, instruction, openaiError.message));
    }
  } catch (error) {
    return Response.json(
      { ok: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
