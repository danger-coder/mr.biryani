import { db } from "@/lib/db";
import { couponSchema } from "@/lib/validations/admin";
import { toNumber } from "@/lib/utils";
import {
  ok,
  fail,
  parseBody,
  serverError,
  withAdmin,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

export async function GET() {
  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  try {
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return ok({
      coupons: coupons.map((coupon) => ({
        ...coupon,
        value: toNumber(coupon.value),
        minimumOrder: toNumber(coupon.minimumOrder),
        maxDiscount: coupon.maxDiscount === null ? null : toNumber(coupon.maxDiscount),
      })),
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, couponSchema);
  if (!parsed.ok) return parsed.response;

  const input = parsed.data;

  try {
    const existing = await db.coupon.findUnique({
      where: { code: input.code },
      select: { id: true },
    });
    if (existing) {
      return fail("A coupon with that code already exists.", 409, {
        code: "This code is already in use.",
      });
    }

    const coupon = await db.coupon.create({
      data: {
        code: input.code,
        description: input.description || null,
        type: input.type,
        value: input.value,
        minimumOrder: input.minimumOrder,
        maxDiscount:
          input.maxDiscount === "" || input.maxDiscount === null ||
          input.maxDiscount === undefined
            ? null
            : Number(input.maxDiscount),
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        usageLimit:
          input.usageLimit === "" || input.usageLimit === null ||
          input.usageLimit === undefined
            ? null
            : Number(input.usageLimit),
        active: input.active,
      },
    });

    return ok({ coupon: { ...coupon, value: toNumber(coupon.value) } }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
