// Servidor local para testar o build: node scripts/serve.mjs  →  http://localhost:4173
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = fileURLToPath(new URL("../dist/", import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json" };

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";
  const file = normalize(join(DIR, path));
  try {
    if (!file.startsWith(DIR)) throw new Error("fora");
    const body = await readFile(file);
    const hashed = /\.[0-9a-f]{10}\./.test(path);
    const type = TYPES[extname(file)] || "application/octet-stream";
    const gz = /text|javascript|svg|xml|json/.test(type) && /gzip/.test(req.headers["accept-encoding"] || "");
    res.writeHead(200, { "Content-Type": type, "Cache-Control": hashed ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate", ...(gz ? { "Content-Encoding": "gzip", Vary: "Accept-Encoding" } : {}) });
    res.end(gz ? gzipSync(body) : body);
  } catch {
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    res.end(await readFile(join(DIR, "404.html")));
  }
}).listen(4173, () => console.log("http://localhost:4173"));
