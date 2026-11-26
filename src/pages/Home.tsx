import { Icon } from "../components/Icon";
import { Accordion, ProjectTabs, type Projeto } from "../components/Interactive";
import { whatsUrl } from "../config";
import { HeroDevices } from "../components/HeroDevices";
import { IaFlow } from "../components/IaFlow";
import { CtaCard, IdeaPrompt } from "../components/CtaCard";

export const PROJETOS: Projeto[] = [
  { id: "site", label: "Site", icon: "globe", img: "site", title: "Site institucional, landing page ou loja virtual",
    text: "Para quem precisa aparecer no Google, explicar o que vende e receber contatos pelo site.",
    items: ["Layout desenhado para a sua marca, sem tema comprado", "Painel para você editar textos, fotos e preços", "SEO técnico, sitemap e imagem de compartilhamento prontos", "Carrega rápido no 4G e em Wi-Fi fraco"],
    alt: "Ilustração de um site de padaria com botão de encomenda e cardápio em destaque" },
  { id: "sistema", label: "Sistema", icon: "database", img: "sistema", title: "Sistema web para a operação da empresa",
    text: "Pedidos, estoque, agenda, atendimento ou o processo que hoje vive em planilhas e grupos de WhatsApp.",
    items: ["Login com níveis de acesso por função", "Cadastros, relatórios e exportação para Excel", "Integração com ERP, meios de pagamento e WhatsApp", "Backup automático e histórico de alterações"],
    alt: "Ilustração de um sistema de pedidos com menu lateral e tabela de pedidos por status" },
  { id: "dashboard", label: "Dashboard", icon: "chart-column", img: "dashboard", title: "Dashboard com os números do negócio",
    text: "Juntamos dados de planilhas, ERP e sistemas de venda numa tela que se atualiza sozinha.",
    items: ["Indicadores atualizados automaticamente", "Filtros por período, loja, vendedor ou produto", "Funciona no celular", "Alerta por e-mail quando um número sai do esperado"],
    alt: "Ilustração de um dashboard de vendas com faturamento, pedidos, ticket médio e gráfico diário" },
  { id: "app", label: "App", icon: "smartphone", img: "apps", title: "Aplicativo para Android e iOS",
    text: "Apps para clientes ou para a equipe de campo, publicados na Google Play e na App Store.",
    items: ["Uma base de código para Android e iOS quando o projeto permite", "Notificações push", "Continua funcionando com sinal fraco e sincroniza depois", "Publicação nas lojas e acompanhamento da aprovação"],
    alt: "Ilustração de dois celulares: um app de agendamento de consulta e um app de rotas de entrega" },
];

const PASSOS = [
  ["Conversa", "Uma chamada de 30 minutos para entender o problema, quem vai usar e qual prazo você tem."],
  ["Proposta", "Você recebe por escrito o escopo, o prazo e o preço fechado. Nada de cobrança por hora."],
  ["Protótipo", "Antes de programar, você navega pelas telas e pede ajustes. Mudar aqui custa pouco."],
  ["Desenvolvimento", "A cada uma ou duas semanas sai uma versão nova num endereço de teste que você abre no celular."],
  ["Entrega", "Publicamos, treinamos sua equipe e acompanhamos as primeiras semanas de uso."],
];

const FAQ = [
  { q: "Quanto custa um projeto?", a: "Depende do que precisa ser feito. Depois da primeira conversa mandamos uma proposta com preço fechado e as etapas de pagamento. Se o escopo mudar no meio do caminho, o valor da mudança é combinado antes." },
  { q: "Quanto tempo leva?", a: "O prazo vem na proposta, junto com o preço. Sites saem mais rápido; sistemas e apps dependem do número de telas e de integrações com outros sistemas." },
  { q: "O código fica comigo?", a: "Fica. O código vai para um repositório no seu nome (GitHub, GitLab ou Bitbucket), junto com a documentação para outro desenvolvedor dar continuidade se você quiser." },
  { q: "Vocês usam IA? O resultado é confiável?", a: "Usamos IA para escrever rascunhos de código e testes mais rápido. Todo trecho passa por revisão de um desenvolvedor, e o projeto tem testes automáticos que rodam a cada alteração." },
  { q: "Vocês fazem manutenção depois da entrega?", a: "Sim. Depois do período de acompanhamento você pode contratar um plano mensal com correções, atualizações de segurança e pequenas melhorias." },
  { q: "Atendem empresas de outras cidades?", a: "Sim. As reuniões são por vídeo e você acompanha o andamento pelo endereço de teste, de qualquer lugar do Brasil." },
];

