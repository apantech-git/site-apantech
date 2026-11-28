import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./icon-data";
import { DUR_APP, DUR_DASHBOARD, DUR_SISTEMA, DUR_SITE, SceneApp, SceneDashboard, SceneSistema, SceneSite, type SceneCtl } from "./ServiceScenes";

/**
 * "Vídeo" da página inicial controlado pela rolagem: um só filme passando por site, sistema, dashboard e app.
 * - O bloco é alto e o palco fica preso (sticky) enquanto ele passa; a posição da rolagem é o tempo do vídeo.
 *   Descer avança, subir volta, parar pausa. No fim, o palco solta e a página segue.
 * - Cada capítulo abre com uma cartela de título e depois avança os passos da cena (as mesmas de Serviços),
 *   com uma legenda narrando o que acontece.
 * - Em telas baixas demais para prender (PIN_MQ), o vídeo roda sozinho quando está na tela.
 */
const PIN_MQ = "(min-height: 620px)";
const TITULO = 0.14;  // parte de cada capítulo ocupada pela cartela de título
const SEGUNDOS = 48;  // duração "de mentira" mostrada no player
const CAPA = 0.06;    // começo da rolagem reservado à capa (antes do vídeo começar)

type Capitulo = {
  id: string; nome: string; icon: IconName; frase: string; passos: number;
  Cena: (p: SceneCtl) => React.JSX.Element;
  legendas: [number, string][]; // [passo em que começa, texto]
};

const CAPS: Capitulo[] = [
  { id: "site", nome: "Site", icon: "globe", frase: "Um site que recebe pedidos", Cena: SceneSite, passos: DUR_SITE.length,
    legendas: [[0, "Tudo começa com o seu endereço na internet."], [2, "Um layout feito para a sua marca, não um tema comprado."], [6, "Produtos organizados para o cliente achar rápido."], [7, "O cliente clica em Encomendar…"], [9, "…e o pedido chega direto no seu e-mail."]] },
  { id: "sistema", nome: "Sistema web", icon: "database", frase: "A operação fora das planilhas", Cena: SceneSistema, passos: DUR_SISTEMA.length,
    legendas: [[0, "Os pedidos saem da planilha e vão para um sistema."], [1, "Os números do dia, sempre certos."], [2, "Cada pedido com cliente, status e histórico."], [3, "Pedido novo aparece na hora para toda a equipe."], [4, "Um clique para marcar como entregue…"], [6, "…e o cliente é avisado no WhatsApp, sozinho."]] },
  { id: "dashboard", nome: "Dashboard", icon: "chart-column", frase: "Os números do negócio numa tela", Cena: SceneDashboard, passos: DUR_DASHBOARD.length,
    legendas: [[0, "Os números do negócio numa tela só."], [1, "Faturamento, clientes e ticket médio, atualizados sozinhos."], [2, "Vendas dia a dia, sem montar relatório."], [3, "Quais canais vendem mais."], [4, "Quanto falta para a meta do mês."], [6, "E um alerta quando algo muda."]] },
  { id: "app", nome: "App Android e iOS", icon: "smartphone", frase: "Seu negócio no celular do cliente", Cena: SceneApp, passos: DUR_APP.length,
    legendas: [[0, "Seu app nas lojas Android e iOS."], [1, "O cliente escolhe o serviço…"], [2, "…o dia…"], [3, "…e o horário."], [4, "Confirma com um toque."], [5, "Agendado, sem ligação nem mensagem."], [6, "E o lembrete chega no celular."]] },
];
const N = CAPS.length;
// a rolagem redesenha o player a cada quadro; cada cena só redesenha quando o passo dela muda
const CENAS = CAPS.map((k) => memo(k.Cena));

const tempo = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// em que capítulo e passo o vídeo está, a partir do progresso total (0 a 1)
function quadro(p: number) {
  if (!Number.isFinite(p)) p = 0;
  const c = Math.min(N - 1, Math.floor(p * N));
  const local = Math.min(1, Math.max(0, p * N - c));
  const n = CAPS[c].passos;
  const titulo = local < TITULO;
  const passo = titulo ? 0 : Math.min(n - 1, Math.floor(((local - TITULO) / (0.95 - TITULO)) * n));
  return { c, passo, titulo };
}

