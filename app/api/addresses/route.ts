import { z } from "zod";
import { db } from "@/lib/db";
import { addressSchema } from "@/lib/validations/auth";
import {
  ok,
  parseBody,
  serverError,
  withUser,
  notFound,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

export async function GET() {
  const auth = await withUser();
  if (!auth.ok) return auth.response;

  try {
    const addresses = await db.address.findMany({
      where: { userId: auth.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return ok({ addresses });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, addressSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const count = await db.address.count({ where: { userId: auth.user.id } });
    const makeDefault = parsed.data.isDefault || count === 0;

    const address = await db.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId: auth.user.id },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId: auth.user.id,
          label: parsed.data.label,
          address: parsed.data.address,
          city: parsed.data.city,
          postalCode: parsed.data.postalCode || null,
          isDefault: makeDefault,
        },
      });
    });

    return ok({ address }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

const updateSchema = addressSchema.partial().extend({ id: z.string().min(1) });

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, updateSchema);
  if (!parsed.ok) return parsed.response;

  const { id, ...updates } = parsed.data;

  try {
    // Ownership check before any write.
    const owned = await db.address.findFirst({
      where: { id, userId: auth.user.id },
      select: { id: true },
    });
    if (!owned) return notFound("Address");

    const address = await db.$transaction(async (tx) => {
      if (updates.isDefault) {
        await tx.address.updateMany({
          where: { userId: auth.user.id },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id },
        data: {
          ...(updates.label !== undefined ? { label: updates.label } : {}),
          ...(updates.address !== undefined ? { address: updates.address } : {}),
          ...(updates.city !== undefined ? { city: updates.city } : {}),
          ...(updates.postalCode !== undefined
            ? { postalCode: updates.postalCode || null }
            : {}),
          ...(updates.isDefault !== undefined ? { isDefault: updates.isDefault } : {}),
        },
      });
    });

    return ok({ address });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, z.object({ id: z.string().min(1) }));
  if (!parsed.ok) return parsed.response;

  try {
    const result = await db.address.deleteMany({
      where: { id: parsed.data.id, userId: auth.user.id },
    });
    if (result.count === 0) return notFound("Address");
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
