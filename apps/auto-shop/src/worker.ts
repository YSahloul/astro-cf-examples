// src/worker.ts
// Worker entry point that exports both the Astro handler and Durable Objects

import { handle } from "@astrojs/cloudflare/handler";
import { App } from "astro/app";
import type { SSRManifest } from "astro";

// Import the FitmentAgent Durable Object class
import { FitmentAgent } from "./agents/FitmentAgent";

// Environment type
interface Env {
  OPENAI_API_KEY: string;
  DB: D1Database;
  SESSION: KVNamespace;
  ASSETS: Fetcher;
  FITMENT_AGENT: DurableObjectNamespace;
}

/**
 * Create exports for the Cloudflare Worker
 * This function is called by the Astro Cloudflare adapter
 */
export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);

  return {
    default: {
      async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
      ): Promise<Response> {
        // @ts-expect-error - Astro types don't fully match Cloudflare types
        return handle(manifest, app, request, env, ctx);
      },
    } satisfies ExportedHandler<Env>,
    FitmentAgent,
  };
}
