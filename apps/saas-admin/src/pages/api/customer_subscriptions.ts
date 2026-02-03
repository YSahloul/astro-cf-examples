import { env } from "cloudflare:workers";
import { validateApiTokenResponse } from "@/lib/api";
import { CustomerSubscriptionService } from "@/lib/services/customer_subscription";

export async function GET({ request }) {
  const invalidTokenResponse = await validateApiTokenResponse(
    request,
    env.API_TOKEN,
  );
  if (invalidTokenResponse) return invalidTokenResponse;

  const customerSubscriptionService = new CustomerSubscriptionService(env.DB);
  const customerSubscriptions = await customerSubscriptionService.getAll();

  if (customerSubscriptions.length) {
    return Response.json({
      customer_subscriptions: customerSubscriptions,
    });
  } else {
    return Response.json(
      { message: "Couldn't load customer subscriptions" },
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

  const body = await request.json();
  const customerSubscriptionService = new CustomerSubscriptionService(env.DB);

  const response = await customerSubscriptionService.create(body);

  if (response.success) {
    return Response.json(
      { message: "Customer subscription created successfully", success: true },
      { status: 201 },
    );
  } else {
    return Response.json(
      { message: "Couldn't create customer subscription", success: false },
      { status: 500 },
    );
  }
}
