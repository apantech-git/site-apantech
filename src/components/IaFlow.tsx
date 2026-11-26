import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./icon-data";

/**
 * Seção "Onde a IA entra": um editor de código que se escreve sozinho, etapa por etapa
 * (rascunho → testes → revisão de segurança → documentação), com o terminal mostrando o resultado.
 *
 * - O HTML do servidor já vem com a 1ª etapa completa (sem JS, o visitante ainda vê o código).
 * - A digitação só começa quando o editor entra na tela e pausa fora dela ou com a aba escondida.
 * - Clicar numa etapa pula para ela.
 * - Movimento reduzido: sem digitação; cada etapa aparece inteira e troca a cada 5 s.
 */
type Stage = {
  icon: IconName; titulo: string; desc: string;
  file: string; lang: "ts" | "md"; agent: string; done: string;
  code: string[]; term: string[];
};

const STAGES: Stage[] = [
  {
    icon: "code", titulo: "Rascunho de código", desc: "A IA gera a base a partir do briefing; o desenvolvedor revisa linha por linha.",
    file: "pedidos.ts", lang: "ts", agent: "IA escrevendo", done: "Rascunho pronto",
    code: [
      "// rascunho da IA a partir do briefing",
      "export async function criarPedido(p: Pedido) {",
      "  const cliente = await buscar(p.cliente);",
      '  if (!cliente) throw new Erro("Sem cliente");',
      "  return db.pedidos.salvar({",
      '    ...p, status: "novo",',
      "  });",
      "}",
    ],
    term: ["$ apantech rascunho pedidos", "✓ 1 função gerada em 0,8 s", "→ enviado para revisão do desenvolvedor"],
  },
  {
    icon: "check", titulo: "Testes automáticos", desc: "Cada alteração roda os testes antes de chegar ao endereço de teste.",
    file: "pedidos.test.ts", lang: "ts", agent: "IA escrevendo testes", done: "Testes passando",
    code: [
      'test("pedido nasce como novo", async () => {',
      "  const p = await criarPedido(exemplo);",
      '  expect(p.status).toBe("novo");',
      "});",
      "",
      'test("recusa cliente inexistente", () => {',
      "  expect(criarPedido(semCliente)).rejects;",
      "});",
    ],
    term: ["$ npm test", "✓ pedido nasce como novo  12 ms", "✓ recusa cliente inexistente  4 ms", "Testes: 2 passaram, 0 falharam"],
  },
  {
    icon: "shield-check", titulo: "Revisão de segurança", desc: "Um desenvolvedor aprova o código, e dados de clientes ficam fora das ferramentas de IA.",
    file: "pedidos.ts", lang: "ts", agent: "Dev revisando", done: "Aprovado",
    code: [
      "// revisão: validar a entrada antes de salvar",
      "const dados = PedidoSchema.parse(entrada);",
      "",
      "// dados de clientes não saem para a IA",
      "const briefing = anonimizar(textoOriginal);",
    ],
    term: ["$ npm run seguranca", "✓ 0 vulnerabilidades nas dependências", "✓ nenhum dado pessoal enviado à IA", "✓ aprovado na revisão de código"],
  },
  {
    icon: "file-text", titulo: "Documentação", desc: "Você recebe instruções para instalar, manter e evoluir o sistema.",
    file: "README.md", lang: "md", agent: "IA documentando", done: "Publicado",
    code: [
      "# Sistema de pedidos",
      "",
      "## Como rodar",
      "npm install",
      "npm run dev",
      "",
      "## Como publicar",
      "npm run deploy",
    ],
    term: ["$ git push", "✓ testes passaram (2/2)", "✓ publicado no endereço de teste", "→ abra no celular para conferir"],
  },
];
const FILES = [...new Set(STAGES.map((s) => s.file))];
const TEXT = STAGES.map((s) => s.code.join("\n"));

