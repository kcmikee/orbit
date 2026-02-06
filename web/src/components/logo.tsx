import clsx from "clsx";
import Image, { StaticImageData } from "next/image";

// import logo from "@/components/logo.png";
import logo from "@/components/logoText.png";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  url?: StaticImageData | null;
}

export function Logo({
  width = 120,
  height = 32,
  className = "",
  url = null,
}: LogoProps) {
  return (
    <div className={clsx(["select-none", className])}>
      <Image
        src={url || logo}
        alt="Eliza Logo"
        width={width}
        height={height}
        priority
      />
    </div>
  );
}
