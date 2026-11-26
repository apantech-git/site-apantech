// ======== DADOS DA EMPRESA: troque os valores entre colchetes antes de publicar ========
export const empresa = {
  site: "https://www.apantech.com.br", // domínio definitivo, sem barra no final
  nome: "apantech Soluções em Tecnologia",
  razao: "[Razão social] LTDA",
  cnpj: "62.171.577/0001-13",
  email: "contato@apantech.com.br", // único e-mail do site (rodapé, contato, páginas legais e schema.org)
  telExibir: "(11) 9 8171-4641",
  telLink: "+5511981714641",
  whatsapp: "5511981714641", // só números: 55 + DDD + número
  rua: "Rua Marquês de Pombal, 22",
  bairro: "Vila Nogueira",
  cidade: "Campinas",
  uf: "SP",
  cep: "13088-030",
  horario: "Segunda a sexta, das 9h às 18h",
  atualizado: "23 de novembro de 2026",
};

// ID do Google Analytics 4. Só carrega depois do aceite de cookies.
export const GA_ID = "G-XXXXXXXXXX";

// Endpoint que recebe o formulário (Formspree, Getform, API própria).
// Vazio = modo demonstração: valida e vai direto para a página de obrigado.
export const FORM_ENDPOINT = "";
// =====================================================================================

export const whatsUrl =
  `https://wa.me/${empresa.whatsapp}?text=` +
  encodeURIComponent("Olá, vim pelo site da apantech e quero falar sobre um projeto.");
// Nome do titular: razão social quando preenchida, senão o nome fantasia.
export const titular = empresa.razao.startsWith("[") ? empresa.nome : empresa.razao;
export const enderecoLinha = `${empresa.rua}, ${empresa.bairro}, ${empresa.cidade} - ${empresa.uf}, CEP ${empresa.cep}`;
