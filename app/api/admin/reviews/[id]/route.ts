import { db } from "@/lib/db";
import { reviewStatusSchema } from "@/lib/validations/admin";
import {
  ok,
  notFound,
  parseBody,
  serverError,
  withAdmin,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await parseBody(request, reviewStatusSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const existing = await db.review.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return notFound("Review");

    const review = await db.review.update({
      where: { id },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    });

    return ok({ review });
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
    const existing = await db.review.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return notFound("Review");

    await db.review.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}
