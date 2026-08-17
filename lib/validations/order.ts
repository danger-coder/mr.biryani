import { z } from "zod";
import { phoneSchema } from "@/lib/validations/auth";

export const cartItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
});

export const cartSchema = z.array(cartItemSchema).max(60);

export const quoteSchema = z.object({
  items: cartSchema,
  orderType: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
  couponCode: z.string().trim().max(40).optional().nullable(),
});

export const checkoutSchema = z.object({
  items: cartSchema.min(1, "Your cart is empty."),
  customerName: z.string().trim().min(2, "Please enter your name.").max(80),
  customerPhone: phoneSchema,
  customerEmail: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  orderType: z.enum(["DELIVERY", "PICKUP"]),
  deliveryAddress: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "ONLINE", "CARD"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export const paymentStatusSchema = z.object({
  paymentStatus: z.enum(["UNPAID", "PAID", "REFUNDED", "FAILED"]),
});

export const reservationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  phone: phoneSchema,
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  guests: z.number().int().min(1, "At least 1 guest.").max(30, "For parties over 30, call us."),
  locationId: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(400).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  comment: z.string().trim().min(10, "Tell us a little more (10+ characters).").max(1000),
  menuItemId: z.string().optional().or(z.literal("")),
  orderId: z.string().optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReservationInput = z.infer<typeof reservationSchema>;
