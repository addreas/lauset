FROM denoland/deno:latest AS builder
ENV DENO_DIR=/deno-dir
WORKDIR /app

COPY deno.json deno.lock package.json* ./
RUN deno ci --prod --skip-types

COPY . .
RUN deno task build

FROM denoland/deno:latest
ENV DENO_DIR=/deno-dir
WORKDIR /app

COPY --from=builder /app .
COPY --from=builder /deno-dir /deno-dir

EXPOSE 8000
CMD ["deno", "serve", "-A", "_fresh/server.js"]
