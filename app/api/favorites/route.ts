import { z } from "zod";
import { db } from "@/lib/db";
import {
  ok,
  parseBody,
  serverError,
  withUser,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

const schema = z.object({ menuItemId: z.string().min(1) });

export async function GET() {
  const auth = await withUser();
  if (!auth.ok) return auth.response;

  try {
    const favorites = await db.favorite.findMany({
      where: { userId: auth.user.id },
      select: { menuItemId: true },
    });
    return ok({ menuItemIds: favorites.map((entry) => entry.menuItemId) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, schema);
  if (!parsed.ok) return parsed.response;

  try {
    // Upsert keeps this idempotent — double-tapping the heart is not an error.
    await db.favorite.upsert({
      where: {
        userId_menuItemId: {
          userId: auth.user.id,
          menuItemId: parsed.data.menuItemId,
        },
      },
      create: { userId: auth.user.id, menuItemId: parsed.data.menuItemId },
      update: {},
    });
    return ok({ favorite: true });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, schema);
  if (!parsed.ok) return parsed.response;

  try {
    await db.favorite.deleteMany({
      where: { userId: auth.user.id, menuItemId: parsed.data.menuItemId },
    });
    return ok({ favorite: false });
  } catch (error) {
    return serverError(error);
  }
}
