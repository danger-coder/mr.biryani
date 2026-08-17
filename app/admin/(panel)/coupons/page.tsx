import type { Metadata } from "next";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { CouponManager, type AdminCoupon } from "@/components/admin/coupon-manager";

export const metadata: Metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });

  const rows: AdminCoupon[] = coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    type: coupon.type,
    value: toNumber(coupon.value),
    minimumOrder: toNumber(coupon.minimumOrder),
    maxDiscount: coupon.maxDiscount === null ? null : toNumber(coupon.maxDiscount),
    expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString() : null,
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    active: coupon.active,
  }));

  return <CouponManager coupons={rows} />;
}
