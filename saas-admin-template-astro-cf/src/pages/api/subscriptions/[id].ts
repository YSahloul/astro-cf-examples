import { env } from "cloudflare:workers";
import { validateApiTokenResponse } from "@/lib/api";
import { SubscriptionService } from "@/lib/services/subscription";

export async function GET({ params, request }) {
  const { id } = params;

  const invalidTokenResponse = await validateApiTokenResponse(
    request,
    env.API_TOKEN,
  );
  if (invalidTokenResponse) return invalidTokenResponse;

  const subscriptionService = new SubscriptionService(env.DB);

  try {
    const subscription = await subscriptionService.getById(id);

    if (!subscription) {
      return Response.json(
        { message: "Subscription not found" },
        { status: 404 },
      );
    }

    return Response.json({ subscription });
  } catch (error) {
    return Response.json(
      { message: "Couldn't load subscription" },
      { status: 500 },
    );
  }
}
