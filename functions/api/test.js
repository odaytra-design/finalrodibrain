export async function onRequestGet({ env }) {
  try {
    if (!env.OPENAI_API_KEY) {
      return Response.json({
        ok: false,
        status: 'NO_KEY',
        message: 'OPENAI_API_KEY is missing', env_present: Boolean(env.OPENAI_API_KEY)
      }, { status: 200 });
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`
      }
    });

    const raw = await response.text();
    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch {}

    if (!response.ok) {
      return Response.json({
        ok: false,
        status: 'OPENAI_ERROR',
        message: data?.error?.message || raw || 'OpenAI request failed'
      }, { status: 200 });
    }

    return Response.json({
      ok: true,
      status: 'WORKING',
      model_count: Array.isArray(data?.data) ? data.data.length : 0
    }, { status: 200 });
  } catch (error) {
    return Response.json({
      ok: false,
      status: 'CRASH',
      message: error.message || 'Unknown error'
    }, { status: 200 });
  }
}
