import { useRef, useCallback } from 'react';
import { toast } from 'sonner';

const THROTTLE_DELAY_MS = 3000; // 3 seconds between messages

export function useThrottle() {
  const lastCallRef = useRef<number>(0);
  const isThrottledRef = useRef<boolean>(false);

  const throttle = useCallback(<T extends (...args: unknown[]) => unknown>(fn: T) => {
    return (...args: Parameters<T>): ReturnType<T> | null => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall < THROTTLE_DELAY_MS && lastCallRef.current !== 0) {
        const remainingTime = Math.ceil((THROTTLE_DELAY_MS - timeSinceLastCall) / 1000);
        
        if (!isThrottledRef.current) {
          isThrottledRef.current = true;
          toast.info(`Aguarde ${remainingTime}s para enviar outra mensagem`, {
            duration: 2000,
          });
          
          setTimeout(() => {
            isThrottledRef.current = false;
          }, THROTTLE_DELAY_MS - timeSinceLastCall);
        }
        
        return null;
      }

      lastCallRef.current = now;
      return fn(...args) as ReturnType<T>;
    };
  }, []);

  const canSend = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    return timeSinceLastCall >= THROTTLE_DELAY_MS || lastCallRef.current === 0;
  }, []);

  const getRemainingTime = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;
    const remaining = THROTTLE_DELAY_MS - timeSinceLastCall;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }, []);

  return { throttle, canSend, getRemainingTime };
}