export function Home() {
  return (
    <>
      <section className="container hero" aria-labelledby="hero-titulo">
        <div className="hero__copy reveal">
          <a className="badge" href="#ia" style={{ ["--d" as string]: 0 }}>
            <Icon name="sparkles" />Software sob demanda com IA<Icon name="chevron-right" />
          </a>
          <h1 id="hero-titulo" style={{ ["--d" as string]: 1 }}>Sites, sistemas e apps <span className="accent">sob medida</span> para a sua empresa</h1>
          <p className="hero__sub" style={{ ["--d" as string]: 2 }}>
            A apantech desenvolve software sob demanda com ajuda de IA. A IA acelera o código e os testes; um desenvolvedor revisa cada entrega antes de ela ir ao ar.
          </p>
          <div className="hero__actions" style={{ ["--d" as string]: 3 }} data-hide-cta>
            <a className="btn btn--lg" href="/contato.html">Pedir orçamento</a>
            <a className="btn btn--lg btn--outline" href={whatsUrl} target="_blank" rel="noopener"><Icon name="message-circle" />Conversar no WhatsApp</a>
          </div>
        </div>
        <HeroDevices />
      </section>

      <section className="container" aria-labelledby="config-titulo" style={{ paddingBottom: "clamp(56px, 8vw, 104px)" }}>
        <h2 id="config-titulo" className="sr-only">O que você precisa construir?</h2>
        <ProjectTabs items={PROJETOS} />
      </section>

      <section className="section section--line" id="processo" aria-labelledby="processo-titulo">
        <div className="container">
          <div className="section__head section__head--center" data-reveal>
            <h2 id="processo-titulo">Como trabalhamos</h2>
            <p>Cinco etapas, sempre nesta ordem. Você aprova cada uma antes de seguirmos para a próxima.</p>
          </div>
          <ol className="steps" data-reveal="stagger">{PASSOS.map(([t, d]) => <li key={t} className="step"><h3>{t}</h3><p>{d}</p></li>)}</ol>
        </div>
      </section>

      <section className="section section--line" id="ia" aria-labelledby="ia-titulo">
        <IaFlow />
      </section>

      <section className="section section--line" id="duvidas" aria-labelledby="duvidas-titulo">
        <div className="container">
          <div className="section__head section__head--center" data-reveal><h2 id="duvidas-titulo">Dúvidas frequentes</h2></div>
          <Accordion items={FAQ} />
        </div>
      </section>

      <section className="container" style={{ paddingBottom: "clamp(56px, 8vw, 104px)" }} aria-labelledby="faixa-titulo">
        <CtaCard>
          <span className="cta-eyebrow"><span className="sync-dot" />Agenda aberta para novos projetos</span>
          <h2 id="faixa-titulo">Conte o que você quer <span className="accent">construir</span></h2>
          <p>Escreva sua ideia em uma frase. Ela já chega no formulário, e retornamos por e-mail ou WhatsApp para marcar a primeira conversa.</p>
          <IdeaPrompt />
          <p className="cta-alt">
            Prefere conversar? <a href={whatsUrl} target="_blank" rel="noopener"><Icon name="message-circle" />Chamar no WhatsApp</a>
            <span aria-hidden="true">·</span>
            <a href="/servicos.html">Ver serviços</a>
          </p>
        </CtaCard>
      </section>
    </>
  );
}
