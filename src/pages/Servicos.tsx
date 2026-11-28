import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Icon } from "../components/Icon";
import type { IconName } from "../components/icon-data";
import { CtaCard, IdeaPrompt } from "../components/CtaCard";
import { HeroBackground } from "../components/HeroBackground";
import { SceneApp, SceneDashboard, SceneSistema, SceneSite } from "../components/ServiceScenes";

type Servico = {
  id: string; nome: string; alvo: string; icon: IconName; curto: string;
  txt: string; bom: string; recebe: string[]; curtoNome: string; Cena: (p: { ativo?: boolean }) => React.JSX.Element;
};

const SERVICOS: Servico[] = [
  { id: "sites", curtoNome: "Sites", nome: "Sites", alvo: "site", icon: "globe", Cena: SceneSite,
    curto: "Institucional, landing page ou loja",
    txt: "Site institucional, landing page para campanha ou loja virtual. Entregamos com painel de edição, para você atualizar textos e fotos sem depender da gente.",
    bom: "empresas que querem receber contatos e pedidos pelo Google e pelas redes sociais.",
    recebe: ["Layout próprio", "Painel de edição", "Formulário ligado ao seu e-mail", "SEO técnico", "Hospedagem configurada"] },
  { id: "sistemas", curtoNome: "Sistemas", nome: "Sistemas web", alvo: "sistema", icon: "database", Cena: SceneSistema,
    curto: "Pedidos, estoque, agenda e atendimento",
    txt: "Sistemas que tiram o processo das planilhas: pedidos, estoque, agenda, ordens de serviço, atendimento. Cada pessoa da equipe vê só o que precisa.",
    bom: "operações que cresceram e hoje dependem de planilhas copiadas e mensagens soltas.",
    recebe: ["Sistema no navegador", "Controle de acesso", "Relatórios", "Integrações", "Treinamento da equipe"] },
  { id: "dashboards", curtoNome: "Dashboards", nome: "Dashboards", alvo: "dashboard", icon: "chart-column", Cena: SceneDashboard,
    curto: "Os números do negócio numa tela só",
    txt: "Painéis que juntam dados de ERP, planilhas e plataformas de venda e mostram os números que você acompanha toda semana, sem montar relatório à mão.",
    bom: "gestores que perdem horas consolidando relatórios ou decidem com números de semanas atrás.",
    recebe: ["Atualização automática", "Filtros", "Acesso pelo celular", "Alertas por e-mail"] },
  { id: "apps", curtoNome: "Apps", nome: "Aplicativos Android e iOS", alvo: "aplicativo", icon: "smartphone", Cena: SceneApp,
    curto: "Para seus clientes ou sua equipe de campo",
    txt: "Apps para seus clientes agendarem, comprarem e acompanharem pedidos, ou para a equipe de campo registrar visitas e entregas.",
    bom: "negócios com clientes recorrentes ou equipes que trabalham fora do escritório.",
    recebe: ["App nas duas lojas", "Painel web para o conteúdo", "Notificações", "Suporte na aprovação da Apple e do Google"] },
];

const d = (n: number) => ({ ["--d" as string]: n }) as CSSProperties;
const dois = (n: number) => String(n).padStart(2, "0");

/**
 * Rolagem travada nos serviços: um bloco alto (svc-pin) com um palco "sticky" do tamanho da tela.
 * Enquanto o bloco passa, o palco fica parado e a rolagem troca o serviço da vez (01 → 04);
 * no fim do bloco o palco solta e a página segue. Funciona igual descendo ou subindo,
 * porque é só position: sticky + a posição da rolagem (nada de sequestrar a roda do mouse).
 * Em telas baixas demais (PIN_MQ não bate) vira a lista normal, um serviço embaixo do outro.
 */
const PIN_MQ = "(min-height: 620px)";

