import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Cena 3D do hero: o mesmo dashboard em três telas.
 * Notebook → (gira até ficar de perfil e vira) → celular → monitor → notebook...
 * Tudo em CSS 3D + Web Animations; aparelhos e telas são HTML, então seguem o tema claro/escuro.
 *
 * - A troca acontece com o aparelho de perfil (invisível), por isso parece uma transformação.
 * - Gira com ease-in-out (move na tela) e assenta numa spring (spring.selection).
 * - Vento: anéis de ar giram em volta do eixo junto com o aparelho (atrás e na frente dele)
 *   e riscos de velocidade cruzam a frente, no mesmo sentido em que a face do aparelho se move.
 * - Flutua de leve e inclina seguindo o mouse (só ponteiro fino).
 * - Movimento reduzido: sem giro, vento, flutuação ou inclinação; os aparelhos trocam com fade.
 * - Para fora da tela, com a aba escondida e enquanto a intro roda.
 */
const SEQ = ["laptop", "phone", "monitor"] as const;
const HOLD = 3600;          // tempo parado em cada aparelho
const TILT_Y = -18;         // giro base da cena (precisa bater com o CSS de .d3-tilt)
const OUT = 90 - TILT_Y;    // ângulo em que o aparelho fica de perfil para quem olha
const IN = -90 - TILT_Y;
const T_OUT = 520, T_IN = 1000;

// anéis de vento em volta do eixo de rotação (coordenadas da cena: 560 × 460)
const RINGS = [
  { cy: 95, rx: 220, ry: 26 },
  { cy: 150, rx: 252, ry: 34 },
  { cy: 210, rx: 272, ry: 42 },
  { cy: 270, rx: 256, ry: 36 },
  { cy: 325, rx: 228, ry: 28 },
];
const CX = 280;
// riscos de velocidade na frente do aparelho
const STREAKS = [
  { y: 110, x1: 140, x2: 420 }, { y: 150, x1: 60, x2: 300 }, { y: 178, x1: 210, x2: 500 }, { y: 205, x1: 20, x2: 240 },
  { y: 232, x1: 300, x2: 545 }, { y: 262, x1: 90, x2: 360 }, { y: 292, x1: 260, x2: 500 }, { y: 330, x1: 140, x2: 400 },
];

