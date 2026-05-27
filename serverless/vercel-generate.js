// /api/generate.js (Vercel Serverless Function)
// Deploy: copie este arquivo para /api/generate.js no seu repositório Vercel
// Variável de ambiente: OPENAI_API_KEY (defina em Settings > Environment Variables)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body; // expected: { catAverages, catDetails, overall }
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
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

    return res.status(200).json({ result: content });
  } catch (err) {
    console.error('Error in generate handler:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}

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
