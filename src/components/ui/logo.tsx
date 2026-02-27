import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Performs360"
      width={567}
      height={233}
      className={cn("h-10 w-auto", className)}
      priority
    />
  );
}
