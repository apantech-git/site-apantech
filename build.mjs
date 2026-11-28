// Build do site: React pré-renderizado em HTML estático + hidratação no navegador.
//   node build.mjs              → dist/ (para hospedar)
//   node build.mjs --relative   → preview/ (caminhos relativos, para abrir de uma subpasta)
import { build, transform } from "esbuild";
import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const RELATIVE = process.argv.includes("--relative");
const OUT = join(ROOT, RELATIVE ? "preview" : "dist");
const TMP = join(ROOT, ".tmp");
const hash = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 10);
const IMUT = "public, max-age=31536000, immutable";

rmSync(OUT, { recursive: true, force: true });
rmSync(TMP, { recursive: true, force: true });
mkdirSync(join(OUT, "assets"), { recursive: true });
cpSync(join(ROOT, "public"), OUT, { recursive: true });

// 1) fontes e imagens com hash no nome
const manifest = {};
for (const dir of ["fonts", "img"]) {
  for (const f of readdirSync(join(OUT, dir))) {
    const p = join(OUT, dir, f);
    const novo = `${basename(f, extname(f))}.${hash(readFileSync(p))}${extname(f)}`;
    renameSync(p, join(OUT, dir, novo));
    manifest[`/${dir}/${f}`] = `/${dir}/${novo}`;
  }
}
const trocar = (txt) => Object.entries(manifest).reduce((t, [a, b]) => t.split(a).join(b), txt);

