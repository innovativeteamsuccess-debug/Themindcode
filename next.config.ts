import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* pdf-parse (and its pdfjs-dist engine) spawn a worker through a
     dynamic import that bundlers cannot trace — keep them OUT of the
     server bundle so Node loads them natively at runtime. */
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  /* The preview link is proxied twice (preview-chat-….space-z.ai →
     fcapp.run gateway → sandbox), so Server Actions see a different
     x-forwarded-host than the browser's Origin header. Without this
     allowlist Next aborts every Server Action behind the preview. */
  experimental: {
    serverActions: {
      allowedOrigins: [
        "*.space-z.ai",
        "ws-ecdcf-b-cfaa-khtileiaia.cn-hongkong-vpc.fcapp.run",
        "preview-chat-8689c798-d0d5-4eff-bd4c-e90f0fbd78f9.space-z.ai",
      ],
    },
  },
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
