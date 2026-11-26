import { Icon } from "../components/Icon";
import { Picture } from "../components/Picture";
import { ContactForm } from "../components/ContactForm";
import { CtaCard, IdeaPrompt } from "../components/CtaCard";
import { PROJETOS } from "./Home";
import { empresa, enderecoLinha, titular, whatsUrl } from "../config";
import { emit } from "../lib/utils";

const SERVICOS = [
  { id: "sites", img: "site", nome: "Sites", alvo: "site",
    txt: "Site institucional, landing page para campanha ou loja virtual. Entregamos com painel de edição, para você atualizar textos e fotos sem depender da gente.",
    bom: "empresas que querem receber contatos e pedidos pelo Google e pelas redes sociais.",
    recebe: "layout próprio, painel de edição, formulário ligado ao seu e-mail, SEO técnico e hospedagem configurada." },
  { id: "sistemas", img: "sistema", nome: "Sistemas web", alvo: "sistema",
    txt: "Sistemas que tiram o processo das planilhas: pedidos, estoque, agenda, ordens de serviço, atendimento. Cada pessoa da equipe vê só o que precisa.",
    bom: "operações que cresceram e hoje dependem de planilhas copiadas e mensagens soltas.",
    recebe: "sistema no navegador, controle de acesso, relatórios, integrações e treinamento da equipe." },
  { id: "dashboards", img: "dashboard", nome: "Dashboards", alvo: "dashboard",
    txt: "Painéis que juntam dados de ERP, planilhas e plataformas de venda e mostram os números que você acompanha toda semana, sem montar relatório à mão.",
    bom: "gestores que perdem horas consolidando relatórios ou decidem com números de semanas atrás.",
    recebe: "dashboard com atualização automática, filtros, acesso pelo celular e alertas por e-mail." },
  { id: "apps", img: "apps", nome: "Aplicativos Android e iOS", alvo: "aplicativo",
    txt: "Apps para seus clientes agendarem, comprarem e acompanharem pedidos, ou para a equipe de campo registrar visitas e entregas.",
    bom: "negócios com clientes recorrentes ou equipes que trabalham fora do escritório.",
    recebe: "app nas duas lojas, painel web para gerenciar o conteúdo, notificações e suporte na aprovação da Apple e do Google." },
] as const;

export function Servicos() {
  return (
    <>
      <section className="container page-head">
        <h1>Serviços</h1>
        <p>Quatro tipos de projeto, sempre feitos do zero para o seu caso. Se o que você precisa não se encaixa em nenhum deles, conte assim mesmo.</p>
        <div className="hero__actions" data-hide-cta><a className="btn btn--lg" href="/contato.html">Pedir orçamento</a></div>
      </section>
      <div className="container">
        {SERVICOS.map((s, i) => (
          <section key={s.id} className="service" id={s.id} aria-labelledby={`${s.id}-t`} data-reveal="stagger">
            <div>
              <h2 id={`${s.id}-t`}>{s.nome}</h2>
              <p>{s.txt}</p>
              <dl><div><dt>Bom para</dt><dd>{s.bom}</dd></div><div><dt>Você recebe</dt><dd>{s.recebe}</dd></div></dl>
              <div className="hero__actions" style={{ justifyContent: "flex-start", marginTop: 24 }}>
                <a className="btn btn--outline" href={`/contato.html?tipo=${s.id}`}>Pedir orçamento de {s.alvo}</a>
              </div>
            </div>
            <div className="service__media dots">
              <Picture name={s.img} alt={PROJETOS.find((p) => p.img === s.img)!.alt} sizes="(max-width: 860px) 94vw, 520px" priority={i === 0} />
            </div>
          </section>
        ))}
      </div>
      <section className="container" style={{ paddingBlock: "clamp(24px,4vw,40px) clamp(56px,8vw,104px)" }}>
        <CtaCard>
          <h2>Ainda não sabe qual é o seu caso?</h2>
          <p>Descreva o problema com suas palavras. Na primeira conversa a gente indica o formato mais barato que resolve.</p>
          <IdeaPrompt />
        </CtaCard>
      </section>
    </>
  );
}

