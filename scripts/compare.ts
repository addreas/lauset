// Side-by-side comparison of our Fresh UI vs the kratos-selfservice-ui-node
// reference, both running against the mock Kratos/Hydra (scripts/mock-kratos.ts).
//
// This is an opt-in, manual tool — the file isn't named *_test.ts so `deno test`
// won't auto-discover it. Run it explicitly:
//
//   deno test -A scripts/compare.ts
//
// The reference is optional: set REFERENCE_DIR to a *built* checkout (one with
// lib/index.js — run `npm install && npm run build` there first), defaulting to
// /tmp/kratos-selfservice-ui-node. If it's absent only our app is smoke-checked.
//
// Ports 4433/4445/8000/3000 must be free.

const OURS = 8000;
const REF = 3000;
const KRATOS = 4433;
const HYDRA = 4445;
const REFERENCE_DIR = Deno.env.get("REFERENCE_DIR") ??
  "/tmp/kratos-selfservice-ui-node";
const AUTH = { cookie: "ory_kratos_session=valid" };
const AUTH_AAL2 = { cookie: "ory_kratos_session=needs-aal2" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitOn(port: number, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://localhost:${port}/`, { redirect: "manual" });
      return;
    } catch {
      await sleep(200);
    }
  }
  throw new Error(`:${port} did not come up`);
}

function spawn(
  cmd: string,
  args: string[],
  env: Record<string, string> = {},
  cwd?: string,
): Deno.ChildProcess {
  return new Deno.Command(cmd, {
    args,
    cwd,
    env: { ...Deno.env.toObject(), ...env },
    stdout: "null",
    stderr: "inherit",
  }).spawn();
}

async function probe(
  port: number,
  path: string,
  headers: Record<string, string> = {},
) {
  const res = await fetch(`http://localhost:${port}${path}`, {
    headers,
    redirect: "manual",
  });
  const body = await res.text();
  return {
    status: res.status,
    location: res.headers.get("location"),
    forms: (body.match(/<form/g) ?? []).length,
    body,
  };
}

function eq(a: unknown, b: unknown, label: string, ctx: string) {
  if (a !== b) {
    throw new Error(
      `${label} mismatch (${ctx}): ours=${JSON.stringify(a)} ref=${
        JSON.stringify(b)
      }`,
    );
  }
}

function includes(body: string, substr: string, label: string) {
  if (!body.includes(substr)) {
    throw new Error(`${label}: body missing "${substr}"`);
  }
}

// `consent render` covers the non-skip render path: both apps call
// UserConsentCard against the mock consent body (3 requested scopes + remember
// checkbox), so the diff checks status/location/form-count.
const MATRIX: [string, string, Record<string, string>?, string?][] = [
  ["login no-flow", "/login"],
  ["login challenge redirect", "/login?login_challenge=mock-challenge"],
  [
    "login challenge flow",
    "/login?flow=mock-login-flow&login_challenge=mock-challenge",
  ],
  ["registration no-flow", "/registration"],
  ["recovery no-flow", "/recovery"],
  ["verification no-flow", "/verification"],
  ["sessions unauth", "/sessions"],
  ["settings unauth", "/settings"],
  ["login flow", "/login?flow=mock-login-flow"],
  ["registration flow", "/registration?flow=mock-registration-flow"],
  ["recovery flow", "/recovery?flow=mock-recovery-flow"],
  ["verification flow", "/verification?flow=mock-verification-flow"],
  ["sessions authed", "/sessions", AUTH],
  [
    "settings aal2 satisfied",
    "/settings?flow=11111111-1111-4111-8111-111111111111",
    AUTH,
  ],
  [
    "settings aal2 required",
    "/settings?flow=11111111-2222-4111-8111-111111111111",
    AUTH,
  ],
  ["logout", "/logout?logout_challenge=mock", AUTH],
  ["consent skip", "/consent?consent_challenge=skipme", AUTH],
  ["consent render", "/consent?consent_challenge=renderme", AUTH],
  ["error", "/error?id=mock-flow-error"],
  [
    "consent 500",
    "/consent?consent_challenge=boom",
    AUTH,
    "Internal Server Error",
  ],
  ["404", "/no-such-page", undefined, "Page not found"],
  ["sessions aal2 redirect", "/sessions", AUTH_AAL2],
];

Deno.test("compare vs reference", async (t) => {
  const procs: Deno.ChildProcess[] = [];
  let refExists = false;
  try {
    refExists = Deno.statSync(REFERENCE_DIR).isDirectory;
  } catch {
    refExists = false;
  }

  try {
    procs.push(spawn("deno", ["run", "-A", "scripts/mock-kratos.ts"]));
    await waitOn(KRATOS);

    const build = await new Deno.Command("deno", { args: ["task", "build"] })
      .output();
    if (!build.success) {
      throw new Error(
        `build failed: ${new TextDecoder().decode(build.stderr)}`,
      );
    }
    procs.push(
      spawn(
        "deno",
        ["serve", "-A", "--port", String(OURS), "_fresh/server.js"],
        {
          KRATOS_PUBLIC_URL: `http://localhost:${KRATOS}`,
          KRATOS_BROWSER_URL: `http://localhost:${KRATOS}`,
          HYDRA_ADMIN_URL: `http://localhost:${HYDRA}`,
        },
      ),
    );
    await waitOn(OURS);

    if (refExists) {
      procs.push(
        spawn("node", ["lib/index.js"], {
          KRATOS_PUBLIC_URL: `http://localhost:${KRATOS}`,
          KRATOS_BROWSER_URL: `http://localhost:${KRATOS}`,
          ORY_SDK_URL: `http://localhost:${KRATOS}`,
          HYDRA_ADMIN_URL: `http://localhost:${HYDRA}`,
          COOKIE_SECRET: "test-cookie-secret",
          CSRF_COOKIE_NAME: "__Host-ax-x-csrf-token",
          CSRF_COOKIE_SECRET: "test-csrf-secret",
          DANGEROUSLY_DISABLE_SECURE_CSRF_COOKIES: "true",
          PORT: String(REF),
        }, REFERENCE_DIR),
      );
      await waitOn(REF);
    }

    for (const [label, path, headers, expect] of MATRIX) {
      await t.step(label, async () => {
        const o = await probe(OURS, path, headers);
        if (!refExists) {
          if (o.status === 0) throw new Error("no response");
          if (expect) includes(o.body, expect, `ours ${label}`);
          return;
        }
        const r = await probe(REF, path, headers);
        eq(o.status, r.status, "status", label);
        eq(o.location, r.location, "location", label);
        if (o.status === 200) eq(o.forms, r.forms, "forms", label);
        if (expect) {
          includes(o.body, expect, `ours ${label}`);
          includes(r.body, expect, `ref ${label}`);
        }
      });
    }
  } finally {
    for (const p of procs) {
      try {
        p.kill("SIGTERM");
      } catch {
        // already gone
      }
    }
    await sleep(300);
  }
});
