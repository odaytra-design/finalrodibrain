
export async function onRequestPost({ request, env }) {
  const { brief, answers } = await request.json();

  const apiKey = env.OPENAI_API_KEY;
  const model = env.OPENAI_MODEL || "gpt-4o-mini";

  if (!answers) {
    return Response.json({
      mode: "questions",
      questions: [
        "هل جمهورك يهتم بالسعر ولا النتيجة؟",
        "هل عندك عرض جاهز ولا بدنا نصنع واحد؟"
      ]
    });
  }

  return Response.json({
    mode: "strategy",
    hook: "حل قوي لـ " + brief,
    angle: "زاوية بيع مباشرة",
    offer: "عرض محدود",
    cta: "ابدأ الآن"
  });
}
