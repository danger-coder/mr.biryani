import { z } from "zod";
import { getSettings, setSettings, SETTING_DEFAULTS } from "@/lib/settings";
import {
  ok,
  parseBody,
  serverError,
  withAdmin,
  sameOrigin,
  csrfFailure,
} from "@/lib/api";

// Only known keys are accepted; unknown keys are dropped rather than persisted.
const schema = z
  .object(
    Object.fromEntries(
      Object.keys(SETTING_DEFAULTS).map((key) => [
        key,
        z.string().trim().max(500).optional(),
      ]),
    ),
  )
  .strip();

export async function GET() {
  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  try {
    return ok({ settings: await getSettings() });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return csrfFailure();

  const auth = await withAdmin();
  if (!auth.ok) return auth.response;

  const parsed = await parseBody(request, schema);
  if (!parsed.ok) return parsed.response;

  try {
    const clean = Object.fromEntries(
      Object.entries(parsed.data).filter(([, value]) => value !== undefined),
    ) as Record<string, string>;

    await setSettings(clean);
    return ok({ settings: await getSettings() });
  } catch (error) {
    return serverError(error);
  }
}
