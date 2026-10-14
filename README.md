# 🕊️ Perto de Deus (v1.1.0)

Uma plataforma cristã completa e moderna para uma vida espiritual profunda — com Bíblia Digital e Física, cronômetro inteligente com seleção de versículos, registro automático de estatísticas na conta, orações, devocionais e inteligência pastoral.

---

## 🌟 O Que Há de Novo na Versão 1.2.0

1. **✝️ Bíblia Sagrada Católica Completa (Cânon de 73 Livros):**
   - Suporte integral ao cânon católico com os **7 Livros Deuterocanônicos**: Tobias, Judite, Sabedoria, Eclesiástico (Sirácida), Baruque, 1 Macabeus e 2 Macabeus.
   - Versões católicas integradas: **Bíblia da CNBB (Conferência Nacional dos Bispos do Brasil)** e **Matos Soares (Tradicional Católica)**.
   - Aba rápida no leitor bíblico para alternar entre Antigo Testamento, Novo Testamento e Livros Católicos/Deuterocanônicos.
   - Selo distintivo "Católico" em cada livro deuterocanônico.

2. **📖 Suporte a Bíblia Física no Cronômetro:**
   - Modo exclusivo para quem lê a Bíblia impressa/física (católica ou tradicional), com interface em papiro dourado e marcador de página espiritual.
   - Memorização do seu último marcador físico para continuar exatamente de onde parou.

3. **🎯 Seleção de Versículos (De ... Até):**
   - Escolha o versículo inicial e o versículo final da leitura (ex: Tobias 1:1 até 1:25).
   - Cálculo automático do total de versículos planejados e lidos.
   - Pré-visualização do trecho selecionado para inspiração.

4. **📊 Registro Automático nas Estatísticas da Conta:**
   - **Ao clicar em Começar o Cronômetro:** O início da sessão é imediatamente registrado no Firebase Firestore, incrementando o contador de inícios de leitura e salvando a passagem planejada.
   - **Ao concluir:** Salva tempo total, versículos lidos, progresso da meta diária e ganho de pontos de fé (XP).
   - Histórico completo acessível na aba Histórico e no Perfil do usuário.

5. **🙏 Espaço de Devoção "Catolicismo":**
   - Seção dedicada para orações católicas tradicionais, Santo Terço com mistérios meditados, os 7 Sacramentos e aprofundamento bíblico.

---

## 🚀 Como Colocar a Nova Versão no GitHub

### Opção A: Se você já tem o repositório no GitHub (Atualizar versão)

Abra o terminal na pasta do projeto e execute:

```bash
# 1. Verifique as alterações
git status

# 2. Adicione todos os arquivos modificados
git add .

# 3. Crie o commit com a nova versão
git commit -m "feat(v1.1.0): biblia fisica no cronometro, selecao de versiculos e estatisticas na conta"

# 4. Envie para o GitHub
git push origin main
```

*(Se a sua branch principal for `master`, use `git push origin master`)*

---

### Opção B: Se for a primeira vez enviando para o GitHub

1. Crie um novo repositório vazio no [GitHub](https://github.com/new) (não marque "Add README").
2. No seu terminal, na pasta do projeto, execute:

```bash
# 1. Inicialize o repositório git
git init

# 2. Adicione todos os arquivos
git add .

# 3. Faça o primeiro commit
git commit -m "feat: versão inicial 1.1.0 Perto de Deus"

# 4. Defina o ramo principal como main
git branch -M main

# 5. Conecte ao seu repositório no GitHub (substitua com a sua URL)
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git

# 6. Envie o código
git push -u origin main
```

---

## 💻 Como Rodar o Projeto Localmente

### Pré-requisitos
- **Node.js** (versão 20 ou superior recomendada)
- **npm** ou **yarn** / **pnpm**

### Passos

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   Preencha sua chave `GEMINI_API_KEY` (obtenha gratuitamente no [Google AI Studio](https://aistudio.google.com/app/apikey)).
   *(As configurações do Firebase já possuem fallback integrado com o projeto)*.

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse no navegador: `http://localhost:3000`

4. **Para gerar a build de produção:**
   ```bash
   npm run build
   npm start
   ```

---

## 🌐 Deploy na Vercel (Recomendado)

1. Conecte seu repositório do GitHub na [Vercel](https://vercel.com).
2. O arquivo `vercel.json` já está configurado para garantir o roteamento SPA (sem erros 404 ao atualizar páginas como `/bible`, `/cronometro` ou `/catolicismo`).
3. Nas configurações do projeto na Vercel (**Settings** > **Environment Variables**), adicione sua `GEMINI_API_KEY`.
4. Faça o deploy!

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion (Framer Motion).
- **Backend / API:** Node.js, Express, Google Gen AI SDK (`@google/genai`), Edge TTS (`node-edge-tts`).
- **Banco de Dados & Autenticação:** Firebase Firestore & Firebase Auth com regras de segurança ativas.
- **Mapas & Comunidade:** Leaflet & React-Leaflet.

---

Feito com fé e devoção para aproximar pessoas de Deus.