export function HeroDevices() {
  const scene = useRef<HTMLDivElement>(null);
  const rotor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sc = scene.current, ro = rotor.current;
    if (!sc || !ro) return;
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spring = CSS.supports("animation-timing-function", "linear(0, 1)")
      ? getComputedStyle(root).getPropertyValue("--spring-selection").trim() || "cubic-bezier(0.23, 1, 0.32, 1)"
      : "cubic-bezier(0.23, 1, 0.32, 1)";
    const front = Array.from(sc.querySelectorAll<SVGPathElement>(".wind__front"));
    const back = Array.from(sc.querySelectorAll<SVGPathElement>(".wind__back"));
    const streaks = Array.from(sc.querySelectorAll<SVGPathElement>(".wind__streak"));

    let i = 0, timer: ReturnType<typeof setTimeout> | undefined, busy = false;
    let visible = true, started = false;

    const setDevice = (n: number) => { i = n; sc.dataset.device = SEQ[n]; };

    // o ar acompanha o giro: começa junto, chega ao pico quando o aparelho está de perfil e some no assentamento
    const wind = () => {
      const fade = (peak: number) => [
        { strokeDashoffset: 100, opacity: 0 },
        { opacity: peak, offset: 0.4 },
        { strokeDashoffset: -40, opacity: 0 },
      ];
      front.forEach((p, k) => p.animate(fade(0.8), { duration: 950, delay: k * 55, easing: "cubic-bezier(0.77, 0, 0.175, 1)" }));
      back.forEach((p, k) => p.animate(fade(0.45), { duration: 950, delay: 260 + k * 55, easing: "cubic-bezier(0.77, 0, 0.175, 1)" }));
      streaks.forEach((p, k) => p.animate(fade(0.7), { duration: 680, delay: 120 + ((k * 3) % 8) * 45, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }));
    };

    const step = async () => {
      if (busy) return;
      busy = true;
      const next = (i + 1) % SEQ.length;
      ro.getAnimations().forEach((a) => a.cancel());
      try {
        if (reduce) {
          await ro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: "ease-out", fill: "forwards" }).finished;
          setDevice(next);
          ro.getAnimations().forEach((a) => a.cancel());
          ro.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-out" });
        } else {
          wind();
          await ro.animate(
            [{ transform: "rotateY(0deg) scale(1)" }, { transform: `rotateY(${OUT}deg) scale(0.92)` }],
            { duration: T_OUT, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "forwards" }
          ).finished;
          setDevice(next);
          ro.getAnimations().forEach((a) => a.cancel());
          ro.animate(
            [{ transform: `rotateY(${IN}deg) scale(0.92)` }, { transform: "rotateY(0deg) scale(1)" }],
            { duration: T_IN, easing: spring }
          );
        }
      } catch { /* animação cancelada: segue o ciclo */ }
      busy = false;
      schedule();
    };

    const schedule = () => {
      clearTimeout(timer);
      if (started && visible && !document.hidden) timer = setTimeout(step, HOLD);
    };
    const start = () => { started = true; schedule(); };

    // espera a intro terminar para não girar escondido atrás dela
    if (root.classList.contains("has-intro")) window.addEventListener("intro:end", start, { once: true });
    else start();

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); });
    io.observe(sc);
    const onVis = () => schedule();
    document.addEventListener("visibilitychange", onVis);

    // inclinação seguindo o mouse, dentro do hero
    const hero = sc.closest(".hero") as HTMLElement | null;
    const onMove = (e: PointerEvent) => {
      if (reduce || e.pointerType !== "mouse" || !hero) return;
      const h = hero.getBoundingClientRect();
      if (e.clientY < h.top || e.clientY > h.bottom) { sc.style.setProperty("--px", "0"); sc.style.setProperty("--py", "0"); return; }
      const r = sc.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 1.2)));
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 1.2)));
      sc.style.setProperty("--px", nx.toFixed(3));
      sc.style.setProperty("--py", ny.toFixed(3));
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      clearTimeout(timer);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("intro:end", start);
      ro.getAnimations().forEach((a) => a.cancel());
    };
  }, []);

  return (
    <figure className="hero__visual">
      <div className="d3-scene" ref={scene} data-device="laptop" aria-hidden="true">
        <svg className="wind wind--back" viewBox="0 0 560 460" preserveAspectRatio="none">
          {RINGS.map((r, k) => (
            <path key={k} className="wind__back" pathLength={100} d={`M${CX + r.rx},${r.cy} A${r.rx},${r.ry} 0 0 0 ${CX - r.rx},${r.cy}`} />
          ))}
        </svg>
        <div className="d3-float">
          <div className="d3-tilt">
            <div className="d3-rotor" ref={rotor}>
              <Laptop />
              <Phone />
              <Monitor />
            </div>
          </div>
        </div>
        <svg className="wind wind--front" viewBox="0 0 560 460" preserveAspectRatio="none">
          {RINGS.map((r, k) => (
            <path key={k} className="wind__front" pathLength={100} d={`M${CX - r.rx},${r.cy} A${r.rx},${r.ry} 0 0 0 ${CX + r.rx},${r.cy}`} />
          ))}
          {STREAKS.map((s, k) => (
            <path key={k} className="wind__streak" pathLength={100} d={`M${s.x1},${s.y} L${s.x2},${s.y}`} />
          ))}
        </svg>
        <div className="d3-shadow" />
      </div>
      <figcaption className="hero__caption">
        <span className="sync-dot" aria-hidden="true" />
        <span><strong>Um sistema, todas as telas.</strong> O mesmo painel no notebook, no celular e no monitor, com os dados sincronizados em tempo real.</span>
      </figcaption>
    </figure>
  );
}

/* ---------------- aparelhos ----------------
   Proporções tiradas de aparelhos reais, na escala da cena:
   - notebook ≈ MacBook Air 13" (304 × 215 mm; tampa ~5 mm, base ~11 mm) → 1em ≈ 8 mm
   - celular ≈ iPhone 15 (71,6 × 147,6 × 7,8 mm)
   - monitor ≈ 27" 5K (623 × 362 mm de painel, ~30 mm de espessura) */

/**
 * Espessura: chapas empilhadas atrás da peça (no eixo Z dela). Bem juntas, parecem uma lateral sólida
 * quando o aparelho gira de lado, inclusive nos cantos arredondados.
 */
function Thickness({ depth, n }: { depth: number; n: number }) {
  const step = depth / n;
  return <>{Array.from({ length: n }, (_, k) => <span key={k} className="dev__layer" style={{ "--z": k + 1, "--step": `${step}em` } as CSSProperties} />)}</>;
}

// teclado no layout real: fileira de funções baixa, teclas largas nas pontas, barra de espaço e setas
const KB: number[][] = [
  Array(14).fill(1),
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.5],
  [1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.8],
  [2.3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2.3],
];
const KB_LAST = [1, 1, 1, 1.25, 5, 1.25, 1];

function Keyboard() {
  return (
    <div className="kb">
      {KB.map((row, r) => (
        <div key={r} className={`kb__row${r === 0 ? " kb__row--fn" : ""}`}>
          {row.map((u, k) => <span key={k} style={{ "--u": u } as CSSProperties} />)}
        </div>
      ))}
      <div className="kb__row">
        {KB_LAST.map((u, k) => <span key={k} style={{ "--u": u } as CSSProperties} />)}
        <div className="kb__arrows" style={{ "--u": 3 } as CSSProperties}><span /><div><span /><span /></div><span /></div>
      </div>
    </div>
  );
}

function Laptop() {
  return (
    <div className="dev dev--laptop">
      <div className="laptop__lid">
        <Thickness depth={0.6} n={4} />
        <div className="laptop__bezel">
          <div className="laptop__screen screen"><Dash kind="desk" /></div>
          <span className="laptop__notch"><i /></span>
        </div>
      </div>
      <div className="laptop__base">
        <Thickness depth={1.35} n={9} />
        <div className="laptop__top">
          <span className="laptop__hinge" />
          <Keyboard />
          <div className="laptop__pad" />
        </div>
      </div>
    </div>
  );
}

