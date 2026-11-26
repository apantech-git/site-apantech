import { memo } from "react";
import { iconData, type IconName } from "./icon-data";

type Props = { name: IconName; className?: string; size?: number; strokeWidth?: number; "data-on"?: string };

// memo: evita que o React regrave o SVG a cada render do componente pai
export const Icon = memo(function Icon({ name, className, size, strokeWidth = 2, ...rest }: Props) {
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: iconData[name] }}
      {...rest}
    />
  );
});
