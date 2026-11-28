import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "./Icon";

/**
 * "Vídeos" curtos da página de Serviços, feitos em HTML/CSS em vez de MP4 ou GIF:
 * pesam quase nada, ficam nítidos em qualquer tela, seguem o tema claro/escuro e usam o azul da marca.
 *
 * Cada cena é uma sequência de passos (step). Os elementos com a classe .w aparecem quando
 * o passo chega no deles (classe .on); as transições do CSS fazem o movimento.
 * - O HTML do servidor sai no último passo: sem JS, a cena aparece pronta, parada.
 * - No navegador, volta ao passo 0 e só roda quando está na tela e com a aba visível.
 * - Movimento reduzido: fica parada no último passo.
 * - Um cursor (ou um dedo, no app) vai até o elemento marcado com data-aim e clica.
 */

const usarLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useLoop(dur: number[], ref: React.RefObject<HTMLDivElement | null>) {
  const last = dur.length - 1;
  const [step, setStep] = useState(last);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    let s = 0;
    setStep(0);
    const run = (n: number) => {
      s = n;
      setStep(n);
      t = setTimeout(() => run(n >= last ? 0 : n + 1), dur[n]);
    };
    const stop = () => { clearTimeout(t); t = undefined; };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !t && !document.hidden) run(0);
      else if (!visible) { stop(); s = 0; setStep(0); }
    }, { threshold: 0.3 });
    const onVis = () => { if (document.hidden) stop(); else if (visible && !t) run(s); };
    io.observe(el);
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return step;
}

type SceneProps = {
  kind: string;
  label: string;
  dur: number[];
  aims?: Record<number, string>; // passo → data-aim do alvo
  clicks?: number[];             // passos em que o cursor clica
  touch?: boolean;               // dedo em vez de seta
  children: (s: number) => ReactNode;
};