export function ShowReel() {
  const [p, setP] = useState(0);
  const [preso, setPreso] = useState(false);
  const [tocando, setTocando] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);

  const inicio = (c: number) => {
    const w = wrap.current, st = stage.current;
    if (!w || !st) return 0;
    const topo = w.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(st).top || "0");
    return Math.round(topo + (w.offsetHeight - st.offsetHeight) * (CAPA + ((1 - CAPA) * c) / N) + 2);
  };
  const irPara = (c: number) => {
    if (window.matchMedia(PIN_MQ).matches) window.scrollTo({ top: inicio(c), behavior: "smooth" });
    else setP(CAPA + ((1 - CAPA) * c) / N + 0.001);
  };

  useEffect(() => {
    const mq = window.matchMedia(PIN_MQ);
    let raf = 0, parado: ReturnType<typeof setTimeout>, ultimo = -1;
    const medir = () => {
      raf = 0;
      const w = wrap.current, st = stage.current;
      if (!w || !st || !mq.matches) return;
      const dist = w.offsetHeight - st.offsetHeight;
      if (dist <= 0) return; // ainda sem a altura de "preso": nada a medir
      const andou = st.getBoundingClientRect().top - w.getBoundingClientRect().top;
      const novo = Math.min(1, Math.max(0, andou / dist));
      // tela cheia: o vídeo se abre de "card" até a tela toda enquanto a seção entra, e se fecha ao sair
      const vh = window.innerHeight;
      const entrada = Math.min(1, Math.max(0, 1 - w.getBoundingClientRect().top / (vh * 0.85)));
      const saida = Math.min(1, Math.max(0, -st.getBoundingClientRect().top / (vh * 0.6)));
      st.style.setProperty("--entrada", Math.min(entrada, 1 - saida).toFixed(3));
      if (novo !== ultimo) {
        if (ultimo >= 0 && novo > 0 && novo < 1) { setTocando(true); clearTimeout(parado); parado = setTimeout(() => setTocando(false), 450); }
        ultimo = novo;
        setP(novo);
      }
    };
    const agendar = () => { if (!raf) raf = requestAnimationFrame(medir); };
    const modo = () => { setPreso(mq.matches); requestAnimationFrame(agendar); }; // mede depois que a classe is-pinned deixa o bloco alto
    modo();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    mq.addEventListener("change", modo);
    return () => {
      cancelAnimationFrame(raf); clearTimeout(parado);
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      mq.removeEventListener("change", modo);
    };
  }, []);

  // sem prender (tela baixa): o vídeo roda sozinho enquanto está na tela
  useEffect(() => {
    if (preso || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = wrap.current;
    if (!el) return;
    let raf = 0, antes = 0, visivel = false;
    const passo = (t: number) => {
      if (antes) setP((v) => (v + (t - antes) / (SEGUNDOS * 1000)) % 1);
      antes = t;
      raf = requestAnimationFrame(passo);
    };
    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      cancelAnimationFrame(raf); antes = 0;
      setTocando(visivel);
      if (visivel) raf = requestAnimationFrame(passo);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [preso]);

  // capa: fundo do tema com o título e o play; depois dela, pv é o progresso do vídeo em si
  const capa = p < CAPA;
  const pv = Math.max(0, (p - CAPA) / (1 - CAPA));
  const { c, passo, titulo } = quadro(pv);
  const cap = CAPS[c];
  const legenda = titulo ? cap.frase : [...cap.legendas].reverse().find(([k]) => k <= passo)![1];

  return (
    <div className={`reel${preso ? " is-pinned" : ""}`} ref={wrap} style={{ ["--n" as string]: N } as CSSProperties}>
      <div className={`reel__stage${capa ? " is-capa" : titulo ? " is-title" : ""}`} ref={stage} data-hide-cta>
        <div className="container reel__in">
          <div className="reel__head">
            <span className="cta-eyebrow"><span className="sync-dot" />{preso ? "Role a página para assistir" : "Veja em ação"}</span>
            <h2 id="reel-t">Do site ao app, <span className="accent">veja como fica</span></h2>
          </div>

          <div className="reel__player" ref={player}>
            <div className="reel__screen dots" role="group" aria-roledescription="vídeo" aria-labelledby="reel-t">
              {CAPS.map((k, i) => {
                const estado = i === c ? "is-active" : i < c ? "is-before" : "is-after";
                const Cena = CENAS[i];
                return (
                  <div key={k.id} className={`reel__scene ${estado}`} aria-hidden={i !== c}>
                    <div className="reel__frame"><Cena passo={i === c ? passo : i < c ? k.passos - 1 : 0} /></div>
                  </div>
                );
              })}
              <div className={`reel__poster${capa ? " on" : ""}`} aria-hidden={!capa}>
                <span className="reel__poster-tag"><span className="sync-dot" />Vídeo · {N} capítulos</span>
                <b className="reel__poster-h">Do site ao app,<br /><span className="accent">veja como fica</span></b>
                <span className="reel__poster-play"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" /></svg></span>
                <span className="reel__poster-sub">Role a página para assistir</span>
                <span className="reel__poster-chaps">
                  {CAPS.map((k, i) => <span key={k.id}><Icon name={k.icon} />{String(i + 1).padStart(2, "0")} {k.nome}</span>)}
                </span>
              </div>
              {CAPS.map((k, i) => (
                <div key={k.id} className={`reel__title${!capa && i === c && titulo ? " on" : ""}`} aria-hidden="true">
                  <span className="reel__title-num">{String(i + 1).padStart(2, "0")}<i>/{String(N).padStart(2, "0")}</i></span>
                  <span className="reel__title-icon"><Icon name={k.icon} /></span>
                  <b>{k.nome}</b>
                  <small>{k.frase}</small>
                </div>
              ))}
            </div>
          </div>

          <p className="reel__caption" aria-live="polite"><span key={legenda}>{legenda}</span></p>

          <div className="reel__controls">
            <span className={`reel__play${tocando ? " is-playing" : ""}`} aria-hidden="true">
              <svg viewBox="0 0 24 24"><path className="reel__pause" d="M8 5v14M16 5v14" /><path className="reel__tri" d="M7 4.5v15l12-7.5z" /></svg>
            </span>
            <span className="reel__time">{tempo(pv * SEGUNDOS)} <i>/ {tempo(SEGUNDOS)}</i></span>
            <div className="reel__bar">
              {CAPS.map((k, i) => (
                <button key={k.id} type="button" className={`reel__chap${!capa && i === c ? " is-active" : ""}`} onClick={() => irPara(i)} aria-label={`Ir para ${k.nome}`}>
                  <span className="reel__track"><span style={{ scale: `${Math.min(1, Math.max(0, pv * N - i))} 1` }} /></span>
                  <span className="reel__chap-name"><Icon name={k.icon} />{k.nome}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