export function Contato() {
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoLinha)}`;
  return (
    <>
      <section className="container page-head">
        <h1>Pedir <span className="accent">orçamento</span></h1>
        <p>Leva uns 3 minutos. Com essas respostas a gente chega na primeira conversa já sabendo o básico do projeto.</p>
      </section>
      <div className="container contact">
        <ContactForm />
        <aside className="info" aria-labelledby="info-t" data-reveal="stagger">
          <h2 id="info-t">Outros canais</h2>
          {/* a linha inteira é o link: alvo de toque grande e um hover que mostra onde clicar */}
          <a className="info-row is-link is-featured" href={whatsUrl} target="_blank" rel="noopener"><span className="feature__icon"><Icon name="message-circle" /></span><span><strong>WhatsApp</strong><small>{empresa.telExibir} · resposta mais rápida</small></span><Icon name="chevron-right" className="info-row__go" /></a>
          <a className="info-row is-link" href={`mailto:${empresa.email}`}><span className="feature__icon"><Icon name="mail" /></span><span><strong>{empresa.email}</strong><small>Para enviar arquivos e briefings</small></span><Icon name="chevron-right" className="info-row__go" /></a>
          <a className="info-row is-link" href={`tel:${empresa.telLink}`}><span className="feature__icon"><Icon name="phone" /></span><span><strong>{empresa.telExibir}</strong><small>Ligações</small></span><Icon name="chevron-right" className="info-row__go" /></a>
          <div className="info-row"><span className="feature__icon is-ping"><Icon name="map-pin" /></span><div><address>{empresa.rua}<br />{empresa.bairro}, {empresa.cidade} - {empresa.uf}<br />CEP {empresa.cep}</address><small><a href={mapa} target="_blank" rel="noopener">Abrir no mapa</a></small></div></div>
          <div className="info-row"><span className="feature__icon"><Icon name="clock" /></span><div>{empresa.horario}<small>Atendimento presencial com hora marcada</small></div></div>
        </aside>
      </div>
    </>
  );
}

export function Obrigado() {
  return (
    <section className="container notice">
      <span className="notice__icon"><Icon name="check" /></span>
      <h1>Recebemos seu pedido de orçamento</h1>
      <p>Alguém da equipe vai responder pelo e-mail ou WhatsApp que você informou para marcar a primeira conversa.</p>
      <ul className="next-steps">
        <li><span className="feature__icon"><Icon name="mail" /></span><span>Confira a caixa de spam se não encontrar nossa resposta. O remetente é {empresa.email}.</span></li>
        <li><span className="feature__icon"><Icon name="file-text" /></span><span>Se tiver prints, planilhas ou referências, mande para o mesmo e-mail. Ajuda a estimar o prazo.</span></li>
      </ul>
      <div className="hero__actions">
        <a className="btn btn--lg" href="/">Voltar para o início</a>
        <a className="btn btn--lg btn--outline" href="/servicos.html">Ver serviços</a>
      </div>
    </section>
  );
}

export function NotFound() {
  return (
    <section className="container notice">
      <p className="notice__code" aria-hidden="true">404<span className="logo__cursor" /></p>
      <h1>Esta página não existe</h1>
      <p>O endereço pode ter mudado ou ter sido digitado com algum erro. Busque o que procura ou volte para o início.</p>
      <div className="hero__actions">
        <a className="btn btn--lg" href="/"><Icon name="house" />Ir para o início</a>
        <button type="button" className="btn btn--lg btn--outline" onClick={() => emit("busca:abrir")}><Icon name="search" />Buscar no site</button>
      </div>
    </section>
  );
}

export function Privacidade() {
  const e = empresa;
  return (
    <>
      <section className="container page-head"><h1>Política de privacidade</h1><p>Como a apantech coleta, usa e protege dados pessoais neste site, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p></section>
      <article className="container doc">
        <p>Atualizada em {e.atualizado}.</p>
        <h2>Quem é o controlador</h2>
        <p>{titular}, CNPJ {e.cnpj}, com sede em {enderecoLinha}. Contato do encarregado de dados (DPO): <a href={`mailto:${e.email}`}>{e.email}</a>.</p>
        <h2>Quais dados coletamos</h2>
        <h3>Formulário de orçamento</h3>
        <p>Nome, e-mail, empresa, WhatsApp, segmento, tipo de projeto e a mensagem que você escreve. Base legal: procedimentos preliminares a um contrato, a seu pedido (art. 7º, V).</p>
        <h3>Navegação</h3>
        <p>Se você aceitar os cookies de medição, o Google Analytics registra páginas visitadas, tempo na página, tipo de dispositivo, navegador e cidade aproximada. O endereço IP é anonimizado. Base legal: consentimento (art. 7º, I).</p>
        <h2>Para que usamos</h2>
        <ul><li>Responder seu pedido e preparar a proposta.</li><li>Entender quais páginas do site são úteis e quais precisam melhorar.</li><li>Cumprir obrigações legais e fiscais, se virarmos parceiros.</li></ul>
        <p>Não vendemos dados e não usamos os dados do formulário para publicidade.</p>
        <h2>Com quem compartilhamos</h2>
        <ul><li>Provedor de hospedagem do site e do e-mail.</li><li>Serviço que recebe o formulário (operador de dados).</li><li>Google, para o Analytics, apenas se você aceitar os cookies.</li></ul>
        <p>Esses fornecedores podem armazenar dados fora do Brasil, com as garantias previstas no art. 33 da LGPD.</p>
        <h2 id="cookies">Cookies</h2>
        <ul>
          <li><strong>Necessários:</strong> guardam no navegador sua escolha sobre cookies e o tema claro ou escuro. Não exigem consentimento.</li>
          <li><strong>Medição (Google Analytics: _ga, _ga_*):</strong> só são criados depois que você clica em “Aceitar”. Duram até 2 anos.</li>
        </ul>
        <p>Você pode mudar sua escolha a qualquer momento em <button type="button" className="btn btn--sm btn--outline" onClick={() => emit("cookies:abrir")}>Preferências de cookies</button> ou apagar os cookies nas configurações do navegador.</p>
        <h2>Por quanto tempo guardamos</h2>
        <p>Pedidos de orçamento que não viram projeto são apagados em até 12 meses. Dados de clientes ficam pelo prazo do contrato e pelos prazos exigidos pela lei fiscal.</p>
        <h2>Seus direitos</h2>
        <p>Você pode pedir confirmação, acesso, correção, anonimização, portabilidade, exclusão dos dados ou revogar o consentimento. Escreva para <a href={`mailto:${e.email}`}>{e.email}</a>; respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>
        <h2>Segurança</h2>
        <p>O site usa HTTPS, o acesso aos dados é restrito a quem cuida do atendimento e dados de clientes não são enviados para ferramentas de IA.</p>
      </article>
    </>
  );
}

export function Termos() {
  const e = empresa;
  return (
    <>
      <section className="container page-head"><h1>Termos de uso</h1><p>Regras para usar este site. Os serviços contratados seguem o contrato assinado com cada cliente.</p></section>
      <article className="container doc">
        <p>Atualizados em {e.atualizado}.</p>
        <h2>1. Sobre o site</h2>
        <p>Este site é mantido por {titular}, CNPJ {e.cnpj}, com sede em {enderecoLinha}. Ao navegar por ele, você concorda com estes termos.</p>
        <h2>2. Conteúdo</h2>
        <p>As descrições de serviços são informativas. Preço, prazo e escopo só valem depois de uma proposta por escrito aceita pelas duas partes. As imagens de telas são ilustrações e não representam projetos de clientes.</p>
        <h2>3. Propriedade intelectual</h2>
        <p>Marca, textos, ilustrações e o código deste site pertencem à apantech. Você pode compartilhar links e citar trechos com crédito, mas não pode copiar o site ou usar a marca sem autorização.</p>
        <h2>4. Uso permitido</h2>
        <ul><li>Não envie pelo formulário conteúdo ilegal, ofensivo ou dados de terceiros sem autorização.</li><li>Não tente acessar áreas restritas, sobrecarregar o servidor ou coletar dados do site de forma automatizada.</li></ul>
        <h2>5. Links externos</h2>
        <p>Links para WhatsApp, Google Maps e outros sites seguem os termos de cada serviço. Não respondemos pelo conteúdo deles.</p>
        <h2>6. Responsabilidade</h2>
        <p>Fazemos o possível para manter o site no ar e com informações corretas, mas ele pode ficar fora do ar para manutenção ou por falhas de terceiros.</p>
        <h2>7. Privacidade</h2>
        <p>O uso de dados pessoais segue a <a href="/privacidade.html">Política de privacidade</a>.</p>
        <h2>8. Alterações e foro</h2>
        <p>Podemos atualizar estes termos; a data no topo indica a versão em vigor. Vale a legislação brasileira, e fica eleito o foro da comarca de {e.cidade} - {e.uf}.</p>
        <p>Dúvidas: <a href={`mailto:${e.email}`}>{e.email}</a>.</p>
      </article>
    </>
  );
}
