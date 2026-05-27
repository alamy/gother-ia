# Integração Serverless com ChatGPT (Vercel / Netlify)

## Visão geral
Escolha a opção que preferir: Vercel ou Netlify. Ambas permitem hospedar uma função que chama a API da OpenAI de forma segura (chave protegida em variável de ambiente).

---

## Opção 1: Vercel

### 1.1 Copie o arquivo da função

Crie um arquivo `/api/generate.js` no seu projeto (mesmo nível de index.html) ou clique em "New Function" no painel Vercel.

Conteúdo:

```js
// /api/generate.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const payload = req.body; // { catAverages, catDetails, overall }
    const prompt = buildPrompt(payload);

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are Gother.IA, a thoughtful philosopher that summarizes leadership diagnostics in a reflective, constructive tone. Answer only in Portuguese.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 700
      })
    });

    const data = await r.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error(data.error?.message || 'No response from OpenAI');
    }
    const content = data.choices[0].message.content;
    res.status(200).json({ result: content });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

function buildPrompt(payload) {
  const { catAverages, catDetails, overall } = payload || {};
  let s = `Você é Gother.IA. Recebeu um diagnóstico com média geral ${Number(overall).toFixed(2)}. Resuma em tom filosófico e reflexivo (máximo 5-6 linhas): onde está acertando, áreas de atenção e onde precisa melhorar. Use frases concisas e sugestões práticas.\n\n`;
  if (Array.isArray(catDetails)) {
    s += 'Detalhes por categoria:\n';
    catDetails.forEach(d => { s += `- ${d.title}: ${Number(d.avg).toFixed(2)}\n`; });
  }
  return s;
}
```

### 1.2 Defina a variável de ambiente

1. Acesse https://vercel.com/dashboard > selecione seu projeto
2. Settings > Environment Variables
3. Crie uma variável chamada `OPENAI_API_KEY` com seu valor da OpenAI
4. Deploy automático (se conectado ao Git) ou clique "Deploy"

### 1.3 Configure a URL no front-end

No arquivo `script.js`, descomente e altere a linha:

```js
serverlessUrl = 'https://seu-projeto.vercel.app/api/generate';
```

---

## Opção 2: Netlify Functions

### 2.1 Copie o arquivo da função

Crie um arquivo `/netlify/functions/generate.js`:

```js
// /netlify/functions/generate.js
exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const payload = JSON.parse(event.body || '{}');
    const prompt = buildPrompt(payload);

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are Gother.IA, a thoughtful philosopher that summarizes leadership diagnostics in a reflective, constructive tone. Answer only in Portuguese.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 700
      })
    });

    const data = await r.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error(data.error?.message || 'No response from OpenAI');
    }
    const content = data.choices[0].message.content;
    return { statusCode: 200, body: JSON.stringify({ result: content }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};

function buildPrompt(payload) {
  const { catAverages, catDetails, overall } = payload || {};
  let s = `Você é Gother.IA. Recebeu um diagnóstico com média geral ${Number(overall).toFixed(2)}. Resuma em tom filosófico e reflexivo (máximo 5-6 linhas): onde está acertando, áreas de atenção e onde precisa melhorar. Use frases concisas e sugestões práticas.\n\n`;
  if (Array.isArray(catDetails)) {
    s += 'Detalhes por categoria:\n';
    catDetails.forEach(d => { s += `- ${d.title}: ${Number(d.avg).toFixed(2)}\n`; });
  }
  return s;
}
```

### 2.2 Defina a variável de ambiente

1. Acesse seu app no painel Netlify
2. Site settings > Build & deploy > Environment > Edit variables
3. Crie `OPENAI_API_KEY` com seu valor
4. Make sure you have `netlify.toml` in the root (Netlify auto-detects functions)

### 2.3 Configure a URL no front-end

No arquivo `script.js`:

```js
serverlessUrl = 'https://seu-site.netlify.app/.netlify/functions/generate';
```

---

## Obtenha sua chave OpenAI

1. Acesse https://platform.openai.com/api-keys
2. Crie uma chave nova (ou use uma existente)
3. Cole o valor na variável de ambiente do seu provider (Vercel/Netlify)
4. **Nunca** compartilhe essa chave publicamente

---

## Como testar

1. Descomente e defina `serverlessUrl` em `script.js`
2. Abra index.html no navegador
3. Responda às perguntas e clique "Calcular Resultado"
4. A barra de loading deve aparecer por 3s, depois Gother.IA gerará um resumo via ChatGPT

Se algo der errado, abra o console (F12 > Console) e procure por erros.

---

## Fallback automático

Se a função serverless não responder (erro, URL vazia, etc.), o front-end usará automaticamente o banco local de `frases.json`. Nenhuma perda de funcionalidade!

---

## Custos e limites

- **OpenAI**: charged per token. Modele `gpt-4o-mini` é barato (~$0.00015 por 1K tokens)
- **Vercel / Netlify**: funções podem ter limites de tempo ou requisições (verificar plano)
- Recomendação: implemente rate limiting ou validação de entrada no servidor para evitar abuso

---

## Próximos passos

Após deploy:
1. Copie a URL da função (Vercel: `https://seu-projeto.vercel.app/api/generate`)
2. Atualize `serverlessUrl` em `script.js`
3. Teste no navegador
4. Commit e envie para GitHub Pages

Pronto!
