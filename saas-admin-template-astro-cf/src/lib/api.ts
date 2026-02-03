/**
 * API utilities for external API access.
 * The admin UI uses Astro Actions instead of these functions.
 */

const safeCompare = async (a: string, b: string) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const encoder = new TextEncoder();
  const aEncoded = encoder.encode(a);
  const bEncoded = encoder.encode(b);
  if (aEncoded.length !== bEncoded.length) return false;
  return await crypto.subtle.timingSafeEqual(aEncoded, bEncoded);
};

export const validateApiTokenResponse = async (request: Request, apiToken: string | undefined) => {
  const successful = await validateApiToken(request, apiToken);
  if (!successful) {
    return Response.json({ message: "Invalid API token" }, { status: 401 });
  }
};

export const validateApiToken = async (request: Request, apiToken: string | undefined) => {
  try {
    if (!request?.headers?.get) {
      console.error("Invalid request object");
      return false;
    }

    if (!apiToken) {
      console.error(
        "No API token provided. Set one as an environment variable."
      );
      return false;
    }

    const authHeader = request.headers.get("authorization");
    const customTokenHeader = request.headers.get("x-api-token");

    let tokenToValidate = customTokenHeader;

    if (authHeader) {
      if (authHeader.startsWith("Bearer ")) {
        tokenToValidate = authHeader.substring(7);
      } else if (authHeader.startsWith("Token ")) {
        tokenToValidate = authHeader.substring(6);
      } else {
        tokenToValidate = authHeader;
      }
    }

    if (!tokenToValidate || tokenToValidate.length === 0) return false;

    return await safeCompare(apiToken.trim(), tokenToValidate.trim());
  } catch (error) {
    console.error("Error validating API token:", error);
    return false;
  }
};
