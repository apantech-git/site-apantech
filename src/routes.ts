export type RouteId = "home" | "servicos" | "quem-somos" | "contato" | "obrigado" | "privacidade" | "termos" | "404";

export type Rota = {
  id: RouteId;
  arquivo: string;
  url: string;
  title: string;
  desc: string;
  noindex?: boolean;
  ctaFixo?: boolean;
  prioridade?: string;
};

export const ROTAS: Rota[] = [
  { id: "home", arquivo: "index.html", url: "/", prioridade: "1.0", ctaFixo: true,
    title: "apantech | Sites, sistemas, dashboards e apps sob medida",
    desc: "Desenvolvimento de sites, sistemas web, dashboards e aplicativos Android e iOS sob demanda, com IA e revisão humana. Peça um orçamento." },
  { id: "servicos", arquivo: "servicos.html", url: "/servicos.html", prioridade: "0.9", ctaFixo: true,
    title: "Serviços: sites, sistemas, dashboards e apps | apantech",
    desc: "Criação de sites, sistemas web, dashboards de indicadores e aplicativos para Android e iOS, feitos do zero para a sua empresa." },
  { id: "quem-somos", arquivo: "quem-somos.html", url: "/quem-somos.html", prioridade: "0.7", ctaFixo: true,
    title: "Quem somos | apantech",
    desc: "Conheça a apantech, empresa de software sob demanda de Campinas, e o desenvolvedor por trás de cada projeto: experiência, stacks e forma de trabalhar." },
  { id: "contato", arquivo: "contato.html", url: "/contato.html", prioridade: "0.8",
    title: "Pedir orçamento | apantech",
    desc: "Conte o que você quer construir e receba uma proposta com escopo, prazo e preço fechado. Atendimento por e-mail, WhatsApp e telefone." },
  { id: "obrigado", arquivo: "obrigado.html", url: "/obrigado.html", noindex: true,
    title: "Pedido recebido | apantech",
    desc: "Recebemos seu pedido de orçamento. Vamos responder pelo e-mail ou WhatsApp informado." },
  { id: "privacidade", arquivo: "privacidade.html", url: "/privacidade.html", prioridade: "0.3", ctaFixo: true,
    title: "Política de privacidade | apantech",
    desc: "Como a apantech coleta, usa e protege dados pessoais, uso de cookies e como exercer seus direitos pela LGPD." },
  { id: "termos", arquivo: "termos.html", url: "/termos.html", prioridade: "0.3", ctaFixo: true,
    title: "Termos de uso | apantech",
    desc: "Regras de uso do site da apantech: conteúdo, propriedade intelectual, links externos e responsabilidades." },
  { id: "404", arquivo: "404.html", url: "/404.html", noindex: true,
    title: "Página não encontrada | apantech",
    desc: "O endereço que você abriu não existe no site da apantech." },
];

export const NAV = [
  { href: "/servicos.html", label: "Serviços", id: "servicos" },
  { href: "/quem-somos.html", label: "Quem somos", id: "quem-somos" },
  { href: "/#processo", label: "Como trabalhamos", id: "" },
  { href: "/#duvidas", label: "Dúvidas", id: "" },
  { href: "/contato.html", label: "Contato", id: "contato" },
];
