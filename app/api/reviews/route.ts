import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validations/order";
import { notify } from "@/lib/notifications";
import {
  ok,
  fail,
  parseBody,
  serverError,
  withUser,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

/** Approved reviews only — moderation state is never exposed publicly. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const menuItemId = url.searchParams.get("menuItemId");

  try {
    const reviews = await db.review.findMany({
      where: { status: "APPROVED", ...(menuItemId ? { menuItemId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        user: { select: { name: true } },
        menuItem: { select: { name: true, slug: true } },
      },
    });
    return ok({ reviews });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, reviewSchema);
  if (!parsed.ok) return parsed.response;

  const input = parsed.data;

  try {
    // Reviews must be earned: the customer needs a delivered order of their own,
    // and if they name a dish, that dish must have been in it.
    const deliveredOrder = await db.order.findFirst({
      where: {
        userId: auth.user.id,
        status: "DELIVERED",
        ...(input.orderId ? { id: input.orderId } : {}),
        ...(input.menuItemId ? { items: { some: { menuItemId: input.menuItemId } } } : {}),
      },
      select: { id: true },
    });

    if (!deliveredOrder) {
      return fail(
        "Reviews are open to customers once an order containing this dish has been delivered.",
        403,
      );
    }

    const existing = await db.review.findFirst({
      where: {
        userId: auth.user.id,
        orderId: deliveredOrder.id,
        menuItemId: input.menuItemId || null,
      },
      select: { id: true },
    });
    if (existing) {
      return fail("You've already reviewed this dish for that order.", 409);
    }

    const review = await db.review.create({
      data: {
        userId: auth.user.id,
        orderId: deliveredOrder.id,
        menuItemId: input.menuItemId || null,
        rating: input.rating,
        title: input.title || null,
        comment: input.comment,
        // Every review is moderated before it appears on the site.
        status: "PENDING",
      },
      select: { id: true, status: true },
    });

    await notify({
      forAdmin: true,
      type: "REVIEW",
      title: "Review Awaiting Approval",
      message: `${auth.user.name} left a ${input.rating}-star review.`,
      link: "/admin/reviews",
    });

    return ok({ review }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
