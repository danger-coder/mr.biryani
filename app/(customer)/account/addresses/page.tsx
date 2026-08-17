import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/guards";
import { AddressManager } from "@/components/customer/address-manager";

export const metadata: Metadata = { title: "Your addresses" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return <AddressManager addresses={addresses} />;
}
