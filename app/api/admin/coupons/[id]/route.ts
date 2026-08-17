import { db } from "@/lib/db";
import { couponUpdateSchema } from "@/lib/validations/admin";
import { toNumber } from "@/lib/utils";
import {
  ok,
  fail,
  notFound,
  parseBody,
  serverError,
  withAdmin,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

const updateSchema = couponUpdateSchema;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, updateSchema);
  if (!parsed.ok) return parsed.response;

  const input = parsed.data;

  try {
    const existing = await db.coupon.findUnique({
      where: { id },
      select: { id: true, type: true, value: true },
    });
    if (!existing) return notFound("Coupon");

    const type = input.type ?? existing.type;
    const value = input.value ?? toNumber(existing.value);
    if (type === "PERCENTAGE" && value > 100) {
      return fail("A percentage discount cannot exceed 100%.", 422, {
        value: "Maximum 100%.",
      });
    }

    if (input.code) {
      const clash = await db.coupon.findUnique({
        where: { code: input.code },
        select: { id: true },
      });
      if (clash && clash.id !== id) {
        return fail("A coupon with that code already exists.", 409, {
          code: "This code is already in use.",
        });
      }
    }

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.description !== undefined
          ? { description: input.description || null }
          : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.value !== undefined ? { value: input.value } : {}),
        ...(input.minimumOrder !== undefined
          ? { minimumOrder: input.minimumOrder }
          : {}),
        ...(input.maxDiscount !== undefined
          ? {
              maxDiscount:
                input.maxDiscount === "" || input.maxDiscount === null
                  ? null
                  : Number(input.maxDiscount),
            }
          : {}),
        ...(input.expiresAt !== undefined
          ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
          : {}),
        ...(input.usageLimit !== undefined
          ? {
              usageLimit:
                input.usageLimit === "" || input.usageLimit === null
                  ? null
                  : Number(input.usageLimit),
            }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    return ok({ coupon: { ...coupon, value: toNumber(coupon.value) } });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const existing = await db.coupon.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return notFound("Coupon");

    await db.coupon.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
