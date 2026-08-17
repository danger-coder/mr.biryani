import { z } from "zod";

const money = z.coerce.number().min(0, "Must be zero or more.").max(1_000_000);

/**
 * Create vs update schemas are built separately on purpose.
 *
 * Zod's `.partial()` makes a field optional but does NOT strip its `.default()`,
 * so `partialSchema.parse({ price: 449 })` still yields `featured: false`,
 * `available: true`, `spiceLevel: "MEDIUM"` and so on. A PATCH route that writes
 * every key it sees would then silently reset fields the caller never mentioned
 * — un-featuring a dish on a price edit, or wiping a coupon's minimum order when
 * toggling it off.
 *
 * So: create schemas carry the defaults, update schemas carry none. Only what
 * the caller actually sent is ever written.
 */

// ------------------------------------------------------------------ category

const categoryFields = {
  name: z.string().trim().min(2, "Name is required.").max(60),
  description: z.string().trim().max(300).or(z.literal("")),
  image: z.string().trim().max(300).or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999),
  active: z.boolean(),
};

export const categorySchema = z.object({
  ...categoryFields,
  description: categoryFields.description.optional(),
  image: categoryFields.image.optional(),
  sortOrder: categoryFields.sortOrder.default(0),
  active: categoryFields.active.default(true),
});

export const categoryUpdateSchema = z.object(categoryFields).partial();

// ------------------------------------------------------------------ menu item

const menuItemFields = {
  categoryId: z.string().min(1, "Choose a category."),
  name: z.string().trim().min(2, "Name is required.").max(80),
  description: z
    .string()
    .trim()
    .min(10, "Write at least a short description.")
    .max(600),
  ingredients: z.string().trim().max(400).or(z.literal("")),
  price: money.refine((value) => value > 0, "Price must be greater than zero."),
  image: z.string().trim().max(300).or(z.literal("")),
  spiceLevel: z.enum(["MILD", "MEDIUM", "HOT", "EXTRA_HOT"]),
  vegetarian: z.boolean(),
  available: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
};

export const menuItemSchema = z.object({
  ...menuItemFields,
  ingredients: menuItemFields.ingredients.optional(),
  image: menuItemFields.image.optional(),
  spiceLevel: menuItemFields.spiceLevel.default("MEDIUM"),
  vegetarian: menuItemFields.vegetarian.default(false),
  available: menuItemFields.available.default(true),
  featured: menuItemFields.featured.default(false),
  sortOrder: menuItemFields.sortOrder.default(0),
});

export const menuItemUpdateSchema = z.object(menuItemFields).partial();

// --------------------------------------------------------------------- coupon

const couponFields = {
  code: z
    .string()
    .trim()
    .min(3, "Codes are at least 3 characters.")
    .max(24)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only.")
    .transform((value) => value.toUpperCase()),
  description: z.string().trim().max(160).or(z.literal("")),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: money.refine((value) => value > 0, "Value must be greater than zero."),
  minimumOrder: money,
  maxDiscount: z.union([money, z.literal("")]).nullable(),
  expiresAt: z.string().nullable(),
  usageLimit: z
    .union([z.coerce.number().int().min(1).max(100000), z.literal("")])
    .nullable(),
  active: z.boolean(),
};

const couponCreateObject = z.object({
  ...couponFields,
  description: couponFields.description.optional(),
  minimumOrder: couponFields.minimumOrder.default(0),
  maxDiscount: couponFields.maxDiscount.optional(),
  expiresAt: couponFields.expiresAt.optional(),
  usageLimit: couponFields.usageLimit.optional(),
  active: couponFields.active.default(true),
});

const percentageCap = (data: { type?: string; value?: number }) =>
  data.type !== "PERCENTAGE" || data.value === undefined || data.value <= 100;

const percentageMessage = {
  message: "A percentage discount cannot exceed 100%.",
  path: ["value"],
};

export const couponSchema = couponCreateObject.refine(percentageCap, percentageMessage);

export const couponUpdateSchema = z
  .object(couponFields)
  .partial()
  .refine(percentageCap, percentageMessage);

// ------------------------------------------------------------------- location

const locationFields = {
  name: z.string().trim().min(2, "Name is required.").max(80),
  address: z.string().trim().min(5, "Address is required.").max(200),
  city: z.string().trim().min(2, "City is required.").max(80),
  phone: z.string().trim().min(7, "Phone is required.").max(20),
  email: z.string().trim().email("Enter a valid email.").or(z.literal("")),
  openingHours: z.string().trim().min(3, "Opening hours are required.").max(160),
  latitude: z.union([z.coerce.number().min(-90).max(90), z.literal("")]).nullable(),
  longitude: z.union([z.coerce.number().min(-180).max(180), z.literal("")]).nullable(),
  image: z.string().trim().max(300).or(z.literal("")),
  active: z.boolean(),
};

export const locationSchema = z.object({
  ...locationFields,
  email: locationFields.email.optional(),
  latitude: locationFields.latitude.optional(),
  longitude: locationFields.longitude.optional(),
  image: locationFields.image.optional(),
  active: locationFields.active.default(true),
});

export const locationUpdateSchema = z.object(locationFields).partial();

// -------------------------------------------------------------------- status

export const reservationStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
});

export const reviewStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "HIDDEN"]),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});
