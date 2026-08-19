# Lauset

`[låset]`

An auth UI for **Ory Kratos** (identity) and **Ory Hydra** (OAuth2), built as a
thin shell around
**[`@ory/elements-preact`](https://www.npmjs.com/package/@ory/elements-preact)**
for all flow rendering. Also includes a rudimentary admin UI.

## Quick Start

```bash
cp .env.example .env   # Kratos / Hydra URLs
deno task dev          # dev server with HMR
```

For production: use the Dockerfile and remember that /admin has zero auth and is
intended to be protected by a reverse-proxy.

## Auth checking

Both Envoy `ext_authz` and nginx/haproxy variants can be setup.

### Using with Gateway API ExternalAuth (GEP-1494)

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: require-auth
  namespace: default
spec:
  parentRefs:
    - name: your-gateway-here
  rules:
    - matches: ...
      filters:
        - type: ExternalAuth
          externalAuth:
            protocol: HTTP
            backendRef:
              name: lauset
              port: 80
            http:
              path: /check
              allowedHeaders:
                - Cookie
              allowedResponseHeaders:
                - Location
                # optionally:
                # - X-User-Id
                # - X-User-Email
                # - X-User-Name
                # - X-Auth-Request-User
                # - X-Auth-Request-Email
                # - X-Auth-Request-Preferred-Username
      backendRefs: ...
```

### ingress-nginx

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/auth-url: "http://kratos.example.com/sessions/whoami"
    nginx.ingress.kubernetes.io/auth-signin: "http://kratos.example.com/login?return_to=$request_uri"
```
