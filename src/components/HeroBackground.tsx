import { useEffect, useRef } from "react";

/**
 * Fundo do hero: grade de pontos com "sinais de dados" correndo por trilhas, como numa placa de circuito.
 * - Mouse por perto: os pontos acendem, crescem e são puxados de leve para o cursor, e o cursor solta sinais.
 * - Clique: uma onda sai do ponto clicado.
 * - Cor tirada do tema (classe .dark no <html>), atualiza na hora em que o tema muda.
 * - Movimento reduzido: sem sinais, onda ou deslocamento; o brilho sob o cursor continua.
 * - Fora da tela ou com a aba escondida, o desenho para.
 */
const GAP = 24;          // distância entre pontos
const RADIUS = 160;      // alcance do cursor
const SPEED = 150;       // px/s de um sinal
const TAIL = 72;         // rastro do sinal

type Pt = { x: number; y: number };
type Signal = { path: Pt[]; total: number; s: number };
type Ripple = { x: number; y: number; t0: number };

export function HeroBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const root = document.documentElement;
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = mqReduce.matches;

    let w = 0, h = 0, cols = 0, rows = 0, ox = 0, oy = 0;
    let ink = "255,255,255", base = 0.16;
    const setTheme = () => {
      const dark = root.classList.contains("dark");
      ink = dark ? "255,255,255" : "23,23,23";
      base = dark ? 0.24 : 0.28;
    };
    setTheme();

    const p = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, on: 0, target: 0 };
    const signals: Signal[] = [];
    const ripples: Ripple[] = [];
    let raf = 0, visible = true, last = performance.now(), nextAmbient = 0, nextFromCursor = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.floor(w / GAP) + 1; rows = Math.floor(h / GAP) + 1;
      ox = (w - (cols - 1) * GAP) / 2; oy = (h - (rows - 1) * GAP) / 2;
      kick();
    };

    // trilha em "L" pela grade: anda N casas numa direção e, às vezes, vira 90°
    const spawn = (ci?: number, cj?: number) => {
      if (signals.length >= 10 || !cols || !rows) return;
      let i = ci ?? Math.floor(Math.random() * cols);
      let j = cj ?? Math.floor(Math.random() * rows);
      const path: Pt[] = [{ x: ox + i * GAP, y: oy + j * GAP }];
      let horiz = Math.random() < 0.5;
      const legs = Math.random() < 0.6 ? 2 : 1;
      for (let k = 0; k < legs; k++) {
        const n = (3 + Math.floor(Math.random() * 6)) * (Math.random() < 0.5 ? -1 : 1);
        if (horiz) i = Math.max(0, Math.min(cols - 1, i + n)); else j = Math.max(0, Math.min(rows - 1, j + n));
        const pt = { x: ox + i * GAP, y: oy + j * GAP };
        const prev = path[path.length - 1];
        if (pt.x !== prev.x || pt.y !== prev.y) path.push(pt);
        horiz = !horiz;
      }
      if (path.length < 2) return;
      let total = 0;
      for (let k = 1; k < path.length; k++) total += Math.abs(path[k].x - path[k - 1].x) + Math.abs(path[k].y - path[k - 1].y);
      signals.push({ path, total, s: 0 });
    };

    const at = (sg: Signal, s: number): Pt => {
      let d = Math.max(0, Math.min(sg.total, s));
      for (let k = 1; k < sg.path.length; k++) {
        const a = sg.path[k - 1], b = sg.path[k];
        const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
        if (d <= len) { const t = len ? d / len : 0; return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }; }
        d -= len;
      }
      return sg.path[sg.path.length - 1];
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // cursor suavizado (segue sem tremer) e intensidade que acende/apaga
      const k = 1 - Math.pow(0.0001, dt);
      p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k;
      p.on += (p.target - p.on) * (1 - Math.pow(0.002, dt));

      if (!reduce) {
        if (now > nextAmbient) { spawn(); nextAmbient = now + 700 + Math.random() * 900; }
        if (p.target && now > nextFromCursor) {
          spawn(Math.round((p.x - ox) / GAP), Math.round((p.y - oy) / GAP));
          nextFromCursor = now + 260;
        }
      }

      ctx.clearRect(0, 0, w, h);

      // brilho macio sob o cursor
      if (p.on > 0.01) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, RADIUS * 1.5);
        g.addColorStop(0, `rgba(${ink},${0.07 * p.on})`);
        g.addColorStop(1, `rgba(${ink},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(p.x - RADIUS * 1.5, p.y - RADIUS * 1.5, RADIUS * 3, RADIUS * 3);
      }

      // pontos: os "quietos" vão num único path; os acesos são desenhados um a um
      for (let r = ripples.length - 1; r >= 0; r--) if (now - ripples[r].t0 > 1100) ripples.splice(r, 1);
      ctx.fillStyle = `rgba(${ink},${base})`;
      ctx.beginPath();
      const lit: [number, number, number][] = [];
      const R2 = RADIUS * RADIUS;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          let x = ox + i * GAP, y = oy + j * GAP, e = 0;
          const dx = x - p.x, dy = y - p.y, d2 = dx * dx + dy * dy;
          if (p.on > 0.01 && d2 < R2) {
            const t = 1 - Math.sqrt(d2) / RADIUS;
            e = t * t * (3 - 2 * t) * p.on;
            if (!reduce) { x -= dx * e * 0.14; y -= dy * e * 0.14; }
          }
          for (const rp of ripples) {
            const prog = (now - rp.t0) / 1100;
            const dist = Math.hypot(x - rp.x, y - rp.y);
            const band = Math.abs(dist - prog * 520);
            if (band < 36) e = Math.max(e, (1 - band / 36) * (1 - prog) * 0.9);
          }
          if (e > 0.02) lit.push([x, y, e]);
          else ctx.rect(x - 0.75, y - 0.75, 1.5, 1.5);
        }
      }
      ctx.fill();
      for (const [x, y, e] of lit) {
        const s = 1.5 + e * 1.6;
        ctx.fillStyle = `rgba(${ink},${base + e * 0.6})`;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }

      // sinais: rastro que some para trás e uma cabeça brilhante
      ctx.lineCap = "round";
      for (let n = signals.length - 1; n >= 0; n--) {
        const sg = signals[n];
        sg.s += SPEED * dt;
        if (sg.s - TAIL > sg.total) { signals.splice(n, 1); continue; }
        const STEPS = 10;
        ctx.lineWidth = 1.25;
        let prev = at(sg, sg.s - TAIL);
        for (let q = 1; q <= STEPS; q++) {
          const cur = at(sg, sg.s - TAIL + (TAIL * q) / STEPS);
          ctx.strokeStyle = `rgba(${ink},${(q / STEPS) * 0.55})`;
          ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(cur.x, cur.y); ctx.stroke();
          prev = cur;
        }
        if (sg.s <= sg.total) {
          const hd = at(sg, sg.s);
          ctx.fillStyle = `rgba(${ink},0.85)`;
          ctx.beginPath(); ctx.arc(hd.x, hd.y, 1.8, 0, Math.PI * 2); ctx.fill();
        } else {
          // chegou: o nó final pisca e apaga
          const end = sg.path[sg.path.length - 1];
          const f = 1 - (sg.s - sg.total) / TAIL;
          ctx.strokeStyle = `rgba(${ink},${0.5 * f})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(end.x, end.y, 3 + (1 - f) * 5, 0, Math.PI * 2); ctx.stroke();
        }
      }
    };

    // com movimento reduzido só redesenha enquanto o brilho do cursor ainda está mudando
    const settled = () => reduce && Math.abs(p.target - p.on) < 0.005 && Math.abs(p.tx - p.x) < 0.5 && Math.abs(p.ty - p.y) < 0.5;
    const loop = (now: number) => {
      draw(now);
      raf = visible && !document.hidden && !settled() ? requestAnimationFrame(loop) : 0;
    };
    function kick() {
      if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return; // sem hover no toque: lá o fundo vive só dos sinais
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      if (inside && p.target === 0 && p.on < 0.02) { p.x = x; p.y = y; } // entra no lugar, sem deslizar da borda
      p.tx = x; p.ty = y; p.target = inside ? 1 : 0;
      kick();
    };
    const onLeave = () => { p.target = 0; kick(); };
    const onDown = (e: PointerEvent) => {
      if (reduce) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) return;
      ripples.push({ x, y, t0: performance.now() });
      if (ripples.length > 3) ripples.shift();
      kick();
    };
    const onReduce = () => { reduce = mqReduce.matches; signals.length = 0; ripples.length = 0; kick(); };
    const onVis = () => kick();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); });
    io.observe(canvas);
    const mo = new MutationObserver(() => { setTheme(); kick(); });
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    mqReduce.addEventListener("change", onReduce);
    resize();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect(); mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      mqReduce.removeEventListener("change", onReduce);
    };
  }, []);

  return (
    <div className="hero-bg" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
