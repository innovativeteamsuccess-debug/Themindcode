import type { NextConfig } from "next";

/* STATIC_EXPORT=1 → pure HTML/JS/CSS bundle for static hosts
   (GoDaddy cPanel, Netlify drop, any CDN). API routes and the DB-backed
   /zone pages are moved aside by scripts/build_static.sh before build. */
const STATIC_EXPORT = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  output: STATIC_EXPORT ? "export" : "standalone",
  ...(STATIC_EXPORT ? { images: { unoptimized: true }, trailingSlash: true } : {}),
  /* pdf-parse (and its pdfjs-dist engine) spawn a worker through a
     dynamic import that bundlers cannot trace — keep them OUT of the
     server bundle so Node loads them natively at runtime. */
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  /* The preview link is proxied twice (preview-chat-….space-z.ai →
     fcapp.run gateway → sandbox), so Server Actions see a different
     x-forwarded-host than the browser's Origin header. Without this
     allowlist Next aborts every Server Action behind the preview.
     (Skipped in static-export mode: server actions are unsupported
     there and the mere presence of the block aborts the export.) */
  ...(STATIC_EXPORT
    ? {}
    : {
        experimental: {
          serverActions: {
            allowedOrigins: [
              "*.space-z.ai",
              "ws-ecdcf-b-cfaa-khtileiaia.cn-hongkong-vpc.fcapp.run",
              "preview-chat-8689c798-d0d5-4eff-bd4c-e90f0fbd78f9.space-z.ai",
            ],
          },
        },
      }),
  /* Dev-mode static assets (/_next/*) requested through the public
     preview domain must be allowlisted or Next refuses to serve them. */
  allowedDevOrigins: ["*.space-z.ai", "ws-ecdcf-b-cfaa-khtileiaia.cn-hongkong-vpc.fcapp.run"],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: false,
  /* Baseline security headers on every response — cheap, standards-
     grade hardening (clickjacking, MIME sniffing, referrer leak,
     ambient feature access). */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          /* everything is served behind HTTPS (preview + production) —
             tell browsers to refuse plain HTTP for the next 2 years */
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          /* window isolation: this app never talks across windows */
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
