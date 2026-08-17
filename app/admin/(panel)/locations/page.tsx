import type { Metadata } from "next";
import { db } from "@/lib/db";
import { LocationManager, type AdminLocation } from "@/components/admin/location-manager";

export const metadata: Metadata = { title: "Locations" };
export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const locations = await db.restaurantLocation.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { orders: true, reservations: true } } },
  });

  const rows: AdminLocation[] = locations.map((location) => ({
    id: location.id,
    name: location.name,
    address: location.address,
    city: location.city,
    phone: location.phone,
    email: location.email,
    openingHours: location.openingHours,
    latitude: location.latitude,
    longitude: location.longitude,
    image: location.image,
    active: location.active,
    linkedRecords: location._count.orders + location._count.reservations,
  }));

  return <LocationManager locations={rows} />;
}
