export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  const brief = body.brief || "منتج عام";
  const answers = body.answers;

  const apiKey = env.OPENAI_API_KEY;

  if (!answers) {
    return Response.json({
      mode: "questions",
      questions: [
        "مين جمهورك؟",
        "شو الهدف؟ بيع مباشر ولا leads؟",
        "شو الميزة الأقوى عندك؟"
      ]
    });
  }

  // 🧠 هنا الذكاء الحقيقي
  const prompt = `
أنت خبير تسويق مباشر.
حول هذا المدخل إلى استراتيجية صفحة هبوط قوية:

المنتج: ${brief}
الإجابات: ${JSON.stringify(answers)}

اعطني:
- Hook قوي
- زاوية بيع
- عرض
- CTA

بدون شرح. مباشر.
`;

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": Bearer ${apiKey},
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a conversion expert." },
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await aiRes.json();

  const text = data.choices?.[0]?.message?.content || "No response";

  return Response.json({
    mode: "strategy",
    result: text
  });
}
