export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();

    const brief = body.brief || "منتج عام";
    const answers = body.answers || null;

    const apiKey = env.OPENAI_API_KEY;

    // 🔥 إذا المفتاح مش موجود
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "API KEY NOT FOUND",
        }),
        { status: 500 }
      );
    }

    // 🧠 المرحلة 1: أسئلة
    if (!answers) {
      return Response.json({
        mode: "questions",
        questions: [
          "مين جمهورك؟",
          "شو الهدف؟ (بيع مباشر / ليدز)",
          "شو أقوى ميزة عندك؟",
        ],
      });
    }

    // 🧠 المرحلة 2: AI حقيقي
    const prompt = `
أنت خبير تسويق مباشر محترف.

المطلوب:
حوّل هذا المشروع إلى استراتيجية صفحة هبوط عالية التحويل.

المنتج:
${brief}

الإجابات:
${JSON.stringify(answers)}

اعطني JSON فقط بهذا الشكل:

{
  "hook": "",
  "angle": "",
  "offer": "",
  "cta": "",
  "sections": [
    "hero",
    "problem",
    "solution",
    "benefits",
    "social_proof",
    "cta"
  ]
}

بدون أي شرح.
`;

    const aiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: Bearer ${apiKey},
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a conversion-focused marketing AI.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await aiRes.json();

    const text =
      data.choices?.[0]?.message?.content || '{"error":"no response"}';

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = { raw: text };
    }

    return Response.json({
      mode: "strategy",
      data: parsed,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "SERVER ERROR",
        details: err.message,
      }),
      { status: 500 }
    );
  }
}
