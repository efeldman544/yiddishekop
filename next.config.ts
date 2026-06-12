import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas', 'puppeteer-core', '@sparticuz/chromium'],
  // pdfjs loads these at runtime via dynamically-built paths, so Vercel's
  // file tracing can't detect them — without this, PDFs that rely on
  // standard fonts or CJK character maps fail to render in production
  outputFileTracingIncludes: {
    '/api/resume/\\[candidateId\\]': [
      './node_modules/pdfjs-dist/standard_fonts/**',
      './node_modules/pdfjs-dist/cmaps/**',
      './node_modules/@sparticuz/chromium/bin/**',
    ],
  },
};

export default nextConfig;
