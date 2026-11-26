import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Icon } from "./Icon";
import { Highlight } from "./SearchDialog";
import { FORM_ENDPOINT } from "../config";
import { normalize, useDebouncedValue } from "../lib/utils";

const SEGMENTOS = ["Academia e estúdio", "Advocacia", "Agronegócio", "Arquitetura", "Autopeças", "Clínica médica", "Clínica odontológica", "Construção civil", "Consultoria", "Contabilidade", "Educação e cursos", "Energia solar", "Escola", "Eventos", "Farmácia", "Hotelaria", "Imobiliária", "Indústria", "Logística e transporte", "Loja de roupas", "Marketing e agência", "Mercado e atacado", "ONG", "Petshop e veterinária", "Restaurante e delivery", "Salão de beleza", "Saúde", "Seguros", "Serviços financeiros", "Startup", "Tecnologia", "Turismo", "Varejo"];

const TIPOS = [["site", "Site"],["sistema", "Sistema web"], ["dashboard", "Dashboard"], ["app", "Aplicativo Android/iOS"], ["outro", "Outro"], ["nao-sei", "Ainda não sei"]];

type Campos = { nome: string; empresa: string; email: string; telefone: string; tipo: string; segmento: string; mensagem: string; aceite: boolean; site_url: string };
type Erros = Partial<Record<keyof Campos, string>>;
const ROTULO: Partial<Record<keyof Campos, string>> = { nome: "Nome", email: "E-mail", telefone: "WhatsApp", tipo: "Tipo de projeto", mensagem: "O que você precisa", aceite: "Aceite da política" };

function validar(c: Campos): Erros {
  const e: Erros = {};
  if (!c.nome.trim()) e.nome = "Escreva seu nome.";
  else if (c.nome.trim().length < 2) e.nome = "O nome precisa ter pelo menos 2 letras.";
  if (!c.email.trim()) e.email = "Escreva seu e-mail para podermos responder.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = "Este e-mail parece incompleto. Confira se tem @ e domínio, como nome@empresa.com.br.";
  const d = c.telefone.replace(/\D/g, "");
  if (d && (d.length < 10 || d.length > 11)) e.telefone = "Use DDD + número, como (11) 91234-5678.";
  if (!c.tipo) e.tipo = "Escolha o tipo de projeto. Se ainda não sabe, marque “Ainda não sei”.";
  const m = c.mensagem.trim().length;
  if (!m) e.mensagem = "Conte em poucas linhas o que você precisa.";
  else if (m < 20) e.mensagem = `Escreva um pouco mais (mínimo 20 caracteres, faltam ${20 - m}).`;
  if (!c.aceite) e.aceite = "Para enviar, aceite a Política de privacidade.";
  return e;
}

const mascaraTel = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length > 7) return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
};

function Erro({ id, msg }: { id: string; msg?: string }) {
  return <p id={id} aria-live="polite" style={{ display: msg ? undefined : "none" }}>{msg && <span className="field-error"><Icon name="circle-alert" />{msg}</span>}</p>;
}

/** Quanto falta para o mínimo da mensagem; vira um check quando chega lá (troca com fade e blur). */
function Contador({ n, min }: { n: number; min: number }) {
  const ok = n >= min;
  return (
    <span className="counter" data-ok={ok} aria-hidden="true">
      <span className="swap"><Icon name="check" data-on={String(ok)} /></span>
      {ok ? `${n} caracteres` : `${n}/${min}`}
    </span>
  );
}

/** Autocompletar do segmento: sugestões 200 ms depois da última tecla. */
function SegmentoCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const q = useDebouncedValue(value, 200);
  const items = useMemo(() => {
    const n = normalize(q);
    return n ? SEGMENTOS.filter((s) => normalize(s).includes(n) && normalize(s) !== n).slice(0, 6) : [];
  }, [q]);
  const typed = useRef(false);
  useEffect(() => { if (typed.current) { setOpen(items.length > 0); setActive(-1); } }, [items]);

  const pick = (s: string) => { typed.current = false; onChange(s); setOpen(false); };
  return (
    <div className="field">
      <label className="label" htmlFor="segmento">Segmento da empresa <span className="opt">(opcional)</span></label>
      <input
        id="segmento" className="input" type="text" role="combobox" autoComplete="off"
        aria-autocomplete="list" aria-expanded={open} aria-controls="segmento-lista"
        aria-activedescendant={open && active >= 0 ? `seg-${active}` : undefined}
        aria-describedby="segmento-dica" placeholder="Ex.: clínica, varejo, logística"
        value={value}
        onChange={(e) => { typed.current = true; onChange(e.target.value); }}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % items.length); }
          else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(items[active]); }
          else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
        }}
      />
      {open && (
        <ul id="segmento-lista" className="popover" role="listbox" aria-label="Sugestões de segmento" onPointerDown={(e) => e.preventDefault()}>
          {items.map((s, i) => (
            <li key={s} id={`seg-${i}`} role="option" aria-selected={i === active} className="option" onClick={() => pick(s)} onPointerMove={() => setActive(i)}>
              <Highlight text={s} query={q} />
            </li>
          ))}
        </ul>
      )}
      <p className="hint" id="segmento-dica">Comece a digitar e escolha uma sugestão, ou escreva o seu.</p>
    </div>
  );
}

