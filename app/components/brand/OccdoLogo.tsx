import Image from "next/image";

type OccdoLogoProps = {
  size?: number;
  className?: string;
  alt?: string;
};

export default function OccdoLogo({
  size = 44,
  className = "",
  alt = "OCCDO logo",
}: OccdoLogoProps) {
  return (
    <Image
      src="/occdo-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      priority
    />
  );
}
