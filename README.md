# Site da apantech (React)

React 19 pré-renderizado em HTML estático: cada página sai pronta do build (bom para SEO e para redes lentas) e o React assume no navegador para as partes interativas.

## Primeiros passos

```bash
npm install          # instala React, esbuild, TypeScript e o better-icons
npm run icons        # baixa os ícones Lucide com o better-icons e gera src/components/icon-data.ts
npm run build        # gera a pasta dist/ pronta para hospedar
npm run preview      # build + servidor local em http://localhost:4173
npm run typecheck    # checagem de tipos
```

Para achar um ícone novo: `npx better-icons search "carrinho" --prefix lucide --limit 10`. Depois adicione o ID em `scripts/icons.mjs` e rode `npm run icons`.

## Antes de publicar

- `src/config.ts`: endereço, CNPJ, razão social, telefone, WhatsApp, domínio, ID do Google Analytics 4 e o endpoint do formulário.
- As regras de cache, HTTPS e a página 404 já vêm prontas para Apache/Hostinger (`.htaccess`), Netlify/Cloudflare Pages (`_headers`) e Vercel (`vercel.json`).

## Deploy (Hostinger, automático)

Todo push na branch `main` publica o site sozinho, pelo GitHub Actions (`.github/workflows/deploy.yml`):
checa os tipos, roda o build e envia por FTP só os arquivos que mudaram. Pull requests só checam e geram o build, sem publicar.

Configuração única, em **Settings → Secrets and variables → Actions** do repositório:

| Tipo | Nome | Valor |
|---|---|---|
| Secret | `FTP_SERVER` | servidor FTP do hPanel (Arquivos → Contas FTP), ex.: `ftp.apantech.com.br` |
| Secret | `FTP_USERNAME` | usuário FTP |
| Secret | `FTP_PASSWORD` | senha FTP |
| Variable | `FTP_DIR` | pasta do site no servidor, terminando em `/` (padrão `public_html/`) |

Para publicar sem commit: aba **Actions → Deploy na Hostinger → Run workflow**.

## Estrutura

```
src/
  App.tsx              layout comum (intro, header, rodapé, busca, cookies, CTA fixo)
  config.ts            dados da empresa e chaves
  routes.ts            páginas, títulos e descrições
  styles.css           tokens do shadcn/ui e de movimento do Animate UI
  components/          Intro, Header, SearchDialog, Interactive (abas, accordion), ContactForm, Chrome
  pages/               Home e as demais páginas
build.mjs              esbuild + renderToString, hash nos arquivos, sitemap, robots, cache
public/                fontes (Inter 400 e 600), imagens AVIF/WebP, favicons, imagem OG
```
