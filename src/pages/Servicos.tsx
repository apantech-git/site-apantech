import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Icon } from "../components/Icon";
import type { IconName } from "../components/icon-data";
import { CtaCard, IdeaPrompt } from "../components/CtaCard";
import { HeroBackground } from "../components/HeroBackground";
import { SceneApp, SceneDashboard, SceneSistema, SceneSite } from "../components/ServiceScenes";

type Servico = {
  id: string; nome: string; alvo: string; icon: IconName; curto: string;
  txt: string; bom: string; recebe: string[]; Cena: () => React.JSX.Element;
};

const SERVICOS: Servico[] = [
  { id: "sites", nome: "Sites", alvo: "site", icon: "globe", Cena: SceneSite,
    curto: "Institucional, landing page ou loja",
    txt: "Site institucional, landing page para campanha ou loja virtual. Entregamos com painel de edição, para você atualizar textos e fotos sem depender da gente.",
    bom: "empresas que querem receber contatos e pedidos pelo Google e pelas redes sociais.",
    recebe: ["Layout próprio", "Painel de edição", "Formulário ligado ao seu e-mail", "SEO técnico", "Hospedagem configurada"] },
  { id: "sistemas", nome: "Sistemas web", alvo: "sistema", icon: "database", Cena: SceneSistema,
    curto: "Pedidos, estoque, agenda e atendimento",
    txt: "Sistemas que tiram o processo das planilhas: pedidos, estoque, agenda, ordens de serviço, atendimento. Cada pessoa da equipe vê só o que precisa.",
    bom: "operações que cresceram e hoje dependem de planilhas copiadas e mensagens soltas.",
    recebe: ["Sistema no navegador", "Controle de acesso", "Relatórios", "Integrações", "Treinamento da equipe"] },
  { id: "dashboards", nome: "Dashboards", alvo: "dashboard", icon: "chart-column", Cena: SceneDashboard,
    curto: "Os números do negócio numa tela só",
    txt: "Painéis que juntam dados de ERP, planilhas e plataformas de venda e mostram os números que você acompanha toda semana, sem montar relatório à mão.",
    bom: "gestores que perdem horas consolidando relatórios ou decidem com números de semanas atrás.",
    recebe: ["Atualização automática", "Filtros", "Acesso pelo celular", "Alertas por e-mail"] },
  { id: "apps", nome: "Aplicativos Android e iOS", alvo: "aplicativo", icon: "smartphone", Cena: SceneApp,
    curto: "Para seus clientes ou sua equipe de campo",
    txt: "Apps para seus clientes agendarem, comprarem e acompanharem pedidos, ou para a equipe de campo registrar visitas e entregas.",
    bom: "negócios com clientes recorrentes ou equipes que trabalham fora do escritório.",
    recebe: ["App nas duas lojas", "Painel web para o conteúdo", "Notificações", "Suporte na aprovação da Apple e do Google"] },
];

const d = (n: number) => ({ ["--d" as string]: n }) as CSSProperties;
const dois = (n: number) => String(n).padStart(2, "0");

/** Barra fixa com os quatro serviços: aparece depois dos cartões do topo e marca, com um destaque azul que desliza, a seção na tela. */
function ServiceNav() {
  const [ativo, setAtivo] = useState(-1);
  const [visivel, setVisivel] = useState(false);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const hl = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const secoes = SERVICOS.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setAtivo(secoes.indexOf(e.target as HTMLElement));
    }, { rootMargin: "-45% 0px -50% 0px" });
    secoes.forEach((s) => io.observe(s));
    const topo = document.getElementById("svc-jump");
    const fim = document.getElementById("svc-fim");
    let passouTopo = false, chegouFim = false;
    const io2 = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === topo) passouTopo = !e.isIntersecting && e.boundingClientRect.top < 0;
        if (e.target === fim) chegouFim = e.isIntersecting || e.boundingClientRect.top < 0;
      }
      setVisivel(passouTopo && !chegouFim);
    });
    if (topo) io2.observe(topo);
    if (fim) io2.observe(fim);
    return () => { io.disconnect(); io2.disconnect(); };
  }, []);

  useEffect(() => {
    const a = links.current[ativo], h = hl.current;
    if (!h) return;
    if (!a) { h.style.opacity = "0"; return; }
    h.style.opacity = "1";
    h.style.width = `${a.offsetWidth}px`;
    h.style.translate = `${a.offsetLeft}px 0`;
  }, [ativo, visivel]);

  return (
    <nav className={`svc-nav${visivel ? " is-on" : ""}`} aria-label="Serviços desta página">
      <div className="tabs svc-nav__tabs">
        <span className="tabs__highlight" ref={hl} aria-hidden="true" />
        {SERVICOS.map((s, i) => (
          <a key={s.id} ref={(el) => { links.current[i] = el; }} className={`tab${i === ativo ? " is-active" : ""}`} href={`#${s.id}`} aria-current={i === ativo ? "location" : undefined} tabIndex={visivel ? 0 : -1}>
            <Icon name={s.icon} />{s.nome}
          </a>
        ))}
      </div>
    </nav>
  );
}

/** Cena com leve inclinação 3D seguindo o mouse (só ponteiro fino; o CSS ignora em telas de toque). */
function Media({ s, i }: { s: Servico; i: number }) {
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
    <div className="service__stage" data-reveal onPointerMove={mover} onPointerLeave={sair}>
      <span className="service__glow" aria-hidden="true" />
      <div className="service__media dots" ref={ref}>
        <s.Cena />
        <span className="service__badge" aria-hidden="true"><Icon name={s.icon} />{dois(i + 1)}</span>
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

      <ServiceNav />

      <div className="container">
        {SERVICOS.map((s, i) => (
          <section key={s.id} className="service" id={s.id} aria-labelledby={`${s.id}-t`}>
            <span className="service__line" data-reveal aria-hidden="true" />
            <div className="service__copy" data-reveal="stagger">
              <span className="service__eyebrow"><span className="service__num">{dois(i + 1)}<i>/{dois(SERVICOS.length)}</i></span><Icon name={s.icon} />{s.alvo === "aplicativo" ? "Aplicativos" : s.nome}</span>
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
            <Media s={s} i={i} />
          </section>
        ))}
      </div>

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
