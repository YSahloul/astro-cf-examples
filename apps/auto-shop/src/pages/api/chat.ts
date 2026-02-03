// src/pages/api/chat.ts
import type { APIRoute, APIContext } from 'astro';
import { routeAgentRequest } from 'agents';

export const ALL: APIRoute = async ({ request, locals }: APIContext): Promise<Response> => {
  const env = locals.runtime.env;
  
  // Get or create visitor ID from cookie
  const cookies = request.headers.get('cookie') || '';
  let visitorId = cookies.match(/visitor_id=([^;]+)/)?.[1];
  
  if (!visitorId) {
    visitorId = crypto.randomUUID();
  }
  
  // Route to the FitmentAgent DO using visitor ID as the name
  // The routeAgentRequest uses the FITMENT_AGENT binding from env
  const response = await routeAgentRequest(request, env, {
    prefix: `visitor-${visitorId}`,
  });
  
  return response ?? new Response('Not Found', { status: 404 });
};
