import { env } from "cloudflare:workers";
import { validateApiTokenResponse } from "@/lib/api";
import { SubscriptionService } from "@/lib/services/subscription";

export async function GET({ request }) {
  const invalidTokenResponse = await validateApiTokenResponse(
    request,
    env.API_TOKEN,
  );
  if (invalidTokenResponse) return invalidTokenResponse;

  const subscriptionService = new SubscriptionService(env.DB);

  try {
    const subscriptions = await subscriptionService.getAll();
    return Response.json({ subscriptions });
  } catch (error) {
    return Response.json(
      { message: "Couldn't load subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST({ request }) {
  const invalidTokenResponse = await validateApiTokenResponse(
    request,
    env.API_TOKEN,
  );
  if (invalidTokenResponse) return invalidTokenResponse;

  const subscriptionService = new SubscriptionService(env.DB);

  try {
    const body = await request.json();
    await subscriptionService.create(body);
    return Response.json(
      {
        message: "Subscription created successfully",
        success: true,
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        message: error instanceof Error ? error.message : "Failed to create subscription",
        success: false,
      },
      { status: 500 },
    );
  }
}
