// Rodapé, aviso de cookies (com Google Analytics em Consent Mode) e CTA fixo do celular.
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Logo } from "./Header";
import { NAV } from "../routes";
import { empresa, GA_ID, titular, whatsUrl } from "../config";
import { emit, useEvent } from "../lib/utils";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__about">
            <Logo />
            <p>Sites, sistemas, dashboards e apps para Android e iOS, feitos sob demanda.</p>
            <address>{empresa.rua}<br />{empresa.bairro}, {empresa.cidade} - {empresa.uf}<br />CEP {empresa.cep}</address>
          </div>
          <div>
            <h2>Navegação</h2>
            <ul>{NAV.map((n) => <li key={n.href}><a href={n.href}>{n.label}</a></li>)}</ul>
          </div>
          <div>
            <h2>Fale com a gente</h2>
            <ul>
              <li><a href={`mailto:${empresa.email}`}>{empresa.email}</a></li>
              <li><a href={whatsUrl} target="_blank" rel="noopener">WhatsApp {empresa.telExibir}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__base">
          {/* razão social só aparece depois de preenchida em config.ts (sem colchetes) */}
          <span>© {new Date().getFullYear()} {titular} · CNPJ {empresa.cnpj}</span>
          <nav aria-label="Legal">
            <a href="/privacidade.html">Política de privacidade</a>
            <a href="/termos.html">Termos de uso</a>
            <button type="button" className="linkbtn" onClick={() => emit("cookies:abrir")}>Preferências de cookies</button>
          </nav>
        </div>
      </div>
    </footer>
  );
}

/* ---------- analytics ---------- */
type Gtag = (...a: unknown[]) => void;
declare global { interface Window { dataLayer: unknown[]; gtag: Gtag; __gaLoaded?: boolean } }
const KEY = "apantech-consentimento";

function initConsent() {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("consent", "default", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", wait_for_update: 500 });
}
function loadAnalytics() {
  if (!GA_ID || /X{4,}/.test(GA_ID) || window.__gaLoaded) return;
  window.__gaLoaded = true;
  window.gtag("consent", "update", { analytics_storage: "granted" });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { anonymize_ip: true });
}

export function CookieBanner() {
  const [state, setState] = useState<"hidden" | "shown" | "leaving">("hidden");

  useEffect(() => {
    initConsent();
    let choice: string | null = null;
    try { choice = localStorage.getItem(KEY); } catch {}
    if (choice === "aceito") loadAnalytics();
    if (choice) return;
    // espera a intro terminar para não disputar atenção com ela
    if (document.documentElement.classList.contains("has-intro")) {
      const on = () => setTimeout(() => setState("shown"), 400);
      window.addEventListener("intro:end", on, { once: true });
      return () => window.removeEventListener("intro:end", on);
    }
    setState("shown");
  }, []);

  useEffect(() => { emit("cookies:visivel", state === "shown"); }, [state]);
  useEvent("cookies:abrir", () => setState("shown"));

  const decide = (v: "aceito" | "recusado") => {
    try { localStorage.setItem(KEY, v); } catch {}
    if (v === "aceito") loadAnalytics();
    else if (window.__gaLoaded) window.gtag("consent", "update", { analytics_storage: "denied" });
    setState("leaving");
    setTimeout(() => setState("hidden"), 200);
  };

  if (state === "hidden") return null;
  return (
    <div className={`cookie${state === "leaving" ? " is-leaving" : ""}`} role="region" aria-label="Aviso de cookies">
      <strong>Cookies de medição</strong>
      <p>Usamos o Google Analytics para contar visitas e saber quais páginas são lidas. Ele só é ativado se você aceitar. Detalhes na <a href="/privacidade.html#cookies">Política de privacidade</a>.</p>
      <div className="cookie__actions">
        <button type="button" className="btn btn--outline btn--sm" onClick={() => decide("recusado")}>Recusar</button>
        <button type="button" className="btn btn--sm" onClick={() => decide("aceito")}>Aceitar</button>
      </div>
    </div>
  );
}

/** Barra fixa no celular. Some quando um CTA da página (data-hide-cta) ou o aviso de cookies está na tela. */
export function MobileCta() {
  const [visible, setVisible] = useState(false);
  const seen = useRef(new Set<Element>());
  const cookie = useRef(false);
  const apply = useRef(() => {});

  useEffect(() => {
    document.body.classList.add("has-mobile-cta");
    apply.current = () => setVisible(seen.current.size === 0 && !cookie.current && window.scrollY > 120);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.current.add(e.target) : seen.current.delete(e.target)));
      apply.current();
    });
    document.querySelectorAll("[data-hide-cta]").forEach((el) => io.observe(el));
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => { clearTimeout(t); t = setTimeout(() => apply.current(), 60); };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply.current();
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); document.body.classList.remove("has-mobile-cta"); };
  }, []);
  useEvent("cookies:visivel", (e) => { cookie.current = !!e.detail; apply.current(); });

  return (
    <div className={`mobile-cta${visible ? " is-visible" : ""}`} inert={!visible}>
      <a className="btn" href="/contato.html">Pedir orçamento</a>
      <a className="btn btn--outline" href={whatsUrl} target="_blank" rel="noopener" aria-label="Conversar no WhatsApp"><Icon name="message-circle" /></a>
    </div>
  );
}
