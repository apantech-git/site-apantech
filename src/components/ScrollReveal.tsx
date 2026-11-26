import { useEffect } from "react";

/**
 * Revela ao rolar o que tem [data-reveal]; com data-reveal="stagger", os filhos entram em sequência.
 * Só esconde o que ainda está abaixo da dobra no momento da hidratação: o que já está na tela
 * nunca pisca, e sem JS (ou se ele falhar) tudo continua visível, porque o HTML não sai escondido.
 * Entra uma vez só; voltar a rolar para cima não repete.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.remove("is-pending");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    const fold = window.innerHeight * 0.88;
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      if (el.getBoundingClientRect().top < fold) return;
      if (el.dataset.reveal === "stagger") {
        Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty("--ri", String(Math.min(i, 7))));
      }
      el.classList.add("is-pending");
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  return null;
}
