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
   - Você deve copiar os valores abaixo (conforme seu `firebase-applet-config.json`) para as chaves na Vercel:
     - `VITE_FIREBASE_API_KEY` ➡️ `AIzaSyA3Mms7btL6eGHa3zc4wEUycFICZBlkXVU`
     - `VITE_FIREBASE_AUTH_DOMAIN` ➡️ `gen-lang-client-0044483065.firebaseapp.com`
     - `VITE_FIREBASE_PROJECT_ID` ➡️ `gen-lang-client-0044483065`
     - `VITE_FIREBASE_STORAGE_BUCKET` ➡️ `gen-lang-client-0044483065.firebasestorage.app`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID` ➡️ `32186434162`
     - `VITE_FIREBASE_APP_ID` ➡️ `1:32186434162:web:f46837f51a40712ea5f8eb`
     - `VITE_FIREBASE_DATABASE_ID` ➡️ `ai-studio-07872c3e-3c24-439c-974a-6f2aa4b49a94`

## ⚠️ ERRO DE LOGIN NA VERCEL? (IMPORTANTE)
Se o botão "Entrar com Google" não funcionar na Vercel (o popup fecha e nada acontece), você **PRECISA** fazer isso:
1. Acesse o [Console do Firebase](https://console.firebase.google.com/u/0/project/gen-lang-client-0044483065/authentication/settings).
2. Vá em **Authentication** > guia **Settings** > **Authorized Domains**.
3. Clique em **Add domain** e cole o domínio da sua Vercel (ex: `perto-de-deus.vercel.app`).
4. Também verifique no [Google Cloud Console](https://console.cloud.google.com/) em **APIs & Services** > **Credentials**, se o domínio está na lista de **Authorized JavaScript origins** no cliente OAuth 2.0 Web.

## Notas sobre o Backend (Vercel)
Este projeto foi otimizado para a Vercel utilizando **Serverless Functions**. 
- O arquivo `api/tts.ts` gerencia a síntese de voz (TTS) automaticamente quando deployed na Vercel.
- O arquivo `server.ts` é mantido apenas para referência ou para rodar o backend localmente com `npm run dev:server` (se configurado).
- O arquivo `vercel.json` garante que as rotas do React (SPA) funcionem e que as chamadas para `/api/*` sejam encaminhadas corretamente.

## Estrutura SPA
O arquivo `vercel.json` já está incluído para garantir que as rotas do React funcionem corretamente (rewrites).
