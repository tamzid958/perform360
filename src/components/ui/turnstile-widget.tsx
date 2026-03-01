"use client";

import { useRef, useEffect } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  resetKey?: number;
  className?: string;
}

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  resetKey,
  className,
}: TurnstileWidgetProps) {
  const ref = useRef<TurnstileInstance | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      ref.current?.reset();
    }
  }, [resetKey]);

  if (!siteKey) return null;

  return (
    <div className={className}>
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        onSuccess={onVerify}
        onError={() => onError?.()}
        onExpire={() => onExpire?.()}
        options={{ theme: "light", size: "flexible" }}
      />
    </div>
  );
}
