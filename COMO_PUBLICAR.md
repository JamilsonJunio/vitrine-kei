# 🚀 Como Publicar sua Loja no Netlify

Para que seu site fique online e acessível para todos, siga estes passos simples:

### 1. Preparação dos Arquivos
Certifique-se de que todos os arquivos estão na pasta `kei-sampaio-loja`:
- `index.html` (Loja)
- `admin.html` (Painel)
- `css/style.css`
- `js/script.js`
- `js/admin.js`
- `img/` (Suas fotos iniciais)

### 2. Opção A: Arrastar e Soltar (Mais Rápido)
1. Acesse [Netlify.com](https://www.netlify.com/) e faça login.
2. Vá em **Sites** > **Add new site** > **Deploy manually**.
3. Arraste a pasta `kei-sampaio-loja` inteira para dentro do quadrado indicado.
4. Seu site ganhará um endereço como `https://nome-aleatorio.netlify.app`. 
5. Você pode mudar esse nome em **Domain Settings** > **Options** > **Edit site name**.

### 3. Opção B: GitHub (Recomendado para Atualizações)
1. Crie um repositório no GitHub chamado `vitrine-kei`.
2. Suba seus arquivos para lá.
3. No Netlify, escolha **Import from git**.
4. Selecione o seu repositório.
5. Agora, toda vez que você atualizar o código (ou eu atualizar para você), o site na internet muda sozinho!

### 💡 Dica Amiga
- O endereço do seu painel será: `https://seu-site.netlify.app/admin.html`
- Como estamos usando `localStorage`, se você trocar de computador, os dados do Admin não aparecerão. Para uma solução profissional que salve em qualquer lugar, podemos integrar com o **Google Sheets** no futuro!

---
*Assinado: Antigravity AI* 🌸✨
