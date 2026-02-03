// src/pages/agents/[agent]/[name].ts
// WebSocket endpoint for agent connections
// URL pattern: /agents/fitment-agent/visitor-123

import type { APIRoute, APIContext } from 'astro';
import { routeAgentRequest } from 'agents';

export const ALL: APIRoute = async ({ request, locals }: APIContext): Promise<Response> => {
  const env = locals.runtime.env;
  
  // routeAgentRequest handles the WebSocket upgrade and routing to the DO
  const response = await routeAgentRequest(request, env);
  
  return response ?? new Response('Not Found', { status: 404 });
};