function Phone() {
  return (
    <div className="dev dev--phone">
      <Thickness depth={1.8} n={12} />
      {/* botões são peças na lateral (planos virados para o lado), aparecem quando o celular gira */}
      <span className="phone__btn phone__btn--action" />
      <span className="phone__btn phone__btn--vol1" />
      <span className="phone__btn phone__btn--vol2" />
      <span className="phone__btn phone__btn--power" />
      <div className="phone__body">
        <div className="phone__screen screen"><Dash kind="mobile" /></div>
        <span className="phone__island"><i /></span>
      </div>
    </div>
  );
}

function Monitor() {
  return (
    <div className="dev dev--monitor">
      <div className="monitor__panel">
        <Thickness depth={2.4} n={14} />
        <div className="monitor__bezel">
          <div className="monitor__screen screen"><Dash kind="wide" /></div>
          <span className="monitor__cam" />
        </div>
      </div>
      <div className="monitor__stand">
        <div className="monitor__neck"><Thickness depth={1.2} n={6} /></div>
        <div className="monitor__foot"><Thickness depth={0.5} n={4} /></div>
      </div>
    </div>
  );
}

/* ---------------- dashboards (as telas) ---------------- */

const LINE = "M0,30 C8,28 12,22 20,23 S32,14 40,16 S52,24 60,18 S74,6 82,9 S94,4 100,2";
const AREA = `${LINE} L100,40 L0,40 Z`;

function Chart({ tall }: { tall?: boolean }) {
  return (
    <svg className={`chart${tall ? " chart--tall" : ""}`} viewBox="0 0 100 40" preserveAspectRatio="none">
      <path className="chart__area" d={AREA} />
      <path className="chart__line" d={LINE} pathLength={1} />
    </svg>
  );
}

function Kpi({ l, v, d }: { l: string; v: string; d: string }) {
  return (
    <div className="kpi">
      <span className="kpi__l">{l}</span>
      <strong className="kpi__v">{v}</strong>
      <span className="kpi__d">{d}</span>
    </div>
  );
}

function Bars({ n = 5 }: { n?: number }) {
  const w = [92, 74, 58, 41, 27, 18];
  return (
    <div className="bars">
      {w.slice(0, n).map((x, k) => (
        <div key={k} className="bars__row"><span className="bars__lbl" /><span className="bars__bar" style={{ "--w": `${x}%`, "--k": k } as CSSProperties} /></div>
      ))}
    </div>
  );
}

/** "Sincronizado": o mesmo selo nas três telas, para ligar uma à outra. */
const Live = () => <span className="dash__live"><i />Sincronizado</span>;

function Dash({ kind }: { kind: "desk" | "mobile" | "wide" }) {
  if (kind === "mobile") {
    return (
      <div className="dash dash--mobile">
        <div className="dash__status"><span>9:41</span><span className="dash__sig" /></div>
        <div className="dash__top"><strong>Visão geral</strong><Live /></div>
        <div className="kpis kpis--2">
          <Kpi l="Faturamento" v="R$ 128 mil" d="+12%" />
          <Kpi l="Pedidos" v="1.284" d="+8%" />
        </div>
        <div className="dcard"><span className="dcard__t">Vendas por dia</span><Chart /></div>
        <div className="dcard"><span className="dcard__t">Mais vendidos</span><Bars n={4} /></div>
        <div className="dash__tabbar"><i className="on" /><i /><i /><i /></div>
      </div>
    );
  }
  const wide = kind === "wide";
  return (
    <div className={`dash dash--${kind}`}>
      <aside className="dash__side">
        <span className="dash__brand" />
        {Array.from({ length: wide ? 6 : 5 }, (_, k) => <span key={k} className={`dash__nav${k === 0 ? " on" : ""}`} />)}
      </aside>
      <div className="dash__main">
        <div className="dash__top"><strong>Visão geral</strong><span className="dash__tools"><Live /><span className="dash__pill">Últimos 30 dias</span></span></div>
        <div className={`kpis kpis--${wide ? 4 : 3}`}>
          <Kpi l="Faturamento" v="R$ 128,4 mil" d="+12%" />
          <Kpi l="Pedidos" v="1.284" d="+8%" />
          <Kpi l="Ticket médio" v="R$ 99,90" d="+3%" />
          {wide && <Kpi l="Conversão" v="3,8%" d="+0,4 pp" />}
        </div>
        <div className="dash__grid">
          <div className="dcard"><span className="dcard__t">Faturamento diário</span><Chart tall={wide} /></div>
          <div className="dcard"><span className="dcard__t">Por categoria</span><Bars n={wide ? 6 : 4} /></div>
        </div>
        {wide && (
          <div className="dcard dtable">
            {Array.from({ length: 4 }, (_, k) => <div key={k} className="dtable__row"><span /><span /><span /><span className="dtable__st" /></div>)}
          </div>
        )}
      </div>
    </div>
  );
}
