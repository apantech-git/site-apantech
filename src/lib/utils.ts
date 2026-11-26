import { useCallback, useEffect, useRef, useState } from "react";

// Caminhos com hash gerados pelo build (cache de 1 ano). Fora do build, devolve o caminho original.
declare const __ASSETS__: Record<string, string>;
export const asset = (p: string): string =>
  (typeof __ASSETS__ !== "undefined" && __ASSETS__[p]) || p;

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Valor que só muda depois que a pessoa para de digitar por `ms`.
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useDebouncedCallback<A extends unknown[]>(fn: (...a: A) => void, ms: number) {
  const ref = useRef(fn);
  ref.current = fn;
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(t.current), []);
  return useCallback((...a: A) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => ref.current(...a), ms);
  }, [ms]);
}

// Lido só depois da hidratação, para o HTML do servidor e o do navegador baterem.
export function usePrefersReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return r;
}

// Eventos globais simples entre componentes (abrir busca, reabrir cookies).
export const emit = (name: string, detail?: unknown) => window.dispatchEvent(new CustomEvent(name, { detail }));
export function useEvent(name: string, fn: (e: CustomEvent) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const h = (e: Event) => ref.current(e as CustomEvent);
    window.addEventListener(name, h);
    return () => window.removeEventListener(name, h);
  }, [name]);
}
