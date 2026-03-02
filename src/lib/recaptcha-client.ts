declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function waitForGrecaptcha(timeout = 10000): Promise<typeof window.grecaptcha | null> {
  return new Promise((resolve) => {
    if (window.grecaptcha) {
      resolve(window.grecaptcha);
      return;
    }
    const interval = setInterval(() => {
      if (window.grecaptcha) {
        clearInterval(interval);
        resolve(window.grecaptcha);
      }
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      resolve(null);
    }, timeout);
  });
}

export async function executeRecaptcha(action: string): Promise<string | null> {
  if (!SITE_KEY || typeof window === "undefined") {
    return null;
  }

  const grecaptcha = await waitForGrecaptcha();
  if (!grecaptcha) return null;

  return new Promise((resolve) => {
    grecaptcha.ready(async () => {
      try {
        const token = await grecaptcha.execute(SITE_KEY, { action });
        resolve(token);
      } catch {
        resolve(null);
      }
    });
  });
}
