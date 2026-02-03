import { env } from "cloudflare:workers";
import { CustomerService } from "@/lib/services/customer";
import { validateApiTokenResponse } from "@/lib/api";

export async function GET({ request }) {
  const invalidTokenResponse = await validateApiTokenResponse(
    request,
    env.API_TOKEN,
  );
  if (invalidTokenResponse) return invalidTokenResponse;

  const customerService = new CustomerService(env.DB);
  const customers = await customerService.getAll();

  if (customers) {
    return Response.json({ customers });
  } else {
    return Response.json(
      { message: "Couldn't load customers" },
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

  const customerService = new CustomerService(env.DB);

  const body = await request.json();
  const success = await customerService.create(body);

  if (success) {
    return Response.json(
      { message: "Customer created successfully", success: true },
      { status: 201 },
    );
  } else {
    return Response.json(
      { message: "Couldn't create customer", success: false },
      { status: 500 },
    );
  }
}
