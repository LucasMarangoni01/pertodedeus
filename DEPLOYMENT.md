# Guia de Deploy - Perto de Deus

Este projeto está pronto para ser enviado para a **Vercel** ou qualquer plataforma de hospedagem estática.

## Passos para Deploy na Vercel

1. **Importe o Projeto:** Conecte seu repositório GitHub à Vercel.
2. **Configurações de Build:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. **Variáveis de Ambiente:** No painel da Vercel, adicione as variáveis necessárias que estão no seu `.env.example`. 
   - Note que para o Vite, variáveis públicas devem começar com `VITE_`.
   - Exemplo: `VITE_GEMINI_API_KEY`, etc.

## Notas sobre o Backend
Este projeto é primariamente uma SPA (Single Page Application). Se você deseja utilizar o backend de TTS (`server.ts`), será necessário configurar a Vercel para rodar Serverless Functions ou hospedar o backend separadamente. Para uso comum, a versão atual prioriza o processamento via Firebase e APis do navegador.

## Estrutura SPA
O arquivo `vercel.json` já está incluído para garantir que as rotas do React funcionem corretamente (rewrites).
