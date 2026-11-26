import { asset } from "../lib/utils";

type Props = {
  name: "site" | "sistema" | "dashboard" | "apps";
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

// AVIF com WebP de reserva, duas larguras; fora da tela carrega sob demanda.
export function Picture({ name, alt, sizes, priority, className }: Props) {
  const set = (ext: string) =>
    `${asset(`/img/${name}-600.${ext}`)} 600w, ${asset(`/img/${name}-1200.${ext}`)} 1200w`;
  return (
    <picture className={className} data-name={name}>
      <source type="image/avif" srcSet={set("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img
        src={asset(`/img/${name}-1200.webp`)}
        alt={alt}
        width={1200}
        height={900}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
      />
    </picture>
  );
}