function ServicePin() {
  const [ativo, setAtivo] = useState(0);
  const [preso, setPreso] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const barras = useRef<(HTMLSpanElement | null)[]>([]);
  const N = SERVICOS.length;

  // posição de rolagem em que o serviço i começa (com o palco preso)
  const inicio = (i: number) => {
    const w = wrap.current, st = stage.current;
    if (!w || !st) return 0;
    // o palco prende quando o topo do bloco chega no "top" do sticky (logo abaixo do header)
    const topo = w.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(st).top || "0");
    const dist = w.offsetHeight - st.offsetHeight;
    return Math.round(topo + (dist / N) * i + (i ? 2 : 0));
  };

  const irPara = (i: number, comportamento: ScrollBehavior = "smooth") => {
    if (window.matchMedia(PIN_MQ).matches) window.scrollTo({ top: inicio(i), behavior: comportamento });
    else document.getElementById(SERVICOS[i].id)?.scrollIntoView({ behavior: comportamento });
  };

  useEffect(() => {
    const mq = window.matchMedia(PIN_MQ);
    let raf = 0;
    const medir = () => {
      raf = 0;
      const w = wrap.current, st = stage.current;
      if (!w || !st || !mq.matches) return;
      const dist = w.offsetHeight - st.offsetHeight;
      const andou = st.getBoundingClientRect().top - w.getBoundingClientRect().top; // quanto o palco já "desceu" dentro do bloco
      const p = Math.min(1, Math.max(0, andou / dist));
      setAtivo(Math.min(N - 1, Math.floor(p * N)));
      barras.current.forEach((b, i) => b?.style.setProperty("--p", String(Math.min(1, Math.max(0, p * N - i)))));
    };
    const agendar = () => { if (!raf) raf = requestAnimationFrame(medir); };
    const modo = () => { setPreso(mq.matches); agendar(); };
    modo();
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);
    mq.addEventListener("change", modo);

    // links #sites, #apps... (cartões do topo, busca do site, endereço com #) vão para o trecho certo da rolagem
    const ids = SERVICOS.map((s) => s.id);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[href*='#']") as HTMLAnchorElement | null;
      if (!a || a.pathname !== location.pathname || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const i = ids.indexOf(a.hash.slice(1));
      if (i < 0) return;
      e.preventDefault();
      history.replaceState(null, "", a.hash);
      irPara(i);
    };
    document.addEventListener("click", onClick);
    const doEndereco = ids.indexOf(location.hash.slice(1));
    if (doEndereco >= 0) requestAnimationFrame(() => irPara(doEndereco, "instant"));

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      mq.removeEventListener("change", modo);
      document.removeEventListener("click", onClick);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="svc-pin" ref={wrap} style={{ ["--n" as string]: N } as CSSProperties}>
      <div className="svc-pin__stage" ref={stage} data-hide-cta>
        <div className="container svc-pin__in">
          <ol className="svc-steps" aria-label="Serviços">
            {SERVICOS.map((s, i) => (
              <li key={s.id}>
                <button type="button" className={`svc-step${i === ativo ? " is-active" : ""}${i < ativo ? " is-done" : ""}`} onClick={() => irPara(i)} aria-current={preso && i === ativo ? "step" : undefined}>
                  <span className="svc-step__label"><b>{dois(i + 1)}</b><Icon name={s.icon} /><span>{s.curtoNome}</span></span>
                  <span className="svc-step__track"><span className="svc-step__fill" ref={(el) => { barras.current[i] = el; }} /></span>
                </button>
              </li>
            ))}
          </ol>
          <div className="svc-slides">
            {SERVICOS.map((s, i) => {
              const estado = !preso ? "" : i === ativo ? " is-active" : i < ativo ? " is-before" : " is-after";
              return (
                <section key={s.id} className={`service svc-slide${estado}`} id={s.id} aria-labelledby={`${s.id}-t`} inert={preso && i !== ativo}>
                  <div className="service__copy">
                    <span className="service__eyebrow"><span className="service__num">{dois(i + 1)}<i>/{dois(N)}</i></span><Icon name={s.icon} />{s.alvo === "aplicativo" ? "Aplicativos" : s.nome}</span>
                    <h2 id={`${s.id}-t`}>{s.nome}</h2>
                    <p>{s.txt}</p>
                    <p className="service__fit"><strong>Bom para</strong> {s.bom}</p>
                    <div className="service__gets">
                      <strong>Você recebe</strong>
                      <ul>{s.recebe.map((r, j) => <li key={r} style={{ ["--j" as string]: j } as CSSProperties}><Icon name="check" />{r}</li>)}</ul>
                    </div>
                    <div className="hero__actions">
                      <a className="btn btn--outline service__btn" href={`/contato.html?tipo=${s.id}`}>Pedir orçamento de {s.alvo}<Icon name="chevron-right" /></a>
                    </div>
                  </div>
                  <Media s={s} ativo={!preso || i === ativo} />
                </section>
              );
            })}
          </div>
          {preso && <span className="svc-pin__hint" aria-hidden="true" data-hide={ativo === N - 1 ? "" : undefined}>Role para ver o próximo<Icon name="chevron-down" /></span>}
        </div>
      </div>
    </div>
  );
}

/** Cena com leve inclinação 3D seguindo o mouse (só ponteiro fino; o CSS ignora em telas de toque). */
function Media({ s, ativo }: { s: Servico; ativo: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const mover = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--rx", String(((e.clientY - r.top) / r.height - 0.5) * -6));
    el.style.setProperty("--ry", String(((e.clientX - r.left) / r.width - 0.5) * 8));
  };
  const sair = () => { ref.current?.style.setProperty("--rx", "0"); ref.current?.style.setProperty("--ry", "0"); };
  return (
    <div className="service__stage" onPointerMove={mover} onPointerLeave={sair}>
      <span className="service__glow" aria-hidden="true" />
      <div className="service__media dots" ref={ref}>
        <s.Cena ativo={ativo} />
      </div>
    </div>
  );
}

export function Servicos() {
  return (
    <>
      <section className="container page-head svc-head">
        <HeroBackground />
        <div className="reveal">
          <span className="cta-eyebrow" style={d(0)}><span className="sync-dot" />4 tipos de projeto, todos feitos do zero</span>
          <h1 style={d(1)}>Serviços <span className="accent">sob medida</span></h1>
          <p style={d(2)}>Quatro tipos de projeto, sempre feitos do zero para o seu caso. Se o que você precisa não se encaixa em nenhum deles, conte assim mesmo.</p>
          <div className="hero__actions" data-hide-cta style={d(3)}><a className="btn btn--lg" href="/contato.html">Pedir orçamento</a></div>
        </div>
        <ul className="svc-jump reveal" id="svc-jump" aria-label="Ir para um serviço">
          {SERVICOS.map((s, i) => (
            <li key={s.id} style={d(4 + i)}>
              <a className="svc-jump__card" href={`#${s.id}`}>
                <span className="svc-jump__icon"><Icon name={s.icon} /></span>
                <span className="svc-jump__num">{dois(i + 1)}</span>
                <strong>{s.nome}</strong>
                <small>{s.curto}</small>
                <Icon name="chevron-down" className="svc-jump__go" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <ServicePin />

      <section className="container" id="svc-fim" style={{ paddingBlock: "clamp(24px,4vw,40px) clamp(56px,8vw,104px)" }}>
        <CtaCard>
          <h2>Ainda não sabe qual é o seu caso?</h2>
          <p>Descreva o problema com suas palavras. Na primeira conversa a gente indica o formato mais barato que resolve.</p>
          <IdeaPrompt />
        </CtaCard>
      </section>
    </>
  );
}