// 2) CSS
let css = (await transform(trocar(readFileSync(join(ROOT, "src/styles.css"), "utf8")), { loader: "css", minify: true })).code;
if (RELATIVE) css = css.replace(/url\(\/fonts\//g, "url(../fonts/");
const cssFile = `/assets/styles.${hash(css)}.css`;
writeFileSync(join(OUT, cssFile), css);

// 3) JS do navegador e bundle do servidor (para pré-renderizar)
const define = { __ASSETS__: JSON.stringify(manifest), "process.env.NODE_ENV": '"production"' };
const client = await build({
  entryPoints: [join(ROOT, "src/entry-client.tsx")], bundle: true, minify: true, format: "esm", target: "es2020",
  jsx: "automatic", define, write: false, legalComments: "none",
});
let js = client.outputFiles[0].text;
await build({
  entryPoints: [join(ROOT, "src/entry-server.tsx")], bundle: true, platform: "node", format: "esm", packages: "external",
  jsx: "automatic", define, outfile: join(TMP, "server.mjs"),
});
const { render, ROTAS, empresa } = await import(pathToFileURL(join(TMP, "server.mjs")).href);
const SITE = empresa.site;
// domínio com www: o .htaccess manda o endereço sem www para ele
const WWW = (() => { const host = new URL(SITE).host; return host.startsWith("www.") ? { host, apex: host.slice(4) } : null; })();

// caminhos relativos para a prévia
const rel = (s) =>
  s.replace(/(["'`])\/#/g, "$1index.html#")
   .replace(/(["'`])\/(["'`])/g, "$1index.html$2")
   .replace(/(["'`])\/(img|fonts|assets|contato|servicos|quem-somos|privacidade|termos|obrigado|404|favicon|apple-touch|icon-|site\.webmanifest)/g, "$1$2")
   .replace(/((?:srcset|srcSet)="[^"]*")/g, (m) => m.replace(/, \//g, ", "));
if (RELATIVE) js = rel(js);
const jsFile = `/assets/app.${hash(js)}.js`;
writeFileSync(join(OUT, jsFile), js);

// 4) páginas
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const ld = JSON.stringify({
  "@context": "https://schema.org", "@type": "ProfessionalService", name: "apantech", ...(empresa.razao.startsWith("[") ? {} : { legalName: empresa.razao }), taxID: empresa.cnpj,
  description: "Desenvolvimento de sites, sistemas web, dashboards e aplicativos Android e iOS sob demanda.",
  url: SITE + "/", logo: SITE + "/icon-512.png", image: SITE + "/og-image.jpg", email: empresa.email, telephone: empresa.telLink,
  address: { "@type": "PostalAddress", streetAddress: empresa.rua, addressLocality: empresa.cidade, addressRegion: empresa.uf, postalCode: empresa.cep, addressCountry: "BR" },
  areaServed: "BR",
});
// roda antes da pintura: tema salvo (ou do sistema) e intro na 1ª página da sessão e a cada recarga (F5) da página inicial
const boot = `(function(d){try{var t=localStorage.getItem("apantech-tema");if(t==="escuro"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))d.classList.add("dark");var n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0],r=n?n.type==="reload":performance.navigation&&performance.navigation.type===1,h=/^\\/(index(\\.html)?)?$/.test(location.pathname);if((r&&h)||!sessionStorage.getItem("apantech-intro"))d.classList.add("has-intro")}catch(e){}})(document.documentElement)`;

for (const r of ROTAS) {
  const url = SITE + r.url;
  let html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(r.title)}</title>
<meta name="description" content="${esc(r.desc)}">
<meta name="robots" content="${r.noindex ? "noindex, follow" : "index, follow, max-image-preview:large"}">
${r.noindex ? "" : `<link rel="canonical" href="${url}">`}
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="apantech">
<meta property="og:title" content="${esc(r.title)}">
<meta property="og:description" content="${esc(r.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="apantech: sites, sistemas e apps sob medida.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(r.title)}">
<meta name="twitter:description" content="${esc(r.desc)}">
<meta name="twitter:image" content="${SITE}/og-image.jpg">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="${manifest["/fonts/inter-400.woff2"]}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${manifest["/fonts/inter-600.woff2"]}" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${manifest["/fonts/michroma-400.woff2"]}" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${cssFile}">
<script>${boot}</script>
<script type="module" src="${jsFile}"></script>
${r.id === "home" ? `<script type="application/ld+json">${ld}</script>` : ""}
</head>
<body>
<div id="root" data-route="${r.id}">${render(r.id)}</div>
</body>
</html>
`;
  if (RELATIVE) html = rel(html.replace(/(href|src)="\/"/g, '$1="index.html"').replace(/(href|src|srcSet|srcset)="\//g, '$1="'));
  writeFileSync(join(OUT, r.arquivo), html);
}

// 5) SEO e PWA
const hoje = new Date().toISOString().slice(0, 10);
writeFileSync(join(OUT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ROTAS.filter((r) => !r.noindex).map((r) => `  <url><loc>${SITE}${r.url}</loc><lastmod>${hoje}</lastmod><priority>${r.prioridade}</priority></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /obrigado.html\n\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(OUT, "site.webmanifest"), JSON.stringify({
  name: "apantech", short_name: "apantech", lang: "pt-BR", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#0a0a0a",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}, null, 2));

// 6) cache no navegador: arquivos com hash = 1 ano imutável; HTML sempre revalida
if (!RELATIVE) {
  writeFileSync(join(OUT, "_headers"), `/assets/*\n  Cache-Control: ${IMUT}\n/fonts/*\n  Cache-Control: ${IMUT}\n/img/*\n  Cache-Control: ${IMUT}\n/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n/\n  Cache-Control: public, max-age=0, must-revalidate\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);
  writeFileSync(join(OUT, "vercel.json"), JSON.stringify({
    cleanUrls: false,
    headers: [
      { source: "/(assets|fonts|img)/(.*)", headers: [{ key: "Cache-Control", value: IMUT }] },
      { source: "/(.*)\\.(png|jpg|ico|svg|webmanifest)", headers: [{ key: "Cache-Control", value: "public, max-age=604800" }] },
      { source: "/(.*)\\.html", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }] },
    ],
  }, null, 2));
  writeFileSync(join(OUT, ".htaccess"), `# Apache / hospedagens compartilhadas (Hostinger, Locaweb, HostGator...)
ErrorDocument 404 /404.html
Options -Indexes
# arquivo de controle do deploy automático (GitHub Actions → FTP): não deve ser público
<Files ".ftp-deploy-sync-state.json">
  Require all denied
</Files>
<IfModule mod_mime.c>
  AddType image/avif .avif
  AddType image/webp .webp
  AddType font/woff2 .woff2
  AddType application/manifest+json .webmanifest
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript text/javascript image/svg+xml application/manifest+json application/xml
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "\\.[0-9a-f]{10}\\.(css|js|woff2|avif|webp)$">
    Header set Cache-Control "${IMUT}"
  </FilesMatch>
  <FilesMatch "\\.(png|jpg|ico|svg|webmanifest)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
  <FilesMatch "\\.(html|xml|txt)$">
    Header set Cache-Control "public, max-age=0, must-revalidate"
  </FilesMatch>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
<IfModule mod_rewrite.c>
  RewriteEngine On
${WWW ? `  # sem www → www, já em HTTPS (um só redirecionamento)
  RewriteCond %{HTTP_HOST} ^${WWW.apex.replace(/\./g, "\\.")}$ [NC]
  RewriteRule ^ https://${WWW.host}%{REQUEST_URI} [L,R=301]
` : ""}  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
`);
}
rmSync(TMP, { recursive: true, force: true });
console.log(`ok: ${ROTAS.length} páginas em ${basename(OUT)}/ · JS ${(js.length / 1024).toFixed(0)} KB · CSS ${(css.length / 1024).toFixed(0)} KB`);
