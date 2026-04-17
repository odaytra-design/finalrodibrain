# LandingRodi – Cloudflare Pages Git Final

هذا المشروع مهيأ خصيصًا لـ **Cloudflare Pages عبر Git**.

## الإعدادات داخل Cloudflare Pages
- Framework preset: **None**
- Build command: **اتركه فارغًا**
- Build output directory: `public`

## المتغيرات
أضف من داخل المشروع:
- `OPENAI_API_KEY`
- اختياري: `OPENAI_MODEL = gpt-4o-mini`

## مهم
هذه النسخة **بدون wrangler.toml** حتى لا يمنعك Cloudflare من إدارة Environment Variables من الـ Dashboard.

## بعد النشر
اختبر:
- `/api/test`
- `/workspace/`
