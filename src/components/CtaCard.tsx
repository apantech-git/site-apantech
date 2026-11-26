import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./icon-data";

/**
 * Card de chamada final, com mais vida:
 * - feixe de luz azul percorrendo a borda (CSS, @property);
 * - brilho que segue o mouse e acende os pontinhos do fundo (só ponteiro fino);
 * - etiquetas dos serviços flutuando nas laterais, com leve paralaxe do mouse (telas largas).
 * Movimento reduzido: sem feixe girando, flutuação ou paralaxe.
 */
export type Chip = { icon: IconName; label: string; x: number; y: number; z: number };
const CHIPS: Chip[] = [
  { icon: "globe", label: "Site", x: 11, y: 22, z: 1 },
  { icon: "chart-column", label: "Dashboard", x: 9, y: 54, z: 0.6 },
  { icon: "message-circle", label: "Integração WhatsApp", x: 13, y: 84, z: 0.8 },
  { icon: "database", label: "Sistema web", x: 88, y: 20, z: 0.7 },
  { icon: "smartphone", label: "App Android e iOS", x: 89, y: 52, z: 1 },
  { icon: "shield-check", label: "Login seguro", x: 87, y: 84, z: 0.6 },
];

export function CtaCard({ chips = true, className, children }: { chips?: boolean | Chip[]; className?: string; children: ReactNode }) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = card.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty("--sx", `${x}px`);
        el.style.setProperty("--sy", `${y}px`);
        if (!reduce) {
          el.style.setProperty("--mx", ((x / r.width) * 2 - 1).toFixed(3));
          el.style.setProperty("--my", ((y / r.height) * 2 - 1).toFixed(3));
        }
      });
    };
    const onEnter = () => el.classList.add("is-lit");
    const onLeave = () => { el.classList.remove("is-lit"); el.style.setProperty("--mx", "0"); el.style.setProperty("--my", "0"); };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerenter", onEnter); el.removeEventListener("pointerleave", onLeave); };
  }, []);

  return (
    <div className={`cta-card dots${className ? ` ${className}` : ""}`} ref={card} data-hide-cta data-reveal>
      <span className="cta-beam" aria-hidden="true" />
      <span className="cta-spot" aria-hidden="true" />
      {chips && (
        <div className="cta-chips" aria-hidden="true">
          {(Array.isArray(chips) ? chips : CHIPS).map((c, i) => (
            <span key={c.label} className="cta-chip" style={{ left: `${c.x}%`, top: `${c.y}%`, ["--z" as string]: c.z, ["--i" as string]: i } as CSSProperties}>
              <span className="cta-chip__in"><Icon name={c.icon} />{c.label}</span>
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

/* ---------- campo "descreva sua ideia" ---------- */
const IDEIAS = [
  "Quero um app para os clientes agendarem horário…",
  "Preciso de um painel com as vendas das 3 lojas…",
  "Meus pedidos vivem no WhatsApp e numa planilha…",
  "Quero um site que apareça no Google…",
];

/** Envia para /contato.html?ideia=… e o formulário já chega preenchido. Funciona sem JS (GET normal). */
export function IdeaPrompt() {
  const [hint, setHint] = useState(IDEIAS[0]);
  const [valor, setValor] = useState("");
  const [foco, setFoco] = useState(false);
  const box = useRef<HTMLFormElement>(null);

  // exemplos digitados no placeholder enquanto o campo está vazio, sem foco e na tela
  useEffect(() => {
    const el = box.current;
    if (!el || valor || foco || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let k = 0, c = IDEIAS[0].length, apagando = true, timer: ReturnType<typeof setTimeout> | undefined, visivel = false;
    const tick = () => {
      const alvo = IDEIAS[k];
      if (apagando) {
        c = Math.max(0, c - 2);
        if (c === 0) { apagando = false; k = (k + 1) % IDEIAS.length; }
      } else {
        c = Math.min(IDEIAS[k].length, c + 1);
      }
      setHint((apagando ? alvo : IDEIAS[k]).slice(0, c) || " ");
      const fim = !apagando && c === IDEIAS[k].length;
      if (fim) apagando = true;
      if (visivel && !document.hidden) timer = setTimeout(tick, fim ? 2400 : apagando ? 18 : 38 + Math.random() * 40);
    };
    const io = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      clearTimeout(timer);
      if (visivel) timer = setTimeout(tick, 1800);
    });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); setHint(IDEIAS[0]); };
  }, [valor, foco]);

  const enviar = (e: FormEvent) => {
    if (valor.trim()) return; // segue o GET normal com ?ideia=
    e.preventDefault();
    location.href = "/contato.html";
  };

  return (
    <form className={`idea${foco ? " is-focus" : ""}`} ref={box} action="/contato.html" method="get" onSubmit={enviar} aria-label="Comece pelo seu projeto">
      <span className="idea__icon"><Icon name="sparkles" /></span>
      <label htmlFor="ideia" className="sr-only">Descreva em uma frase o que você quer construir</label>
      <input
        id="ideia" name="ideia" className="idea__input" autoComplete="off" maxLength={300}
        placeholder={hint} value={valor}
        onChange={(e) => setValor(e.target.value)} onFocus={() => setFoco(true)} onBlur={() => setFoco(false)}
      />
      <button type="submit" className="btn idea__btn">Pedir orçamento<Icon name="send" /></button>
    </form>
  );
}
