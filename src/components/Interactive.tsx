// Abas com destaque deslizante e accordion, no comportamento dos primitives do Animate UI.
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./icon-data";
import { Picture } from "./Picture";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type Projeto = {
  id: string; label: string; icon: IconName; img: "site" | "sistema" | "dashboard" | "apps";
  title: string; text: string; items: string[]; alt: string;
};

export function ProjectTabs({ items }: { items: Projeto[] }) {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([0]));
  const list = useRef<HTMLDivElement>(null);
  const hl = useRef<HTMLSpanElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const first = useRef(true);

  // o destaque desliza até a aba ativa (spring.selection); na primeira vez entra no lugar, sem animar
  useIsoLayoutEffect(() => {
    const move = () => {
      const b = tabs.current[active];
      if (!b || !hl.current) return;
      if (first.current) hl.current.style.transition = "none";
      hl.current.style.width = `${b.offsetWidth}px`;
      hl.current.style.translate = `${b.offsetLeft}px 0`;
      if (first.current) { void hl.current.offsetWidth; hl.current.style.transition = ""; first.current = false; }
    };
    move();
    window.addEventListener("resize", move);
    document.fonts?.ready.then(move);
    return () => window.removeEventListener("resize", move);
  }, [active]);

  const preload = (i: number) => setLoaded((s) => (s.has(i) ? s : new Set(s).add(i)));
  const select = (i: number, focus = false) => {
    preload(i);
    // espera um frame para a imagem nova existir antes de trocar (o fade precisa de um "antes")
    requestAnimationFrame(() => requestAnimationFrame(() => setActive(i)));
    if (focus) tabs.current[i]?.focus();
    tabs.current[i]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };
  const onKey = (e: KeyboardEvent, i: number) => {
    const n = items.length;
    const map: Record<string, number> = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 };
    if (e.key in map) { e.preventDefault(); select(map[e.key], true); }
  };
  const p = items[active];

  return (
    <div className="preview" data-reveal>
      <div className="preview__bar">
        <div className="tabs" role="tablist" aria-label="Tipos de projeto" ref={list}>
          <span className="tabs__highlight" ref={hl} aria-hidden="true" />
          {items.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { tabs.current[i] = el; }}
              type="button"
              role="tab"
              id={`aba-${t.id}`}
              aria-controls="painel-projeto"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              className="tab"
              onClick={() => select(i)}
              onKeyDown={(e) => onKey(e, i)}
              onPointerEnter={() => preload(i)}
            >
              <Icon name={t.icon} />{t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="preview__grid">
        <div className="preview__text" role="tabpanel" id="painel-projeto" aria-labelledby={`aba-${p.id}`} tabIndex={0}>
          <div className="panel" key={p.id}>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
            <ul className="checklist">{p.items.map((x) => <li key={x}><Icon name="check" />{x}</li>)}</ul>
          </div>
        </div>
        <div className="preview__media dots">
          {items.map((t, i) => (
            <Picture
              key={t.id}
              name={t.img}
              alt={t.alt}
              sizes="(max-width: 900px) 94vw, 680px"
              priority={i === 0}
              className={[loaded.has(i) && "is-loaded", i === active && "is-active"].filter(Boolean).join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="accordion" data-reveal="stagger">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.q} className={`acc-item${isOpen ? " is-open" : ""}`}>
            <h3 style={{ letterSpacing: "inherit" }}>
              <button type="button" className="acc-trigger" aria-expanded={isOpen} aria-controls={`resp-${i}`} id={`perg-${i}`} onClick={() => setOpen(isOpen ? null : i)}>
                {it.q}<Icon name="chevron-down" />
              </button>
            </h3>
            <div className="acc-content" id={`resp-${i}`} role="region" aria-labelledby={`perg-${i}`} inert={!isOpen}>
              <div><p>{it.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
