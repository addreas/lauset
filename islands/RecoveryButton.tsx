import { useState } from "preact/hooks";

interface RecoveryButtonProps {
  identityId: string;
  kind: "link" | "code";
}

type Status = "idle" | "loading" | "copied" | "reveal" | "error";

// Confirm-style: no recovery value is minted on page load. On click this island
// POSTs to the per-kind API route, then copies the resulting link/code to the
// clipboard (or reveals it inline if the clipboard API is unavailable).
export default function RecoveryButton({
  identityId,
  kind,
}: RecoveryButtonProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  async function create() {
    if (status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(
        `/admin/identities/${encodeURIComponent(identityId)}/recovery-${kind}`,
        { method: "POST" },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
      const url: string = body.value;
      setValue(url);
      if (navigator.clipboard && globalThis.isSecureContext) {
        try {
          await navigator.clipboard.writeText(url);
          setStatus("copied");
          return;
        } catch {
          // clipboard failed — fall through to reveal
        }
      }
      setStatus("reveal");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <span class="recovery">
      <button
        class="button"
        type="button"
        onClick={create}
        disabled={status === "loading"}
      >
        {status === "loading"
          ? "Creating…"
          : kind === "link"
          ? "Recovery link"
          : "Recovery code"}
      </button>
      {status === "copied" && (
        <span class="recovery-ok">Copied to clipboard</span>
      )}
      {status === "reveal" && (
        <span class="recovery-reveal">
          <code>{value}</code>
        </span>
      )}
      {status === "error" && <span class="recovery-err">{error}</span>}
    </span>
  );
}
