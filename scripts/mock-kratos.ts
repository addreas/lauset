// Minimal mock Ory Kratos (public, :4433) + Hydra (admin, :4445) for diffing
// the UI against the kratos-selfservice-ui-node reference. Implements only the
// endpoints the apps actually call. A cookie `ory_kratos_session=valid` fakes
// an authenticated session.
//
// Used by scripts/compare.ts. Run standalone: `deno run -A scripts/mock-kratos.ts`

const KRATOS = "http://localhost:4433";
const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(headers ?? {}) },
  });

const input = (
  name: string,
  type: string,
  group: string,
  extra: Record<string, unknown> = {},
) => ({
  type: "input",
  group,
  attributes: { name, type, node_type: "input", disabled: false, ...extra },
  messages: [],
  meta: {},
});
const csrf = input("csrf_token", "hidden", "default", {
  value: "mock-csrf-token",
  required: true,
});

const mockIdentity = {
  id: "mock-identity-id",
  schema_id: "default",
  state: "active",
  traits: { email: "user@example.com", name: { first: "Mock", last: "User" } },
  verifiable_addresses: [{
    id: "v1",
    value: "user@example.com",
    verified: true,
    via: "email",
    status: "completed",
  }],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const loginFlow = {
  id: "mock-login-flow",
  type: "browser",
  expires_at: "2026-12-31T23:59:59Z",
  issued_at: "2026-01-01T00:00:00Z",
  request_url: `${KRATOS}/self-service/login/browser`,
  refresh: false,
  requested_aal: "aal1",
  return_to: "",
  ui: {
    method: "POST",
    action: `${KRATOS}/self-service/login?flow=mock-login-flow`,
    nodes: [
      csrf,
      input("identifier", "text", "password", {
        value: "",
        required: true,
        autocomplete: "username",
      }),
      input("password", "password", "password", {
        required: true,
        autocomplete: "current-password",
      }),
      input("method", "submit", "password", { value: "password" }),
    ],
    messages: [],
  },
};
const registrationFlow = {
  ...loginFlow,
  id: "mock-registration-flow",
  ui: {
    method: "POST",
    action: `${KRATOS}/self-service/registration?flow=mock-registration-flow`,
    nodes: [
      csrf,
      input("traits.email", "email", "password", {
        required: true,
        autocomplete: "email",
      }),
      input("password", "password", "password", {
        required: true,
        autocomplete: "new-password",
      }),
      input("method", "submit", "password", { value: "password" }),
    ],
    messages: [],
  },
};
const recoveryFlow = {
  ...loginFlow,
  id: "mock-recovery-flow",
  ui: {
    method: "POST",
    action: `${KRATOS}/self-service/recovery?flow=mock-recovery-flow`,
    nodes: [
      csrf,
      input("email", "email", "default", { required: true }),
      input("method", "submit", "default", { value: "link" }),
    ],
    messages: [],
  },
};
const verificationFlow = {
  ...loginFlow,
  id: "mock-verification-flow",
  ui: {
    method: "POST",
    action: `${KRATOS}/self-service/verification?flow=mock-verification-flow`,
    nodes: [
      csrf,
      input("email", "email", "default", { required: true }),
      input("method", "submit", "default", { value: "link" }),
    ],
    messages: [],
  },
};
const settingsFlow = {
  ...loginFlow,
  id: "mock-settings-flow",
  identity: mockIdentity,
  ui: {
    method: "POST",
    action: `${KRATOS}/self-service/settings?flow=mock-settings-flow`,
    nodes: [csrf, input("method", "submit", "password", { value: "password" })],
    messages: [],
  },
};
const session = () => ({
  id: "mock-session",
  active: true,
  authenticated_at: "2026-01-01T00:00:00Z",
  expires_at: "2026-12-31T23:59:59Z",
  authenticator_assurance_level: "aal1",
  authentication_methods: [{
    method: "password",
    completed_at: "2026-01-01T00:00:00Z",
  }],
  identity: mockIdentity,
});

const hasSession = (req: Request) =>
  /ory_kratos_session=valid/.test(req.headers.get("cookie") ?? "");

// ── Kratos (public, 4433) ───────────────────────────────────────────────
Deno.serve({ port: 4433 }, (req) => {
  const url = new URL(req.url);
  const q = url.searchParams;
  if (url.pathname === "/sessions/whoami") {
    if (hasSession(req)) return json(session());
    if (/ory_kratos_session=needs-aal2/.test(req.headers.get("cookie") ?? "")) {
      return json({
        error: {
          id: "session_aal2_required",
          code: 403,
          status: "Forbidden",
          message: "aal2 required",
        },
      }, 403);
    }
    return json({
      error: {
        id: "session_inactive",
        code: 401,
        status: "Unauthorized",
        message: "No active session",
      },
    }, 401);
  }
  if (url.pathname === "/self-service/login/flows") return json(loginFlow);
  if (url.pathname === "/self-service/registration/flows") {
    return json(registrationFlow);
  }
  if (url.pathname === "/self-service/recovery/flows") {
    return json(recoveryFlow);
  }
  if (url.pathname === "/self-service/verification/flows") {
    return json(verificationFlow);
  }
  if (url.pathname === "/self-service/settings/flows") {
    const id = q.get("id");
    if (id === "11111111-2222-4111-8111-111111111111") {
      return json({
        error: {
          id: "session_aal2_required",
          code: 403,
          status: "Forbidden",
          message: "aal2 required",
        },
        redirect_browser_to:
          `${KRATOS}/self-service/login/browser?aal=aal2&return_to=http://localhost:8000/settings`,
      }, 403);
    }
    return json({ ...settingsFlow, id: id ?? settingsFlow.id });
  }
  if (url.pathname === "/self-service/errors") {
    return json({
      id: q.get("id"),
      error: {
        id: "mock-error",
        code: 500,
        status: "Internal Server Error",
        message: "mock error detail",
      },
    });
  }
  if (url.pathname === "/self-service/logout/browser") {
    return json({
      logout_url: `${KRATOS}/self-service/logout?token=mock-token`,
    });
  }
  if (url.pathname === "/self-service/verification/browser") {
    return json(verificationFlow, 200, {
      "set-cookie": "ory_kratos_verification=mock; Path=/; HttpOnly",
    });
  }
  if (url.pathname === "/self-service/login/browser") {
    const challenge = q.get("login_challenge");
    const params = new URLSearchParams({ flow: "mock-login-flow" });
    if (challenge) params.set("login_challenge", challenge);
    return new Response(null, {
      status: 302,
      headers: { location: `http://localhost:8000/login?${params}` },
    });
  }
  if (url.pathname === "/.well-known/ory/webauthn.js") {
    return new Response("// mock webauthn js\n", {
      status: 200,
      headers: { "content-type": "text/javascript; charset=utf-8" },
    });
  }
  return json({
    error: { code: 404, status: "Not Found", message: `mock: ${url.pathname}` },
  }, 404);
});

// ── Hydra (admin, 4445) ─────────────────────────────────────────────────
Deno.serve({ port: 4445 }, (req) => {
  const url = new URL(req.url);
  const q = url.searchParams;
  if (url.pathname === "/admin/oauth2/auth/requests/login") {
    if (q.get("challenge") === "boom") {
      return json({
        error: {
          code: 500,
          status: "Internal Server Error",
          message: "hydra login boom",
        },
      }, 500);
    }
    return json({
      challenge: q.get("challenge"),
      requested_scope: ["openid", "email", "profile"],
      client: {
        client_id: "mock-client",
        client_name: "Mock Client",
      },
      subject: "mock-identity-id",
      oidc_context: {},
      skip: true,
    });
  }
  if (url.pathname === "/admin/oauth2/auth/requests/consent") {
    if (q.get("consent_challenge") === "boom") {
      return json({
        error: {
          code: 500,
          status: "Internal Server Error",
          message: "hydra boom",
        },
      }, 500);
    }
    return json({
      challenge: q.get("consent_challenge"),
      requested_scope: ["openid", "email", "profile"],
      requested_access_token_audience: [],
      client: {
        client_id: "mock-client",
        client_name: "Mock Client",
        skip_consent: q.get("consent_challenge")?.startsWith("skip") ?? false,
      },
      skip: q.get("consent_challenge")?.startsWith("skip") ?? false,
      subject: "mock-identity-id",
    });
  }
  if (url.pathname === "/admin/oauth2/auth/requests/logout") {
    return json({
      challenge: q.get("logout_challenge"),
      client: { client_id: "mock-client", skip_logout_consent: false },
    });
  }
  if (url.pathname.endsWith("/accept") || url.pathname.endsWith("/reject")) {
    return json({ redirect_to: "http://localhost:4180/oauth2/callback" });
  }
  return json({
    error: { code: 404, status: "Not Found", message: `mock: ${url.pathname}` },
  }, 404);
});

console.log("mock kratos on 4433, hydra on 4445");
