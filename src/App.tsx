import type { RouteId } from "./routes";
import { ROTAS } from "./routes";
import { Intro } from "./components/Intro";
import { Header } from "./components/Header";
import { SearchDialog } from "./components/SearchDialog";
import { ScrollReveal } from "./components/ScrollReveal";
import { CookieBanner, Footer, MobileCta } from "./components/Chrome";
import { Home } from "./pages/Home";
import { QuemSomos } from "./pages/QuemSomos";
import { Contato, NotFound, Obrigado, Privacidade, Termos } from "./pages/Others";
import { Servicos } from "./pages/Servicos";

const PAGES: Record<RouteId, () => React.JSX.Element> = {
  home: Home, servicos: Servicos, "quem-somos": QuemSomos, contato: Contato, obrigado: Obrigado, privacidade: Privacidade, termos: Termos, "404": NotFound,
};

export function App({ route }: { route: RouteId }) {
  const Page = PAGES[route];
  const rota = ROTAS.find((r) => r.id === route)!;
  return (
    <>
      <Intro />
      <a className="skip" href="#conteudo">Pular para o conteúdo</a>
      <Header current={route} />
      <main id="conteudo" tabIndex={-1}>
        <Page />
      </main>
      <Footer />
      {rota.ctaFixo && <MobileCta />}
      <SearchDialog />
      <CookieBanner />
      <ScrollReveal />
    </>
  );
}
