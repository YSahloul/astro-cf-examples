import { env } from "cloudflare:workers";
import { validateApiTokenResponse } from "@/lib/api";

type Params = {
  id: string;
};

export async function POST({
  request,
  params,
}: {
  request: Request;
  params: Params;
}) {
  const invalidTokenResponse = await validateApiTokenResponse(
    request,
    env.API_TOKEN,
  );
  if (invalidTokenResponse) return invalidTokenResponse;

  if (!('CUSTOMER_WORKFLOW' in env)) {
    return Response.json(
      { message: "Workflow binding not configured" },
      { status: 501 },
    );
  }

  const { id } = params;
  await (env as any).CUSTOMER_WORKFLOW.create({ params: { id } });
  return new Response(null, { status: 202 });
}
