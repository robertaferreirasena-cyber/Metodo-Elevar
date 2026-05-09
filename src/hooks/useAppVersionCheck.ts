import { useEffect, useRef } from "react";
import { toast } from "sonner";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const CURRENT_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";

/**
 * Polls /version.json and shows a toast prompting reload when a new build is detected.
 * Resolves the classic "Vercel deploy went out but the user's tab is still on the old bundle".
 */
export function useAppVersionCheck() {
  const notifiedRef = useRef(false);

  useEffect(() => {
    // Skip in dev — pointless and noisy with HMR.
    if (import.meta.env.DEV) return;

    let cancelled = false;

    const check = async () => {
      if (notifiedRef.current || cancelled) return;
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        if (!data?.version) return;
        if (data.version !== CURRENT_VERSION) {
          notifiedRef.current = true;
          toast("Nova versão disponível", {
            description: "Atualize para usar a versão mais recente da plataforma.",
            duration: Infinity,
            action: {
              label: "Atualizar agora",
              onClick: () => window.location.reload(),
            },
          });
        }
      } catch {
        /* offline / network blip — ignore */
      }
    };

    const onFocus = () => check();

    check();
    const id = window.setInterval(check, CHECK_INTERVAL_MS);
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
}
