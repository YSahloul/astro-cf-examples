import { env } from "cloudflare:workers";
import { CustomerService } from "@/lib/services/customer";
import { validateApiTokenResponse } from "@/lib/api";

export async function GET({ params, request }) {
  const { id } = params;

  const invalidTokenResponse = await validateApiTokenResponse(
    request,
    env.API_TOKEN,
  );
  if (invalidTokenResponse) return invalidTokenResponse;

  const customerService = new CustomerService(env.DB);
  const customer = await customerService.getById(id);

  if (!customer) {
    return Response.json({ message: "Customer not found" }, { status: 404 });
  }

  return Response.json({ customer: customer });
}
