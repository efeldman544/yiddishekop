import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas', 'puppeteer-core', '@sparticuz/chromium', 'tesseract.js'],
  // pdfjs loads these at runtime via dynamically-built paths, so Vercel's
  // file tracing can't detect them — without this, PDFs that rely on
  // standard fonts or CJK character maps fail to render in production
  outputFileTracingIncludes: {
    '/api/resume/\\[candidateId\\]': [
      './node_modules/pdfjs-dist/standard_fonts/**',
      './node_modules/pdfjs-dist/cmaps/**',
      './node_modules/@sparticuz/chromium/bin/**',
      // tesseract.js-core ships WASM binaries that Node's require() loads at runtime;
      // static analysis can't detect them so we list them explicitly.
      './node_modules/tesseract.js-core/*.wasm',
      './node_modules/tesseract.js-core/*.js',
      './node_modules/tesseract.js/src/worker-script/node/**',
    ],
  },
};

export default nextConfig;
