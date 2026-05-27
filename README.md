# Projeto Simples (HTML/CSS/JS)

Arquivos:
# Diagnóstico de Liderança — Aplicação local

Arquivos:
- index.html
- styles.css
- script.js

Descrição:
Aplicação de autoavaliação baseada em categorias de liderança. Permite atribuir notas de 0 a 5 para cada pergunta, calcular médias por categoria, visualizar um gráfico radar e ver uma classificação final. Não há backend nem armazenamento de dados — tudo acontece apenas em tela.

Como usar:
Abra [index.html](index.html) no navegador e responda às perguntas. Clique em "Calcular Resultado" para ver médias e o gráfico.

Sumarização automática (client-side):
- Clique em "Resumo" para gerar um resumo básico e sugestões automatizadas diretamente no navegador. Esta função é 100% local e não envia dados a nenhum servidor.
Gother.IA:
- O resumo automático é gerado localmente por "Gother.IA". Ao clicar em "Calcular Resultado" o sistema mostra o resultado numérico e o gráfico imediatamente; em seguida Gother.IA apresenta um resumo automático após uma pequena animação de carregamento (simulando o tempo de análise).
Gother.IA:
- O resumo automático é gerado localmente por "Gother.IA" (personalidade: filósofo). Ao clicar em "Calcular Resultado" o sistema mostra o resultado numérico e o gráfico imediatamente; em seguida Gother.IA apresenta um resumo automático após uma pequena animação de carregamento (simulando o tempo de análise).
- O resumo vem estruturado em: "Onde está acertando", "Áreas que merecem atenção" e "Onde precisa melhorar / Atenção", com sugestões práticas escritas em tom reflexivo.

Logo:
- Coloque sua imagem de logo em `img/logo.png`. O arquivo será exibido no canto superior esquerdo como representação do Gother.IA.

Banco de frases (`frases.json`):
- O arquivo `frases.json` contém um pequeno banco local de respostas (id, tipo, nota, mensagem) usado por Gother.IA para escolher respostas automáticas quando não houver integração com um LLM.

Integração com ChatGPT (opção recomendada: servidor intermediário)
- Por segurança não exponha sua chave da OpenAI no front-end. Recomenda-se criar uma função serverless (Netlify Functions, Vercel, GitHub Actions, ou um pequeno endpoint) que receba o resumo/inputs e chame a API do OpenAI, retornando o texto ao cliente.

Exemplo de fluxo simplificado (serverless):

1) Front-end envia POST para `/api/generate` com o payload (médias, detalhes).
2) `/api/generate` (node) chama a OpenAI com sua chave e prompt e devolve a resposta.

Exemplo mínimo (Node/Express server) — não coloque a chave no browser:

```js
// /api/generate
const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());
app.post('/generate', async (req, res) => {
	const payload = req.body; // médias e detalhes
	const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_KEY}` },
		body: JSON.stringify({ model: 'gpt-4o-mini', messages:[{role:'user', content:JSON.stringify(payload)}] })
	});
	const data = await openaiResp.json();
	res.json(data);
});
```

Integração serverless pronta:
- Veja `serverless/SETUP.md` para instruções completas de deploy (Vercel ou Netlify).
- Copie `serverless/vercel-generate.js` ou `serverless/netlify-generate.js` para seu provider.
- Defina a variável `OPENAI_API_KEY` no painel.
- Descomente `serverlessUrl` em `script.js` com a URL da sua função.
- Para hospedar em GitHub Pages (gratuito), mantenha o fallback local com `frases.json` (sempre funciona).
Abra `index.html` no navegador (duplo clique) e interaja com o botão e o alternador de tema.
