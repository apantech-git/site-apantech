import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./icon-data";
import { normalize, useDebouncedValue, useEvent } from "../lib/utils";

type Item = { t: string; d: string; u: string; k: string; g: "Serviços" | "Empresa" | "Páginas"; i: IconName };

const INDEX: (Item & { n: string })[] = ([
  { g: "Serviços", i: "globe", t: "Criação de sites", d: "Institucional, landing page e loja virtual", u: "/servicos.html#sites", k: "site website landing page loja virtual ecommerce institucional seo wordpress" },
  { g: "Serviços", i: "database", t: "Sistemas web sob medida", d: "Pedidos, estoque, agenda, atendimento", u: "/servicos.html#sistemas", k: "sistema erp crm estoque agenda pedidos gestao painel administrativo saas" },
  { g: "Serviços", i: "chart-column", t: "Dashboards e relatórios", d: "Indicadores de vendas, finanças e operação", u: "/servicos.html#dashboards", k: "dashboard bi relatorio indicador kpi grafico power bi planilha dados" },
  { g: "Serviços", i: "smartphone", t: "Aplicativos Android e iOS", d: "Publicação na Google Play e na App Store", u: "/servicos.html#apps", k: "app aplicativo android ios iphone celular mobile play store app store flutter react native" },
  { g: "Empresa", i: "house", t: "Quem somos", d: "A história da apantech e quem desenvolve", u: "/quem-somos.html", k: "quem somos sobre empresa historia apant nome homenagem fundador vinicius equipe desenvolvedor stacks tecnologias marca logo" },
  { g: "Empresa", i: "chevron-right", t: "Como trabalhamos", d: "Da primeira conversa à entrega", u: "/#processo", k: "processo etapas prototipo proposta prazo entrega metodologia" },
  { g: "Empresa", i: "sparkles", t: "Onde usamos IA", d: "IA para código e testes, com revisão humana", u: "/#ia", k: "ia inteligencia artificial chatgpt automacao codigo testes revisao" },
  { g: "Empresa", i: "circle-alert", t: "Quanto custa um projeto?", d: "Preço fechado depois da primeira conversa", u: "/#duvidas", k: "preco valor custo orcamento quanto custa pagamento" },
  { g: "Empresa", i: "code", t: "O código fica comigo?", d: "Sim, entregue no seu repositório", u: "/#duvidas", k: "codigo fonte propriedade repositorio github direitos" },
  { g: "Empresa", i: "shield-check", t: "Manutenção e suporte", d: "Plano mensal opcional após a entrega", u: "/#duvidas", k: "manutencao suporte atualizacao hospedagem bug correcao" },
  { g: "Páginas", i: "send", t: "Pedir orçamento", d: "Formulário de contato", u: "/contato.html", k: "contato orcamento formulario proposta falar email whatsapp telefone endereco" },
  { g: "Páginas", i: "file-text", t: "Política de privacidade", d: "Como tratamos seus dados (LGPD)", u: "/privacidade.html", k: "privacidade lgpd dados pessoais cookies" },
  { g: "Páginas", i: "file-text", t: "Termos de uso", d: "Regras de uso deste site", u: "/termos.html", k: "termos uso condicoes" },
] as Item[]).map((x) => ({ ...x, n: normalize(`${x.t} ${x.d} ${x.k}`) }));

export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  const q = normalize(query);
  if (!q) return text;
  const i = normalize(text).indexOf(q);
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

/** Paleta de busca (Ctrl/⌘ K ou /). O filtro roda 160 ms depois da última tecla. */
export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const q = useDebouncedValue(query, 160);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  const results = useMemo(() => {
    const n = normalize(q);
    if (!n) return INDEX.slice(0, 6);
    const words = n.split(/\s+/);
    return INDEX.filter((x) => words.every((w) => x.n.includes(w)))
      .sort((a, b) => Number(normalize(b.t).includes(n)) - Number(normalize(a.t).includes(n)))
      .slice(0, 8);
  }, [q]);
  useEffect(() => setActive(0), [q]);

  const show = () => {
    prevFocus.current = document.activeElement as HTMLElement;
    setQuery("");
    setOpen(true);
  };
  const hide = () => setVisible(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const r = requestAnimationFrame(() => { setVisible(true); input.current?.focus(); });
      return () => cancelAnimationFrame(r);
    }
  }, [open]);
  useEffect(() => {
    if (!visible && open) {
      const t = setTimeout(() => { setOpen(false); document.body.style.overflow = ""; prevFocus.current?.focus(); }, 150);
      return () => clearTimeout(t);
    }
  }, [visible, open]);

  useEvent("busca:abrir", show);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const typing = !!el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable);
      if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        open ? hide() : show();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (u: string) => { window.location.href = u; hide(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); hide(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (results.length ? (a + 1) % results.length : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0)); }
    else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active].u); }
    else if (e.key === "Tab") { e.preventDefault(); input.current?.focus(); } // foco preso no diálogo
  };

  useEffect(() => {
    box.current?.querySelector(`#busca-op-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;
  let lastGroup = "";
  return (
    <div className="dialog-wrap" onKeyDown={onKeyDown}>
      <div className={`overlay${visible ? " is-open" : ""}`} onClick={hide} />
      <div ref={box} className={`command${visible ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Buscar no site">
        <div className="command__input">
          <Icon name="search" />
          <input
            ref={input}
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="busca-lista"
            aria-activedescendant={results.length ? `busca-op-${active}` : undefined}
            aria-autocomplete="list"
            placeholder="Buscar serviços, dúvidas, páginas"
            autoComplete="off"
            enterKeyHint="go"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="kbd" onClick={hide} style={{ cursor: "pointer" }}>Esc</button>
        </div>
        {results.length > 0 ? (
          <ul id="busca-lista" className="command__list" role="listbox" aria-label="Resultados">
            {results.map((r, i) => {
              const head = r.g !== lastGroup ? (lastGroup = r.g) : null;
              return (
                <li key={r.t} role="presentation">
                  {head && <div className="command__group" role="presentation">{head}</div>}
                  <div id={`busca-op-${i}`} role="option" aria-selected={i === active} className="command__item" onPointerMove={() => setActive(i)}>
                    <a href={r.u} tabIndex={-1} onClick={hide}>
                      <span className="feature__icon"><Icon name={r.i} /></span>
                      <span className="txt"><span className="t"><Highlight text={r.t} query={q} /></span><span className="d">{r.d}</span></span>
                      <Icon name="corner-down-left" className="enter" />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="command__empty">Nada encontrado para “{q}”. Descreva o que você precisa no <a href="/contato.html">formulário de orçamento</a>.</p>
        )}
        <div className="command__foot" aria-hidden="true">
          <span><span className="kbd">↑</span><span className="kbd">↓</span>navegar</span>
          <span><span className="kbd">Enter</span>abrir</span>
          <span><span className="kbd">Esc</span>fechar</span>
        </div>
      </div>
    </div>
  );
}