/* ---------- realce de sintaxe (simples, feito na carga do módulo) ---------- */
type Tok = [cls: string, text: string];
const TS_RX = /(\/\/.*)|("[^"]*")|\b(export|async|function|const|await|if|throw|new|return)\b|\b([A-Z]\w*)\b|([a-z_]\w*)(?=\()|(\.\.\.|[{}()[\];,.:=!])/g;
function tokTs(line: string): Tok[] {
  const out: Tok[] = [];
  let last = 0;
  for (const m of line.matchAll(TS_RX)) {
    if (m.index > last) out.push(["", line.slice(last, m.index)]);
    const cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "k" : m[4] ? "t" : m[5] ? "f" : "p";
    out.push([cls, m[0]]);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(["", line.slice(last)]);
  return out;
}
const tokMd = (line: string): Tok[] => (line.startsWith("#") ? [["h", line]] : line ? [["", line]] : []);
const TOKENS = STAGES.map((s) => s.code.map(s.lang === "ts" ? tokTs : tokMd));

/* ---------- estado da digitação ---------- */
type Pos = { s: number; c: number; t: number }; // etapa, caracteres digitados, linhas do terminal
const full = (s: number): Pos => ({ s, c: TEXT[s].length, t: STAGES[s].term.length });

export function IaFlow() {
  const [pos, setPos] = useState<Pos>(() => full(0));
  const box = useRef<HTMLDivElement>(null);
  const go = useRef<(s: number) => void>(() => {});

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let p = full(0), timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false, started = false, pending = 0;

    const set = (n: Pos) => { p = n; setPos(n); };
    const delayFor = (n: Pos) => {
      const text = TEXT[n.s], term = STAGES[n.s].term;
      if (reduce) return 5200;
      if (n.c < text.length) return text[n.c - 1] === "\n" ? 190 : 22 + Math.random() * 34;
      if (n.t === 0) return 420;
      if (n.t < term.length) return 360;
      return 2800; // segura a etapa pronta antes de seguir
    };
    const schedule = (ms: number) => {
      clearTimeout(timer);
      pending = ms;
      if (visible && !document.hidden) timer = setTimeout(tick, ms);
    };
    const tick = () => {
      const text = TEXT[p.s];
      let n: Pos;
      if (reduce) n = full((p.s + 1) % STAGES.length);
      else if (p.c < text.length) {
        const k = text[p.c] === " " && text[p.c + 1] === " " ? 2 : Math.random() < 0.25 ? 2 : 1;
        n = { ...p, c: Math.min(text.length, p.c + k) };
      } else if (p.t < STAGES[p.s].term.length) n = { ...p, t: p.t + 1 };
      else n = { s: (p.s + 1) % STAGES.length, c: 0, t: 0 };
      set(n);
      schedule(delayFor(n));
    };

    go.current = (s) => {
      started = true;
      set(reduce ? full(s) : { s, c: 0, t: 0 });
      schedule(reduce ? 5200 : 260);
    };

    const resume = () => {
      if (!started) {
        started = true;
        if (reduce) schedule(5200);
        else { set({ s: 0, c: 0, t: 0 }); schedule(500); }
      } else schedule(Math.min(pending || 300, 600));
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) resume(); else clearTimeout(timer);
    }, { threshold: 0.35 });
    io.observe(el);
    const onVis = () => { if (document.hidden) clearTimeout(timer); else if (visible) resume(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); clearTimeout(timer); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const st = STAGES[pos.s];
  const text = TEXT[pos.s];
  const typing = pos.c < text.length;
  const progress = (pos.c / text.length) * 0.7 + (pos.t / st.term.length) * 0.3;

  // linhas visíveis: só as que a digitação já alcançou
  let offset = 0;
  const lines = st.code.map((line, i) => {
    const start = offset;
    offset += line.length + 1;
    if (pos.c < start) return null;
    let budget = Math.min(line.length, pos.c - start);
    const caretHere = pos.c >= start && pos.c <= start + line.length && (typing || pos.t < st.term.length || pos.c === text.length);
    const parts = TOKENS[pos.s][i].map(([cls, t], k) => {
      if (budget <= 0) return null;
      const shown = t.slice(0, budget);
      budget -= shown.length;
      return <span key={k} className={cls ? `tk-${cls}` : undefined}>{shown}</span>;
    });
    return (
      <div key={i} className="code__line">
        <span className="code__ln">{i + 1}</span>
        <span className="code__src">{parts}{caretHere && <span className={`code__caret${typing ? " is-typing" : ""}`} />}</span>
      </div>
    );
  });

  return (
    <div className="container ia">
      <div className="ia__text">
        <div data-reveal>
          <h2 id="ia-titulo">Onde a IA entra no seu projeto</h2>
          <p>Modelos de IA escrevem o primeiro rascunho de telas, rotas e testes. Isso corta horas de trabalho repetitivo e reduz o prazo.</p>
          <p>As decisões de arquitetura, segurança e o que vai para produção continuam com pessoas.</p>
        </div>
        <ol className="ia-steps" data-reveal="stagger">
          {STAGES.map((s, i) => (
            <li key={s.titulo}>
              <button
                type="button"
                className={`ia-step${i === pos.s ? " is-active" : ""}${i < pos.s ? " is-done" : ""}`}
                aria-pressed={i === pos.s}
                onClick={() => go.current(i)}
                style={{ ["--p" as string]: i === pos.s ? progress : i < pos.s ? 1 : 0 } as CSSProperties}
              >
                <span className="ia-step__icon"><Icon name={s.icon} /></span>
                <span className="ia-step__txt"><strong>{s.titulo}</strong><span>{s.desc}</span></span>
                <span className="ia-step__bar" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="ia__visual" data-reveal>
        <div className="code" ref={box} aria-hidden="true">
          <div className="code__bar">
            <span className="code__dots"><i /><i /><i /></span>
            <div className="code__tabs">
              {FILES.map((f) => <span key={f} className={`code__tab${f === st.file ? " is-active" : ""}`}>{f}</span>)}
            </div>
            <span className={`code__status${typing ? " is-busy" : ""}`}>
              {typing ? <span className="code__pulse" /> : <Icon name="check" />}
              {typing ? st.agent : st.done}
            </span>
          </div>
          <div className="code__body" key={pos.s}>{lines}</div>
          <div className="code__term">
            <div className="code__term-head">Terminal</div>
            {st.term.slice(0, pos.t).map((l, i) => (
              <div key={`${pos.s}-${i}`} className={`code__out${l.startsWith("$") ? " is-cmd" : l.startsWith("✓") ? " is-ok" : l.startsWith("→") ? " is-info" : ""}`}>{l}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
