// Baixa os ícones com o better-icons (Iconify) e gera src/components/icon-data.ts.
// Uso: npm run icons
// Para achar um ícone novo: npx better-icons search "carrinho" --prefix lucide --limit 10
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const ICONES = [
  "lucide:search", "lucide:menu", "lucide:x", "lucide:message-circle", "lucide:mail", "lucide:phone",
  "lucide:map-pin", "lucide:globe", "lucide:database", "lucide:chart-column", "lucide:smartphone",
  "lucide:check", "lucide:chevron-down", "lucide:chevron-right", "lucide:circle-alert",
  "lucide:corner-down-left", "lucide:house", "lucide:clock", "lucide:shield-check", "lucide:send",
  "lucide:loader-circle", "lucide:file-text", "lucide:code", "lucide:sun", "lucide:moon", "lucide:sparkles",
];

const dados = {};
for (const id of ICONES) {
  const svg = execSync(`better-icons get ${id}`, { encoding: "utf8" });
  // guarda só o miolo do <svg>; o componente <Icon> cuida de tamanho, traço e cor
  // Lucide é só traço: o better-icons às vezes põe fill="currentColor" nas formas internas
  // (mail, map-pin, clock...), o que pinta o ícone por dentro. Tiramos esse preenchimento.
  const miolo = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/ fill="currentColor"/g, "").trim();
  dados[id.split(":")[1]] = miolo;
  console.log("ok", id);
}

const corpo = Object.entries(dados).map(([k, v]) => `  "${k}": ${JSON.stringify(v)},`).join("\n");
writeFileSync(
  new URL("../src/components/icon-data.ts", import.meta.url),
  `// Gerado por scripts/icons.mjs (better-icons, coleção Lucide do Iconify). Não edite à mão.
// Para trocar ou adicionar ícones: edite a lista em scripts/icons.mjs e rode \`npm run icons\`.
export const iconData = {
${corpo}
} as const;

export type IconName = keyof typeof iconData;
`
);
console.log(`${ICONES.length} ícones gravados em src/components/icon-data.ts`);
