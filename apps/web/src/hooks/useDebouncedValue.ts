import { useEffect, useState } from "react";

/** Atrasa a propagação de um valor que muda a cada tecla (campo de busca). */
export function useDebouncedValue<T>(value: T, delayInMilliseconds: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayInMilliseconds);
    return () => clearTimeout(timer);
  }, [value, delayInMilliseconds]);

  return debouncedValue;
}
