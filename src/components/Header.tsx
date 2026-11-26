import { useCallback, useEffect, useRef, useState } from "react";
import { NAV, type RouteId } from "../routes";
import { Icon } from "./Icon";
import { emit } from "../lib/utils";

export function Logo() {
  return (
    <a className="logo" href="/" aria-label="apantech, página inicial">
      apantech<span className="logo__cursor" aria-hidden="true" />
    </a>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("apantech-tema", next ? "escuro" : "claro"); } catch {}
  };
  return (
    <button type="button" className="btn btn--ghost btn--icon" onClick={toggle} aria-label={dark ? "Usar tema claro" : "Usar tema escuro"}>
      <span className="swap">
        <Icon name="sun" data-on={String(!dark)} />
        <Icon name="moon" data-on={String(dark)} />
      </span>
    </button>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  // monta, anima a entrada no frame seguinte; na saída espera a transição antes de desmontar
  useEffect(() => {
    if (open) {
      setMounted(true);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(r);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>("a,button")];
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); prev?.focus(); };
  }, [open, onClose]);

  if (!mounted) return null;
  return (
    <>
      <div className={`overlay${visible ? " is-open" : ""}`} onClick={onClose} />
      <div ref={panel} className={`sheet${visible ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="sheet__head">
          <Logo />
          <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Fechar menu"><Icon name="x" /></button>
        </div>
        <nav aria-label="Menu">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={onClose}>{n.label}<Icon name="chevron-right" /></a>
          ))}
        </nav>
        <a className="btn btn--lg" href="/contato.html">Pedir orçamento</a>
      </div>
    </>
  );
}

export function Header({ current }: { current: RouteId }) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [mac, setMac] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    on();
    window.addEventListener("scroll", on, { passive: true });
    setMac(/Mac|iPhone|iPad/.test(navigator.platform));
    return () => window.removeEventListener("scroll", on);
  }, []);

  // o menu fica fora do <header>: o backdrop-filter dele prenderia o position: fixed
  return (
    <>
    <header className={`header${scrolled ? " is-scrolled" : ""}`}>
      <div className="container header__in">
        <Logo />
        <nav className="nav" aria-label="Principal">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} aria-current={n.id && n.id === current ? "page" : undefined}>{n.label}</a>
          ))}
        </nav>
        <div className="header__actions">
          <button type="button" className="search-trigger" onClick={() => emit("busca:abrir")} aria-label="Buscar no site">
            <Icon name="search" />
            <span>Buscar no site…</span>
            <kbd>{mac ? "⌘K" : "Ctrl K"}</kbd>
          </button>
          <ThemeToggle />
          <a className="btn" href="/contato.html">
            <span className="cta-long">Pedir orçamento</span>
            <span className="cta-short">Orçamento</span>
          </a>
          <button type="button" className="btn btn--ghost btn--icon menu-trigger" onClick={() => setMenu(true)} aria-label="Abrir menu" aria-expanded={menu}>
            <Icon name="menu" />
          </button>
        </div>
      </div>
    </header>
    <MobileMenu open={menu} onClose={closeMenu} />
    </>
  );
}
