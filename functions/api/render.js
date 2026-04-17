function esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function onRequestPost({ request }) {
  try {
    const { idea, copy } = await request.json();
    if (!copy || typeof copy !== 'object') {
      return Response.json({ error: 'Copy object is required' }, { status: 400 });
    }

    const benefits = Array.isArray(copy.benefits) ? copy.benefits : [];
    const faq = Array.isArray(copy.faq) ? copy.faq : [];
    const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${esc(copy.headline || 'Landing Preview')}</title>
<style>
:root{--bg:#081120;--bg2:#0d1c31;--text:#fff;--muted:#cbd5e1;--line:rgba(255,255,255,.08);--brand:#6d5dfc;--accent:#20c9d9}
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:linear-gradient(180deg,#07101c,#081627);color:var(--text)}
.wrap{width:min(1180px,calc(100% - 32px));margin:0 auto}.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:26px;align-items:center;min-height:100vh;padding:48px 0}
.badge{display:inline-block;padding:8px 12px;border-radius:999px;background:rgba(32,201,217,.1);border:1px solid rgba(32,201,217,.22);color:#a5f3fc;font-size:12px;font-weight:700}
.card{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:24px;padding:24px;backdrop-filter:blur(16px)}
h1{font-size:54px;line-height:1.1;margin:16px 0}p{font-size:18px;line-height:1.9;color:var(--muted)}
.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}.btn{display:inline-flex;align-items:center;justify-content:center;padding:14px 18px;border-radius:14px;text-decoration:none;font-weight:700}
.primary{background:linear-gradient(90deg,var(--brand),var(--accent));color:#fff}.ghost{border:1px solid var(--line);background:rgba(255,255,255,.05);color:#fff}
ul{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:12px}li{padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid var(--line)}
.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.mini{padding:14px;border-radius:16px;background:rgba(255,255,255,.03);border:1px solid var(--line)}
.faq{margin-top:18px;display:grid;gap:12px}.faq-item{padding:16px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid var(--line)}.faq-item b{display:block;margin-bottom:8px}
@media(max-width:900px){.hero{grid-template-columns:1fr}h1{font-size:38px}.meta{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <section class="hero">
    <div>
      <div class="badge">Landing Preview</div>
      <h1>${esc(copy.headline || 'عنوان الصفحة')}</h1>
      <p>${esc(copy.subheadline || 'وصف الصفحة')}</p>
      <div class="actions">
        <a href="#lead" class="btn primary">${esc(copy.cta || 'ابدأ الآن')}</a>
        <a href="#benefits" class="btn ghost">اعرف أكثر</a>
      </div>
      <div class="meta">
        <div class="mini"><b>الفكرة</b><div>${esc(idea || 'Landing page')}</div></div>
        <div class="mini"><b>الرسالة</b><div>وضوح + ثقة + تحويل</div></div>
        <div class="mini"><b>القناة</b><div>CTA مباشر / واتساب / نموذج</div></div>
      </div>
    </div>
    <div class="card" id="benefits">
      <h3 style="margin-top:0">ليش هذا العرض مقنع؟</h3>
      <ul>${benefits.map(item => `<li>✓ ${esc(item)}</li>`).join('')}</ul>
      <div class="faq">
        ${faq.map(item => `<div class="faq-item"><b>${esc(item.q)}</b><div>${esc(item.a)}</div></div>`).join('')}
      </div>
    </div>
  </section>
</div>
</body>
</html>`;

    return Response.json({ html });
  } catch (error) {
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
