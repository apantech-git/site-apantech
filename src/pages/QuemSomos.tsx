import { Icon } from "../components/Icon";
import type { IconName } from "../components/icon-data";
import { CtaCard, IdeaPrompt } from "../components/CtaCard";
import { empresa, whatsUrl } from "../config";
import { asset } from "../lib/utils";

/* ---------- conteúdo (fonte: currículo do fundador) ---------- */
const HISTORIA = [
  { ano: "2018", t: "A base", d: "Começa a graduação em Análise e Desenvolvimento de Sistemas na Faculdade Impacta, junto com os estudos de Java." },
  { ano: "2020", t: "Primeiros sistemas sob medida", d: "Um sistema de controle de estoque e finanças para uma empresa do ramo têxtil e, no ano seguinte, uma plataforma de ensino a distância para uma grande rede atacadista." },
  { ano: "2021", t: "Supply chain", d: "Desenvolvimento em módulos de planejamento de demanda e estoque de um sistema de supply chain usado por indústrias." },
  { ano: "2022", t: "Produtos financeiros em escala", d: "Arquitetura de uma plataforma de adiantamento salarial com mais de 62 mil associados, crédito em tempo real e prevenção a fraudes. No mesmo período, MBA em Full Stack Development na FIAP." },
  { ano: "2026", t: "Nasce a apantech", d: "A experiência de anos construindo produtos de ponta a ponta vira empresa. O primeiro projeto: um ecossistema web e mobile para a gestão operacional de gramados e maquinários." },
];

const VALORES: { i: IconName; t: string; d: string }[] = [
  { i: "message-circle", t: "Você fala com quem programa", d: "Sem intermediários: quem entende o seu problema é quem escreve o código." },
  { i: "file-text", t: "Escopo e preço por escrito", d: "Proposta com prazo e preço fechado antes de começar. Mudanças são combinadas antes." },
  { i: "code", t: "O código é seu", d: "Repositório no seu nome e documentação para qualquer desenvolvedor continuar." },
  { i: "sparkles", t: "IA com revisão humana", d: "A IA acelera o trabalho repetitivo; cada entrega passa por revisão antes de ir ao ar." },
];

/* A logo será criada. Quando sair, troque o texto "em breve" do símbolo. */
const MARCA: { t: string; d: string; breve?: boolean; cor?: string }[] = [
  { t: "O nome", d: "apant + tech. Uma homenagem à apant, empresa de edição de casamentos e filmagens de Antenor José Silvestre, pai do fundador. O nome continua, agora no ramo em que a apantech traz experiência, conhecimento e visão de futuro." },
  { t: "O símbolo", d: "O símbolo está em desenvolvimento. Quando for lançado, explicamos o que cada forma representa.", breve: true },
  { t: "A cor", d: "O azul vibrante é a cor de destaque da marca: aparece nos detalhes, nos estados ativos e nos pontos que pedem atenção.", cor: "#27A4F2" },
];

const NUMEROS = [
  { n: "5+", d: "anos construindo produtos web e mobile" },
  { n: "62 mil+", d: "associados usando uma plataforma que ele arquitetou" },
  { n: "R$ 7 mi+", d: "pagos por essa plataforma, em mais de 4.400 operações" },
];

const STACKS: { g: string; i: IconName; itens: string[] }[] = [
  { g: "Front-end", i: "globe", itens: ["Angular", "React", "TypeScript", "JavaScript", "HTML5", "CSS3", "SASS", "Tailwind CSS", "PrimeNG", "Bootstrap"] },
  { g: "Mobile", i: "smartphone", itens: ["Ionic", "Capacitor (Android e iOS)", "PWA"] },
  { g: "Back-end", i: "code", itens: ["Node.js", "Express.js", "APIs REST", "Processamento assíncrono", "PHP", "Python"] },
  { g: "Banco de dados", i: "database", itens: ["MongoDB", "MySQL", "PL/SQL", "SQLite", "Firestore"] },
  { g: "Infra e DevOps", i: "chart-column", itens: ["Azure", "Azure DevOps (CI/CD)", "Docker", "Docker Compose", "Nginx", "Git e GitHub"] },
  { g: "Segurança", i: "shield-check", itens: ["Firebase Authentication", "Biometria", "Validação de dados", "Prevenção a fraudes"] },
  { g: "UX e protótipo", i: "sparkles", itens: ["Figma", "Adobe XD"] },
];

