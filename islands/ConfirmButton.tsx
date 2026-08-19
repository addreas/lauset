import { useEffect, useRef, useState } from "preact/hooks";

interface ConfirmButtonProps {
  action: string;
  fields?: Record<string, string>;
  label: string;
  /** label shown after the first click, while waiting for the confirming click */
  confirmLabel?: string;
  variant?: "neutral" | "danger";
  size?: "default" | "mini";
  disabled?: boolean;
  /** how long (ms) the armed state waits for a confirming click before resetting */
  confirmWindowMs?: number;
}

// Two-click confirm: the first click arms the button (label + style change),
// the second click lets the native form submit proceed. Without JS the form
// still submits normally — progressive enhancement, no extra requests needed.
export default function ConfirmButton({
  action,
  fields = {},
  label,
  confirmLabel,
  variant = "neutral",
  size = "default",
  disabled = false,
  confirmWindowMs = 4000,
}: ConfirmButtonProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [armed, setArmed] = useState(false);

  const reset = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setArmed(false);
  };

  // only clear the pending timer on unmount — never setState during teardown
  useEffect(
    () => () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    },
    [],
  );

  const text = armed ? (confirmLabel ?? `Confirm — ${label}`) : label;

  return (
    <form method="post" action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        class={[
          "button",
          "confirm-button",
          variant === "danger" ? "button-danger" : "",
          size === "mini" ? "button-mini" : "",
          armed ? "confirm-armed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        type="submit"
        disabled={disabled}
        aria-label={text}
        onClick={(e) => {
          if (disabled) return;
          if (!armed) {
            e.preventDefault();
            setArmed(true);
            timerRef.current = setTimeout(reset, confirmWindowMs);
          } else if (timerRef.current != null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }}
        onBlur={reset}
      >
        {text}
      </button>
    </form>
  );
}
