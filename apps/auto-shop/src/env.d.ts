/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  // Fitment database (external wheel/tire fitment data)
  FITMENT_DB: D1Database;
  // KV for sessions
  SESSION: KVNamespace;
  // Static assets
  ASSETS: Fetcher;
  // FitmentAgent Durable Object
  FITMENT_AGENT: DurableObjectNamespace;
  // Payload CMS service binding
  PAYLOAD_CMS: Fetcher;
  // API Keys
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
  GOOGLE_AI_STUDIO_API_KEY?: string;
}

declare module "cloudflare:workers" {
  const env: Env;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
