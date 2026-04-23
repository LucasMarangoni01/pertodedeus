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
   - Você precisará copiar os valores do seu `firebase-applet-config.json` para as seguintes chaves na Vercel:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_DATABASE_ID` (Geralmente é `(default)`)

## ⚠️ ERRO DE LOGIN NA VERCEL? (IMPORTANTE)
Se o botão "Entrar com Google" não funcionar na Vercel, você **DEVE** autorizar o novo domínio no Firebase:
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Vá em **Authentication** > guia **Settings** > **Authorized Domains**.
3. Adicione o domínio da sua Vercel (ex: `perto-de-deus.vercel.app`).
4. Também verifique no [Google Cloud Console](https://console.cloud.google.com/) em **APIs & Services** > **Credentials**, se o domínio está na lista de **Authorized JavaScript origins**.

## Notas sobre o Backend
Este projeto é primariamente uma SPA (Single Page Application). Se você deseja utilizar o backend de TTS (`server.ts`), será necessário configurar a Vercel para rodar Serverless Functions ou hospedar o backend separadamente. Para uso comum, a versão atual prioriza o processamento via Firebase e APis do navegador.

## Estrutura SPA
O arquivo `vercel.json` já está incluído para garantir que as rotas do React funcionem corretamente (rewrites).
