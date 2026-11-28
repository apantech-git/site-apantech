import { useEffect, useRef } from "react";

const WORD = "apantech";

/**
 * Loading no estilo do animate-ui.com: a marca é digitada no centro da tela
 * e desliza (FLIP) até o logo do header enquanto o fundo some.
 * Aparece na primeira página da sessão e sempre que a página inicial é recarregada (F5);
 * a classe has-intro é posta por um script no <head> (ver build.mjs).
 */
export function Intro() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    if (!el || !root.classList.contains("has-intro")) return;
    const word = el.querySelector<HTMLElement>(".intro__word")!;
    const target = document.querySelector<HTMLElement>(".header .logo");
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const finish = () => {
      root.classList.remove("has-intro");
      try { sessionStorage.setItem("apantech-intro", "1"); } catch {}
      window.dispatchEvent(new Event("intro:end"));
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !target) {
      el.classList.add("is-typing");
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, delay: 300, easing: "ease-out", fill: "forwards" }).finished.then(finish);
      return;
    }

    const fonts = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 700))]);
    fonts.then(() => {
      if (cancelled) return;
      requestAnimationFrame(() => el.classList.add("is-typing"));
      const typing = WORD.length * 55 + 560;
      timer = setTimeout(() => {
        const from = word.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        const s = to.width / from.width;
        const dx = to.left - from.left;
        const dy = to.top + to.height / 2 - (from.top + (from.height * s) / 2);
        el.classList.add("is-leaving");
        word
          .animate(
            [{ transform: "translate(0, 0) scale(1)" }, { transform: `translate(${dx}px, ${dy}px) scale(${s})` }],
            { duration: 700, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "forwards" }
          )
          .finished.then(finish);
      }, typing + 250);
    });
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  return (
    <div className="intro" ref={ref} aria-hidden="true">
      <span className="intro__word wm">
        {WORD.split("").map((c, i) => (
          <span key={i} className={i >= 4 ? "intro__letter wm__tech" : "intro__letter"} style={{ ["--i" as string]: i }}>{c}</span>
        ))}
        <span className="intro__cursor" />
      </span>
    </div>
  );
}
