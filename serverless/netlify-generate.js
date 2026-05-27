// /netlify/functions/generate.js (Netlify Function)
// Deploy: copie este arquivo para /netlify/functions/generate.js no seu repositório
// Variável de ambiente: OPENAI_API_KEY (defina em Site settings > Build & deploy > Environment)

exports.handler = async function(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: 'OK'
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'OPENAI_API_KEY not configured' })
      };
    }

    const prompt = buildPrompt(payload);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Gother.IA, a thoughtful philosopher that summarizes leadership diagnostics in a reflective, constructive tone. Always respond in Portuguese Brazilian.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 700,
        temperature: 0.7
      })
    });

    if (!openaiRes.ok) {
      const errData = await openaiRes.json();
      throw new Error(errData.error?.message || `OpenAI API error: ${openaiRes.status}`);
    }

    const data = await openaiRes.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const content = data.choices[0].message.content;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ result: content })
    };
  } catch (err) {
    console.error('Error in generate function:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message || String(err) })
    };
  }
};

function buildPrompt(payload) {
  const { catAverages, catDetails, overall } = payload || {};

  let s = `Você é Gother.IA, um filósofo que sintetiza diagnósticos de liderança. Recebeu:\n`;
  s += `- Média geral: ${Number(overall).toFixed(2)}\n\n`;

  if (Array.isArray(catDetails) && catDetails.length > 0) {
    s += `Detalhes por categoria:\n`;
    catDetails.forEach(d => {
      const avg = Number(d.avg).toFixed(2);
      s += `- ${d.title}: ${avg}\n`;
    });
    s += '\n';
  }

  s += `Resuma em tom filosófico e reflexivo (máximo 10 linhas):\n`;
  s += `1) Onde está acertando\n`;
  s += `2) Áreas que merecem atenção\n`;
  s += `3) Onde precisa melhorar / Atenção e sugestões práticas\n`;
  s += `Use frases concisas, reflexivas e sugestões acionáveis.`;

  return s;
}