function Scene({ kind, label, dur, aims = {}, clicks = [], touch, children }: SceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const step = useLoop(dur, ref);
  const [ptr, setPtr] = useState<{ x: number; y: number } | null>(null);

  // o cursor segue o último alvo até este passo; mede a posição real, então não depende de coordenadas fixas
  const alvoAtual = Object.keys(aims).map(Number).filter((k) => k <= step).sort((a, b) => b - a)[0];
  const aim = alvoAtual === undefined ? null : aims[alvoAtual];
  usarLayout(() => {
    const root = ref.current;
    if (!root) return;
    if (!aim) { setPtr(null); return; }
    const alvo = root.querySelector<HTMLElement>(`[data-aim="${aim}"]`);
    if (!alvo) return;
    const r = root.getBoundingClientRect(), a = alvo.getBoundingClientRect();
    setPtr({ x: ((a.left + a.width * 0.55 - r.left) / r.width) * 100, y: ((a.top + a.height * 0.6 - r.top) / r.height) * 100 });
  }, [aim, step]);

  const clicando = clicks.includes(step);
  const mostrar = !!ptr && (!touch || clicando); // o dedo só aparece quando toca
  return (
    <div ref={ref} className={`scene scene--${kind}`} role="img" aria-label={label} data-step={step}>
      <div className="scene__in" aria-hidden="true">
        {children(step)}
        <span
          className={`sc-ptr${touch ? " sc-ptr--touch" : ""}${mostrar ? " is-on" : ""}${clicando ? " is-click" : ""}`}
          style={ptr ? { left: `${ptr.x}%`, top: `${ptr.y}%` } : undefined}
        >
          {touch ? <i key={step} className="sc-ptr__ring" /> : (
            <>
              <svg viewBox="0 0 24 24"><path d="M5 3l14 8.2-6.3 1.3 3.6 6.6-2.6 1.4-3.6-6.6L5 18.2z" /></svg>
              {clicando && <i key={step} className="sc-ptr__ring" />}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

// aparece a partir do passo n: classe .w (escondido) + .on (visível)
const w = (s: number, n: number, extra = "") => `w${s >= n ? " on" : ""}${extra ? " " + extra : ""}`;
const k = (i: number) => ({ ["--k" as string]: i }) as CSSProperties;
const num = (s: number, n: number, to: number) => ({ className: `sc-num${s >= n ? " on" : ""}`, style: { ["--to" as string]: to } as CSSProperties });

function Win({ url, s, children }: { url: string; s: number; children: ReactNode }) {
  return (
    <div className="sc-win">
      <div className="sc-win__bar">
        <i /><i /><i />
        <span className="sc-win__url"><span className={`sc-type${s >= 1 ? " on" : ""}`}>{url}</span></span>
      </div>
      <div className="sc-win__body">
        <span className={`sc-load${s === 1 ? " on" : ""}`} />
        {children}
      </div>
    </div>
  );
}

function Toast({ on, icon, title, sub }: { on: boolean; icon: Parameters<typeof Icon>[0]["name"]; title: string; sub: string }) {
  return (
    <div className={`sc-toast${on ? " on" : ""}`}>
      <span className="sc-toast__icon"><Icon name={icon} /></span>
      <span><b>{title}</b><small>{sub}</small></span>
    </div>
  );
}

/* ---------------------------------------------------------------- site */
export function SceneSite() {
  return (
    <Scene kind="site" label="Animação: um site de padaria sendo montado; um visitante clica em Encomendar e o pedido chega no e-mail da empresa."
      dur={[700, 800, 500, 1300, 600, 600, 700, 900, 600, 3200]} aims={{ 7: "cta" }} clicks={[8]}>
      {(s) => (
        <>
          <Win url="padariasol.com.br" s={s}>
            <div className={w(s, 2, "st-nav")}>
              <span className="st-logo"><i />Padaria Sol</span>
              <span className="st-links"><i /><i /><i /></span>
              <span className="st-navbtn">Contato</span>
            </div>
            <div className="st-hero">
              <div className="st-copy">
                <span className={w(s, 3, "st-kicker")}>Desde 1998 · Campinas</span>
                <b className={`st-h sc-type${s >= 3 ? " on" : ""}`}>Pão quentinho</b>
                <b className={`st-h st-h--2 sc-type${s >= 3 ? " on" : ""}`}>toda <em>manhã</em></b>
                <span className={w(s, 4, "st-p")} style={k(0)}><i /><i /></span>
                <span className={w(s, 4, `st-cta w--pop${s === 8 ? " is-pressed" : ""}${s >= 9 ? " is-done" : ""}`)} style={k(2)} data-aim="cta">
                  {s >= 9 ? <><Icon name="check" />Pedido enviado</> : "Encomendar"}
                </span>
              </div>
              <div className={w(s, 5, "st-img w--x")}>
                <i className="st-sun" />
                <svg viewBox="0 0 100 60" preserveAspectRatio="none"><path className="st-hill st-hill--b" d="M0 42 Q25 26 50 38 T100 30 V60 H0Z" /><path className="st-hill" d="M0 50 Q30 36 60 48 T100 44 V60 H0Z" /></svg>
              </div>
            </div>
            <div className="st-cards">
              {[0, 1, 2].map((i) => (
                <span key={i} className={w(s, 6, "st-card")} style={k(i)}><i /><b /><b /></span>
              ))}
            </div>
          </Win>
          <Toast on={s >= 9} icon="mail" title="Novo pedido pelo site" sub="Chegou no seu e-mail agora" />
        </>
      )}
    </Scene>
  );
}

/* ---------------------------------------------------------------- sistema */
const PEDIDOS = [
  ["#1047", "Mercado Bom Preço", "novo"],
  ["#1046", "Ótica Visão", "prod"],
  ["#1045", "Pet Shop Amigo", "prod"],
  ["#1044", "Café Central", "ok"],
] as const;
const STATUS = { novo: "Novo", prod: "Em produção", ok: "Entregue" } as const;

export function SceneSistema() {
  return (
    <Scene kind="sistema" label="Animação: sistema de pedidos; chega um pedido novo, alguém marca outro como entregue e o cliente é avisado pelo WhatsApp."
      dur={[700, 800, 1000, 1400, 900, 1000, 3200]} aims={{ 4: "status" }} clicks={[5]}>
      {(s) => (
        <>
          <Win url="app.suaempresa.com.br/pedidos" s={s}>
            <div className="ss">
              <aside className="ss-side">
                <i className="ss-side__logo" />
                {[0, 1, 2, 3, 4].map((i) => <i key={i} className={`ss-side__item${i === 1 ? " is-active" : ""}`} />)}
              </aside>
              <div className="ss-main">
                <div className="ss-top">
                  <b>Pedidos</b>
                  <span className="ss-search"><Icon name="search" /><i /></span>
                  <i className="ss-avatar" />
                </div>
                <div className="ss-kpis">
                  <span className={w(s, 1, "ss-kpi")} style={k(0)}><small>Novos</small><b {...num(s, 1, s >= 3 ? 13 : 12)} /></span>
                  <span className={w(s, 1, "ss-kpi")} style={k(1)}><small>Em produção</small><b {...num(s, 1, s >= 5 ? 7 : 8)} /></span>
                  <span className={w(s, 1, "ss-kpi")} style={k(2)}><small>Entregues</small><b {...num(s, 1, s >= 5 ? 32 : 31)} /></span>
                </div>
                <div className="ss-table">
                  <div className="ss-row ss-row--head"><span>Pedido</span><span>Cliente</span><span>Status</span></div>
                  <div className={`ss-new${s >= 3 ? " on" : ""}`}>
                    <div className="ss-row is-new"><span>#1048</span><span>Padaria Sol</span><span><em className="pill pill--novo">Novo</em></span></div>
                  </div>
                  {PEDIDOS.map(([id, cli, st], i) => {
                    const alvo = id === "#1045";
                    const status = alvo && s >= 5 ? "ok" : st;
                    return (
                      <div key={id} className={w(s, 2, `ss-row${alvo && s >= 5 ? " is-flash" : ""}`)} style={k(i)}>
                        <span>{id}</span><span>{cli}</span>
                        <span><em className={`pill pill--${status}${alvo && s === 5 ? " is-pressed" : ""}`} data-aim={alvo ? "status" : undefined}>{STATUS[status]}</em></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Win>
          <Toast on={s >= 6} icon="message-circle" title="Cliente avisado no WhatsApp" sub="Pedido #1045 entregue" />
        </>
      )}
    </Scene>
  );
}

/* ---------------------------------------------------------------- dashboard */
const CANAIS = [["Loja", 82], ["Site", 64], ["WhatsApp", 48], ["Delivery", 30]] as const;
const LINHA = "M0 62 C12 58 18 46 30 48 S48 60 60 44 S80 26 92 34 S112 40 124 26 S146 16 158 22 S180 10 200 8";

export function SceneDashboard() {
  return (
    <Scene kind="dash" label="Animação: dashboard de vendas; os números sobem, o gráfico se desenha e chega um alerta de que as vendas do site subiram."
      dur={[600, 1300, 1300, 900, 1200, 900, 3200]} aims={{ 5: "ponto" }}>
      {(s) => (
        <>
          <Win url="painel.suaempresa.com.br" s={s}>
            <div className="sd">
              <div className="sd-top">
                <b>Vendas · novembro</b>
                <span className={`sd-live${s >= 1 ? " on" : ""}`}><i />Atualizado agora</span>
              </div>
              <div className="sd-kpis">
                <span className={w(s, 1, "sd-kpi")} style={k(0)}><small>Faturamento</small><b>R$ <span {...num(s, 1, 128)} /> mil</b><em>+12%</em></span>
                <span className={w(s, 1, "sd-kpi")} style={k(1)}><small>Clientes</small><b><span {...num(s, 1, 342)} /></b><em>+8%</em></span>
                <span className={w(s, 1, "sd-kpi")} style={k(2)}><small>Ticket médio</small><b>R$ <span {...num(s, 1, 99)} /></b><em>+3%</em></span>
              </div>
              <div className="sd-grid">
                <div className="sd-card sd-chart">
                  <small>Vendas por dia</small>
                  <div className="sd-plot">
                    <svg viewBox="0 0 200 70" preserveAspectRatio="none">
                      {[14, 32, 50].map((y) => <line key={y} x1="0" x2="200" y1={y} y2={y} className="sd-gridline" />)}
                      <path className={`sd-area${s >= 2 ? " on" : ""}`} d={`${LINHA} V70 H0Z`} />
                      <path className={`sd-line${s >= 2 ? " on" : ""}`} d={LINHA} pathLength={1} />
                    </svg>
                    <i className={`sd-dot${s >= 2 ? " on" : ""}`} data-aim="ponto" />
                    <span className={`sd-tip${s >= 5 ? " on" : ""}`}>Hoje · R$ 6,2 mil</span>
                  </div>
                </div>
                <div className="sd-card sd-side">
                  <small>Por canal</small>
                  {CANAIS.map(([n, v], i) => (
                    <span key={n} className="sd-bar"><span>{n}</span><i><b className={s >= 3 ? "on" : ""} style={{ ...k(i), width: `${v}%` }} /></i></span>
                  ))}
                  <div className="sd-meta">
                    <svg viewBox="0 0 36 36"><circle className="sd-ring" cx="18" cy="18" r="15" /><circle className={`sd-ring sd-ring--on${s >= 4 ? " on" : ""}`} cx="18" cy="18" r="15" pathLength={100} /></svg>
                    <span><b><span {...num(s, 4, 82)} />%</b><small>da meta</small></span>
                  </div>
                </div>
              </div>
            </div>
          </Win>
          <Toast on={s >= 6} icon="chart-column" title="Vendas do site +18% na semana" sub="Alerta enviado por e-mail" />
        </>
      )}
    </Scene>
  );
}

/* ---------------------------------------------------------------- app */
const DIAS = [["Seg", 24], ["Ter", 25], ["Qua", 26], ["Qui", 27], ["Sex", 28], ["Sáb", 29], ["Dom", 30]] as const;
const HORAS = ["09:00", "10:30", "13:00", "14:00", "15:30", "17:00"];

export function SceneApp() {
  return (
    <Scene kind="app" label="Animação: aplicativo de agendamento no celular; a cliente escolhe o dia e o horário, confirma e recebe um lembrete."
      dur={[1000, 800, 1000, 1000, 800, 1300, 3200]} aims={{ 2: "dia", 3: "hora", 4: "confirmar" }} clicks={[2, 3, 4]} touch>
      {(s) => (
        <>
          <span className={w(s, 1, "sa-chip sa-chip--a w--pop")}><i />Android</span>
          <span className={w(s, 1, "sa-chip sa-chip--b w--pop")} style={k(2)}><i />iOS</span>
          <div className="sa-phone">
            <div className="sa-screen">
              <span className="sa-notch" />
              <div className={`sa-splash${s === 0 ? " on" : ""}`}><i /><b>Studio Bela</b></div>
              <div className="sa-app">
                <span className={w(s, 1, "sa-hello")} style={k(0)}>Olá, Ana</span>
                <b className={w(s, 1, "sa-title")} style={k(1)}>Agendar horário</b>
                <span className={w(s, 1, "sa-service")} style={k(2)}><i /><span><b>Corte + escova</b><small>1h · R$ 90</small></span></span>
                <small className={w(s, 1, "sa-label")} style={k(3)}>Novembro</small>
                <div className={w(s, 1, "sa-days")} style={k(3)}>
                  {DIAS.map(([d, n]) => (
                    <span key={n} className={`sa-day${n === 28 && s >= 2 ? " is-sel" : ""}`} data-aim={n === 28 ? "dia" : undefined}><small>{d}</small>{n}</span>
                  ))}
                </div>
                <small className={w(s, 1, "sa-label")} style={k(4)}>Horários</small>
                <div className={w(s, 1, "sa-hours")} style={k(4)}>
                  {HORAS.map((h) => (
                    <span key={h} className={`sa-hour${h === "14:00" && s >= 3 ? " is-sel" : ""}${h === "10:30" ? " is-off" : ""}`} data-aim={h === "14:00" ? "hora" : undefined}>{h}</span>
                  ))}
                </div>
                <small className={w(s, 1, "sa-label")} style={k(5)}>Profissional</small>
                <div className={w(s, 1, "sa-pros")} style={k(5)}>
                  {["Carla", "Bruna", "Léo"].map((n, i) => <span key={n} className={`sa-pro${i === 0 ? " is-sel" : ""}`}><i />{n}</span>)}
                </div>
                <span className={w(s, 1, `sa-btn${s === 4 ? " is-pressed" : ""}`)} style={k(6)} data-aim="confirmar">Confirmar</span>
              </div>
              <div className={`sa-done${s >= 5 ? " on" : ""}`}>
                <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" pathLength={1} /></svg>
                <b>Agendado!</b>
                <small>Sex, 28 de nov · 14:00</small>
              </div>
              <div className={`sa-push${s >= 6 ? " on" : ""}`}>
                <i />
                <span><b>Studio Bela · agora</b><small>Lembrete: amanhã às 14h</small></span>
              </div>
            </div>
          </div>
        </>
      )}
    </Scene>
  );
}
