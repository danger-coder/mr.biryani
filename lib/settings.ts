import "server-only";

import { db } from "@/lib/db";

/**
 * Site settings live in the DB so an admin can change them without a deploy.
 * Defaults below are the source of truth for shape + fallbacks.
 */
export const SETTING_DEFAULTS = {
  restaurantName: "Mr. Biryani",
  tagline: "Biryani Made With Passion.",
  supportEmail: "hello@mrbiryani.com",
  supportPhone: "+977 9800000000",
  deliveryFee: "100",
  freeDeliveryOver: "2500",
  minimumOrder: "300",
  taxPercent: "0",
  orderingEnabled: "true",
  reservationsEnabled: "true",
  instagram: "https://instagram.com",
  facebook: "https://facebook.com",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export async function getSettings(): Promise<Settings> {
  const rows = await db.siteSetting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...SETTING_DEFAULTS, ...stored } as Settings;
}

export async function setSettings(values: Partial<Settings>) {
  const entries = Object.entries(values).filter(
    ([key]) => key in SETTING_DEFAULTS,
  ) as [SettingKey, string][];

  await db.$transaction(
    entries.map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );
}

export function settingNumber(settings: Settings, key: SettingKey): number {
  const parsed = Number(settings[key]);
  return Number.isFinite(parsed) ? parsed : Number(SETTING_DEFAULTS[key]) || 0;
}

export function settingBool(settings: Settings, key: SettingKey): boolean {
  return settings[key] === "true";
}
