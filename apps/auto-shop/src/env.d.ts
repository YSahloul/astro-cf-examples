/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

interface Env {
  // Database
  DB: D1Database;
  // KV for sessions
  SESSION: KVNamespace;
  // Static assets
  ASSETS: Fetcher;
  // FitmentAgent Durable Object
  FITMENT_AGENT: DurableObjectNamespace;
  // API Keys
  OPENAI_API_KEY: string;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