export function ContactForm() {
  const [c, setC] = useState<Campos>({ nome: "", empresa: "", email: "", telefone: "", tipo: "", segmento: "", mensagem: "", aceite: false, site_url: "" });
  const [erros, setErros] = useState<Erros>({});
  const [tocados, setTocados] = useState<Partial<Record<keyof Campos, boolean>>>({});
  const [resumo, setResumo] = useState<{ n: number; first?: keyof Campos } | null>(null);
  const [falha, setFalha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const alerta = useRef<HTMLDivElement>(null);

  // ?tipo=apps vindo da página de serviços já marca o tipo
  useEffect(() => {
    const m: Record<string, string> = { sites: "site", sistemas: "sistema", dashboards: "dashboard", apps: "app" };
    const q = new URLSearchParams(location.search);
    const t = q.get("tipo");
    if (t && m[t]) setC((v) => ({ ...v, tipo: m[t] }));
    // ?ideia=… vindo do campo "descreva sua ideia": preenche a mensagem e tenta adivinhar o tipo
    const ideia = q.get("ideia")?.trim().slice(0, 300);
    if (ideia) {
      const s = ideia.toLowerCase();
      const tipo = /\bapp|aplicativo|android|ios\b/.test(s) ? "app" : /dashboard|painel|indicador|relat/.test(s) ? "dashboard"
        : /sistema|pedido|estoque|agenda|planilha|erp/.test(s) ? "sistema" : /\bsite|loja|landing|google/.test(s) ? "site" : "";
      setC((v) => ({ ...v, mensagem: ideia, tipo: v.tipo || tipo }));
    }
  }, []);

  const set = <K extends keyof Campos>(k: K, v: Campos[K]) => {
    const next = { ...c, [k]: v };
    setC(next);
    // depois do primeiro erro, revalida enquanto a pessoa corrige
    if (erros[k]) setErros((e) => ({ ...e, [k]: validar(next)[k] }));
  };
  const blur = (k: keyof Campos) => {
    setTocados((t) => ({ ...t, [k]: true }));
    if (c[k] !== "" && c[k] !== false) setErros((e) => ({ ...e, [k]: validar(c)[k] }));
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (c.site_url) return; // honeypot
    const e = validar(c);
    setErros(e);
    const keys = (Object.keys(e) as (keyof Campos)[]).filter((k) => e[k]);
    if (keys.length) {
      setResumo({ n: keys.length, first: keys[0] });
      setFalha(false);
      document.getElementById(keys[0])?.focus();
      return;
    }
    setResumo(null);
    setEnviando(true);
    try {
      if (FORM_ENDPOINT) {
        const body = new FormData();
        Object.entries(c).forEach(([k, v]) => body.append(k, String(v)));
        const r = await fetch(FORM_ENDPOINT, { method: "POST", body, headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(`http ${r.status}`);
      }
      window.gtag?.("event", "generate_lead", { form: "contato" });
      window.location.href = "/obrigado.html";
    } catch {
      setFalha(true);
      setEnviando(false);
      requestAnimationFrame(() => alerta.current?.focus());
    }
  };

  const inv = (k: keyof Campos) => (erros[k] ? true : undefined);
  // barra de progresso: campos obrigatórios já válidos
  const OBRIG = ["nome", "email", "tipo", "mensagem", "aceite"] as const;
  const v = validar(c);
  const feitos = OBRIG.filter((k) => !v[k]).length;
  const pct = Math.round((feitos / OBRIG.length) * 100);
  void tocados;

  return (
    <form className="card form-card" onSubmit={submit} noValidate data-hide-cta>
      <span className="form-card__beam" aria-hidden="true" />
      <div className={`form-progress${feitos === OBRIG.length ? " is-done" : ""}`} aria-hidden="true">
        <div className="form-progress__top">
          <span>{feitos === OBRIG.length ? <><Icon name="check" />Tudo pronto para enviar</> : <>Campos obrigatórios: <b>{feitos} de {OBRIG.length}</b></>}</span>
          <span className="form-progress__pct">{pct}%</span>
        </div>
        <div className="form-progress__bar"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>
      </div>
      {(resumo || falha) && (
        <div className="alert" role="alert" tabIndex={-1} ref={alerta}>
          <Icon name="circle-alert" />
          {falha ? (
            <span>Não conseguimos enviar agora. Verifique sua conexão e tente de novo, ou escreva para o e-mail ao lado.</span>
          ) : resumo && (
            <span>
              {resumo.n === 1 ? "Falta corrigir 1 campo: " : `Falta corrigir ${resumo.n} campos. Comece por `}
              <a href={`#${resumo.first}`}>{ROTULO[resumo.first!]}</a>.
            </span>
          )}
        </div>
      )}
      <div className="form-grid">
        <div className="field">
          <label className="label" htmlFor="nome">Nome</label>
          <input id="nome" className="input" autoComplete="name" value={c.nome} aria-invalid={inv("nome")} aria-describedby="nome-erro" onChange={(e) => set("nome", e.target.value)} onBlur={() => blur("nome")} />
          <Erro id="nome-erro" msg={erros.nome} />
        </div>
        <div className="field">
          <label className="label" htmlFor="empresa">Empresa <span className="opt">(opcional)</span></label>
          <input id="empresa" className="input" autoComplete="organization" value={c.empresa} onChange={(e) => set("empresa", e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="email">E-mail</label>
          <input id="email" className="input" type="email" inputMode="email" autoComplete="email" value={c.email} aria-invalid={inv("email")} aria-describedby="email-erro" onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} />
          <Erro id="email-erro" msg={erros.email} />
        </div>
        <div className="field">
          <label className="label" htmlFor="telefone">WhatsApp <span className="opt">(opcional)</span></label>
          <input id="telefone" className="input" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(11) 91234-5678" value={c.telefone} aria-invalid={inv("telefone")} aria-describedby="telefone-erro" onChange={(e) => set("telefone", mascaraTel(e.target.value))} onBlur={() => blur("telefone")} />
          <Erro id="telefone-erro" msg={erros.telefone} />
        </div>
        <SegmentoCombobox value={c.segmento} onChange={(v) => set("segmento", v)} />
        <div className="field full">
          {/* rádios nativos com cara de chip: setas trocam a opção, Tab entra e sai do grupo */}
          <span className="label" id="tipo-label">Tipo de projeto</span>
          <div className="chips" role="radiogroup" aria-labelledby="tipo-label" aria-invalid={inv("tipo")} aria-describedby="tipo-erro">
            {TIPOS.map(([v, t], i) => (
              <label key={v} className="chip">
                <input type="radio" name="tipo" id={i === 0 ? "tipo" : undefined} value={v} checked={c.tipo === v} onChange={() => set("tipo", v)} />
                <span>{t}</span>
              </label>
            ))}
          </div>
          <Erro id="tipo-erro" msg={erros.tipo} />
        </div>
        <div className="field full">
          <label className="label" htmlFor="mensagem">O que você precisa?</label>
          <textarea id="mensagem" className="textarea" value={c.mensagem} aria-invalid={inv("mensagem")} aria-describedby="mensagem-dica mensagem-erro" placeholder="Ex.: Tenho uma clínica com 3 unidades e quero que os pacientes marquem consulta pelo celular." onChange={(e) => set("mensagem", e.target.value)} onBlur={() => blur("mensagem")} />
          <div className="hint-row">
            <p className="hint" id="mensagem-dica">Conte qual problema o projeto resolve e quem vai usar. Prazo e orçamento ajudam, se você já tiver.</p>
            <Contador n={c.mensagem.trim().length} min={20} />
          </div>
          <Erro id="mensagem-erro" msg={erros.mensagem} />
        </div>
        <div className="field full">
          <label className="checkbox-row" htmlFor="aceite">
            <input id="aceite" className="checkbox" type="checkbox" checked={c.aceite} aria-invalid={inv("aceite")} aria-describedby="aceite-erro" onChange={(e) => set("aceite", e.target.checked)} />
            <span>Li e aceito a <a href="/privacidade.html" target="_blank">Política de privacidade</a>. Meus dados serão usados só para responder este pedido.</span>
          </label>
          <Erro id="aceite-erro" msg={erros.aceite} />
        </div>
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="site_url">Não preencha</label>
          <input id="site_url" tabIndex={-1} autoComplete="off" value={c.site_url} onChange={(e) => set("site_url", e.target.value)} />
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn--lg" type="submit" disabled={enviando} aria-busy={enviando}>
          {enviando ? <Icon name="loader-circle" className="spin" /> : <Icon name="send" />}
          {enviando ? "Enviando…" : "Enviar pedido"}
        </button>
        <span className="hint">Respondemos em dias úteis, no horário comercial.</span>
      </div>
    </form>
  );
}