const FORMACAO = [
  { t: "MBA em Full Stack Development", d: "FIAP · 2022 – 2023" },
  { t: "Análise e Desenvolvimento de Sistemas", d: "Faculdade Impacta · 2018 – 2020" },
  { t: "MEAN Stack e Java Programmer", d: "Cursos complementares · Impacta" },
];

export function QuemSomos() {
  return (
    <>
      <section className="container page-head about-head">
        <div className="reveal">
          <span className="badge" style={{ ["--d" as string]: 0 }}><Icon name="house" />Quem somos</span>
          <h1 style={{ ["--d" as string]: 1 }}>Software sob medida, feito por <span className="accent">quem programa</span></h1>
          <p style={{ ["--d" as string]: 2 }}>
            A apantech é uma empresa de tecnologia de {empresa.cidade} - {empresa.uf} que desenvolve sites, sistemas web, dashboards e aplicativos.
            Somos pequenos de propósito: você conversa direto com quem desenha a arquitetura e escreve o código do seu projeto.
          </p>
          <ul className="about-facts" style={{ ["--d" as string]: 3 }}>
            <li><Icon name="map-pin" />{empresa.cidade} - {empresa.uf}, atendendo todo o Brasil</li>
            <li><Icon name="clock" />Mais de 5 anos de experiência</li>
            <li><Icon name="shield-check" />Experiência em sistemas financeiros</li>
          </ul>
        </div>
      </section>

      {/* ---------- história ---------- */}
      <section className="section section--line" aria-labelledby="historia-t">
        <div className="container about-split">
          <div className="section__head about-sticky" data-reveal>
            <h2 id="historia-t">Nossa história</h2>
            <p>A apantech desenvolve software sob medida para empresas que precisam de mais do que um sistema pronto: sites, sistemas web, dashboards e aplicativos feitos para o jeito de cada negócio trabalhar.</p>
            <p>Por trás dela estão anos construindo produtos de ponta a ponta, do banco de dados ao app na loja, em setores onde erro custa caro, como o financeiro.</p>
          </div>
          <ol className="timeline" data-reveal="stagger">
            {HISTORIA.map((h, i) => (
              <li key={h.ano} className={i === HISTORIA.length - 1 ? "is-now" : undefined}>
                <span className="timeline__dot" aria-hidden="true" />
                <span className="timeline__ano">{h.ano}</span>
                <h3>{h.t}</h3>
                <p>{h.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- valores ---------- */}
      <section className="section section--line" aria-labelledby="valores-t">
        <div className="container">
          <div className="section__head section__head--center" data-reveal>
            <h2 id="valores-t">Como pensamos</h2>
            <p>Quatro compromissos que valem para qualquer projeto, do site ao aplicativo.</p>
          </div>
          <div className="values" data-reveal="stagger">
            {VALORES.map((v) => (
              <div key={v.t} className="value">
                <span className="feature__icon"><Icon name={v.i} /></span>
                <strong>{v.t}</strong>
                <span>{v.d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- marca ---------- */}
      <section className="section section--line" id="marca" aria-labelledby="marca-t">
        <div className="container brand-sec">
          <div className="brand-stage dots" data-reveal aria-hidden="true">
            <span className="brand-stage__tag"><span className="sync-dot" />Nova identidade em criação</span>
            <span className="brand-word wm">apan<span className="wm__tech">tech</span><span className="logo__cursor" /></span>
            <span className="brand-eq">apant<i>+</i>tech</span>
            <span className="brand-stage__grid" />
          </div>
          <div>
            <div className="section__head" data-reveal>
              <h2 id="marca-t">A marca apantech</h2>
              <p>O nome já tem história; a logo está sendo desenhada. Quando ela for lançada, esta seção vai contar o que cada parte dela significa.</p>
            </div>
            <ul className="brand-list" data-reveal="stagger">
              {MARCA.map((m) => (
                <li key={m.t}>
                  <span className="brand-list__ico" style={m.cor ? { background: m.cor, borderColor: m.cor } : undefined}>
                    {!m.cor && <Icon name="sparkles" />}
                  </span>
                  <div>
                    <strong>{m.t}{m.breve && <span className="soon">Em breve</span>}{m.cor && <code className="hex">{m.cor}</code>}</strong>
                    <p>{m.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- fundador ---------- */}
      <section className="section section--line" id="fundador" aria-labelledby="fundador-t">
        <div className="container founder">
          <div className="founder__media" data-reveal>
            <div className="founder__photo">
              <img
                src={asset("/img/vinicius-960.webp")}
                srcSet={`${asset("/img/vinicius-480.webp")} 480w, ${asset("/img/vinicius-960.webp")} 960w`}
                sizes="(max-width: 860px) 80vw, 400px"
                width={960} height={1200} loading="lazy" decoding="async"
                alt="Vinicius Lucas Silvestre, fundador da apantech, de óculos e camiseta branca"
              />
            </div>
            <span className="founder__chip founder__chip--a" aria-hidden="true"><Icon name="code" />Full stack</span>
            <span className="founder__chip founder__chip--b" aria-hidden="true"><Icon name="smartphone" />Web e mobile</span>
          </div>

          <div className="founder__body">
            <div data-reveal>
              <p className="eyebrow">Quem desenvolve</p>
              <h2 id="fundador-t">Vinicius Lucas Silvestre</h2>
              <p className="founder__role">Fundador e engenheiro de software full stack</p>
              <p>Desenvolvedor full stack com mais de 5 anos levando produtos web e mobile da ideia ao deploy, em contato direto com o negócio. A maior parte desse tempo foi no setor financeiro, com crédito consignado e adiantamento salarial: integrações com APIs de bancos, processamento assíncrono, alta concorrência e segurança antifraude.</p>
              <p>Também responde pela gestão técnica dos projetos, da arquitetura à entrega em produção, com CI/CD no Azure DevOps e aplicações em contêineres Docker. Hoje incorpora IA no fluxo de desenvolvimento para entregar mais rápido sem abrir mão da revisão.</p>
            </div>

            <dl className="stats" data-reveal="stagger">
              {NUMEROS.map((n) => <div key={n.n}><dt>{n.n}</dt><dd>{n.d}</dd></div>)}
            </dl>
          </div>
        </div>

        <div className="container">
          <div className="section__head" data-reveal style={{ marginTop: "clamp(48px, 7vw, 80px)" }}>
            <h3 className="h-sub">Stacks e ferramentas</h3>
          </div>
          <div className="stacks" data-reveal="stagger">
            {STACKS.map((s) => (
              <div key={s.g} className="stack">
                <div className="stack__head"><span className="feature__icon"><Icon name={s.i} /></span><strong>{s.g}</strong></div>
                <ul>{s.itens.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
            <div className="stack stack--edu">
              <div className="stack__head"><span className="feature__icon"><Icon name="file-text" /></span><strong>Formação</strong></div>
              <ul className="edu">{FORMACAO.map((f) => <li key={f.t}><strong>{f.t}</strong><span>{f.d}</span></li>)}</ul>
            </div>
          </div>
          <p className="founder__contact" data-reveal>
            Quer falar direto com ele?
            <a href={`mailto:${empresa.email}`}><Icon name="mail" />{empresa.email}</a>
            <a href={whatsUrl} target="_blank" rel="noopener"><Icon name="message-circle" />WhatsApp {empresa.telExibir}</a>
          </p>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: "clamp(56px, 8vw, 104px)" }}>
        <CtaCard>
          <h2>Vamos construir o seu projeto?</h2>
          <p>Conte em uma frase o que você precisa. A primeira conversa é com quem vai desenvolver.</p>
          <IdeaPrompt />
        </CtaCard>
      </section>
    </>
  );
}
