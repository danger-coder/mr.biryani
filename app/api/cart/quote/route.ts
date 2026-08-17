import { priceCart } from "@/lib/pricing";
import { quoteSchema } from "@/lib/validations/order";
import { ok, parseBody, serverError, sameOrigin, csrfFailure } from "@/lib/api";

/**
 * Authoritative cart pricing.
 *
 * The client posts only item ids and quantities — never prices. Everything
 * returned here (line prices, delivery fee, discount, total) is computed from
 * the database by the same function checkout uses, so the quoted total and the
 * charged total cannot diverge.
 */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const parsed = await parseBody(request, quoteSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const quote = await priceCart(parsed.data.items, {
      orderType: parsed.data.orderType,
      couponCode: parsed.data.couponCode ?? null,
    });
    return ok({ quote });
  } catch (error) {
    return serverError(error);
  }
}
