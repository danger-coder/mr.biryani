/**
 * Development seed. Run with `npm run db:seed` (or `npm run db:reset` to wipe
 * and re-seed). Credentials here are development-only placeholders — never
 * point this at a production database.
 */
import {
  PrismaClient,
  type OrderStatus,
  type Prisma,
  type ReservationStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEV_PASSWORD = "password123";
const ADMIN_PASSWORD = "admin12345";

type SeedItem = {
  name: string;
  description: string;
  ingredients: string;
  price: number;
  spiceLevel: "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT";
  vegetarian?: boolean;
  featured?: boolean;
  available?: boolean;
};

const CATALOGUE: { category: string; description: string; items: SeedItem[] }[] = [
  {
    category: "Biryani",
    description:
      "Long-grain sella basmati, sealed under dough and finished on slow dum. The reason people come back.",
    items: [
      {
        name: "Chicken Dum Biryani",
        description:
          "Our signature. Marinated overnight in yoghurt and green chilli, layered with saffron rice and sealed under dough for three hours of slow dum.",
        ingredients: "Chicken, sella basmati, saffron, yoghurt, fried onion, mint, whole spices, ghee",
        price: 399,
        spiceLevel: "MEDIUM",
        featured: true,
      },
      {
        name: "Mutton Dum Biryani",
        description:
          "Bone-in goat shoulder cooked until it gives way to a spoon, with rice that has drunk every bit of the stock.",
        ingredients: "Goat shoulder, sella basmati, saffron, brown onion, yoghurt, garam masala, ghee",
        price: 549,
        spiceLevel: "HOT",
        featured: true,
      },
      {
        name: "Hyderabadi Kacchi Biryani",
        description:
          "The purist's version — raw marinated meat and rice cooked together in one pot, timed to the minute.",
        ingredients: "Goat, sella basmati, papaya marinade, saffron, mint, fried onion",
        price: 629,
        spiceLevel: "HOT",
        featured: true,
      },
      {
        name: "Prawn Biryani",
        description: "Tiger prawns folded in at the last moment so they stay sweet and just-set.",
        ingredients: "Tiger prawns, sella basmati, coconut, curry leaf, green chilli, saffron",
        price: 679,
        spiceLevel: "MEDIUM",
      },
      {
        name: "Egg Biryani",
        description: "Halved farm eggs, browned in ghee and spice, tucked through saffron rice.",
        ingredients: "Farm eggs, sella basmati, fried onion, saffron, whole spices",
        price: 289,
        spiceLevel: "MILD",
      },
      {
        name: "Vegetable Dum Biryani",
        description:
          "Not an afterthought — root vegetables and paneer roasted first, then layered and dum-cooked like the rest.",
        ingredients: "Seasonal vegetables, paneer, sella basmati, saffron, mint, cashew",
        price: 329,
        spiceLevel: "MILD",
        vegetarian: true,
        featured: true,
      },
      {
        name: "Lucknowi Chicken Biryani",
        description: "The gentler north-Indian style: fragrant, delicate, built on kewra and rose rather than heat.",
        ingredients: "Chicken, sella basmati, kewra, rose water, mace, cardamom",
        price: 449,
        spiceLevel: "MILD",
      },
      {
        name: "Family Biryani Platter",
        description: "A full handi for four, with raita, salan and salad. Order an hour ahead.",
        ingredients: "Choice of chicken or mutton, sella basmati, raita, mirchi ka salan, kachumber",
        price: 1499,
        spiceLevel: "MEDIUM",
      },
    ],
  },
  {
    category: "Starters",
    description: "Charcoal, smoke and the first thing to reach the table.",
    items: [
      {
        name: "Chicken Seekh Kebab",
        description: "Hand-minced thigh with green chilli and coriander, pressed onto skewers over live coal.",
        ingredients: "Chicken thigh, green chilli, coriander, ginger, garam masala",
        price: 349,
        spiceLevel: "MEDIUM",
        featured: true,
      },
      {
        name: "Mutton Galouti Kebab",
        description: "So soft it barely survives the journey from pan to plate. Served on warm ulta tawa paratha.",
        ingredients: "Minced goat, raw papaya, saffron, kewra, sixteen-spice blend",
        price: 449,
        spiceLevel: "MILD",
      },
      {
        name: "Tandoori Chicken (Half)",
        description: "Twelve-hour yoghurt and Kashmiri chilli marinade, blistered in the tandoor.",
        ingredients: "Chicken, yoghurt, Kashmiri chilli, mustard oil, lemon",
        price: 429,
        spiceLevel: "HOT",
      },
      {
        name: "Paneer Tikka",
        description: "Thick-cut fresh paneer, charred at the edges, still soft in the middle.",
        ingredients: "Paneer, bell pepper, yoghurt, carom seed, chaat masala",
        price: 329,
        spiceLevel: "MILD",
        vegetarian: true,
      },
      {
        name: "Chilli Garlic Prawns",
        description: "Fast, hot and glossy — wok-tossed with dried red chilli and a lot of garlic.",
        ingredients: "Prawns, dried red chilli, garlic, spring onion, soy",
        price: 499,
        spiceLevel: "EXTRA_HOT",
      },
      {
        name: "Onion Bhaji",
        description: "Shredded onion, gram flour, a hard fry. The oldest trick and still the best one.",
        ingredients: "Onion, gram flour, carom seed, green chilli",
        price: 199,
        spiceLevel: "MILD",
        vegetarian: true,
      },
    ],
  },
  {
    category: "Main Course",
    description: "Slow curries built on bone stock, cream and patience.",
    items: [
      {
        name: "Butter Chicken",
        description: "Tandoori chicken finished in a tomato and cashew gravy, mounted with cold butter off the heat.",
        ingredients: "Chicken, tomato, cashew, cream, fenugreek, butter",
        price: 449,
        spiceLevel: "MILD",
        featured: true,
      },
      {
        name: "Rogan Josh",
        description: "Kashmiri goat curry — deep red from chilli, not from tomato.",
        ingredients: "Goat, Kashmiri chilli, fennel, ginger powder, yoghurt",
        price: 549,
        spiceLevel: "HOT",
      },
      {
        name: "Dal Makhani",
        description: "Black urad simmered overnight. Nothing about it is quick.",
        ingredients: "Black urad, kidney bean, tomato, cream, butter",
        price: 299,
        spiceLevel: "MILD",
        vegetarian: true,
        featured: true,
      },
      {
        name: "Palak Paneer",
        description: "Fresh spinach blanched and blitzed to stay green, with paneer cubed in at the end.",
        ingredients: "Spinach, paneer, garlic, green chilli, cream",
        price: 319,
        spiceLevel: "MILD",
        vegetarian: true,
      },
      {
        name: "Chicken Karahi",
        description: "Cooked hard and fast in a black iron karahi, finished with crushed coriander seed.",
        ingredients: "Chicken, tomato, green chilli, ginger, coriander seed",
        price: 479,
        spiceLevel: "HOT",
      },
      {
        name: "Fish Curry",
        description: "Coastal-style, soured with tamarind and loosened with coconut milk.",
        ingredients: "Sea fish, tamarind, coconut milk, curry leaf, mustard seed",
        price: 529,
        spiceLevel: "MEDIUM",
        available: false,
      },
    ],
  },
  {
    category: "Breads",
    description: "Straight from the tandoor to your table.",
    items: [
      {
        name: "Garlic Naan",
        description: "Blistered, brushed with garlic butter and coriander.",
        ingredients: "Refined flour, yoghurt, garlic, butter, coriander",
        price: 149,
        spiceLevel: "MILD",
        vegetarian: true,
        featured: true,
      },
      {
        name: "Butter Naan",
        description: "Plain, pillowy, generously buttered.",
        ingredients: "Refined flour, yoghurt, butter",
        price: 129,
        spiceLevel: "MILD",
        vegetarian: true,
      },
      {
        name: "Laccha Paratha",
        description: "Layered and flaked open at the pass so you can see every fold.",
        ingredients: "Wholewheat flour, ghee",
        price: 139,
        spiceLevel: "MILD",
        vegetarian: true,
      },
      {
        name: "Tandoori Roti",
        description: "Wholewheat, thin, charred in spots.",
        ingredients: "Wholewheat flour",
        price: 79,
        spiceLevel: "MILD",
        vegetarian: true,
      },
    ],
  },
  {
    category: "Rice",
    description: "For sharing, or for soaking up what's left in the bowl.",
    items: [
      {
        name: "Jeera Rice",
        description: "Basmati tempered with cumin in ghee.",
        ingredients: "Basmati, cumin, ghee",
        price: 199,
        spiceLevel: "MILD",
        vegetarian: true,
      },
      {
        name: "Saffron Pulao",
        description: "Kashmiri saffron, whole spice, fried onion.",
        ingredients: "Basmati, saffron, fried onion, whole spices",
        price: 249,
        spiceLevel: "MILD",
        vegetarian: true,
      },
      {
        name: "Steamed Basmati",
        description: "Plain, long-grain, perfectly separate.",
        ingredients: "Basmati",
        price: 149,
        spiceLevel: "MILD",
        vegetarian: true,
      },
    ],
  },
  {
    category: "Drinks",
    description: "Cool the heat down.",
    items: [
      {
        name: "Salted Lassi",
        description: "Thick churned yoghurt with roasted cumin. The correct answer to a hot biryani.",
        ingredients: "Yoghurt, roasted cumin, black salt",
        price: 149,
        spiceLevel: "MILD",
        vegetarian: true,
      },
      {
        name: "Mango Lassi",
        description: "Alphonso pulp, yoghurt, a pinch of cardamom.",
        ingredients: "Alphonso mango, yoghurt, cardamom",
        price: 179,
        spiceLevel: "MILD",
        vegetarian: true,
        featured: true,
      },
      {
        name: "Masala Chai",
        description: "Boiled long with ginger and green cardamom.",
        ingredients: "Assam tea, milk, ginger, cardamom",
        price: 99,
        spiceLevel: "MILD",
        vegetarian: true,
      },
      {
        name: "Fresh Lime Soda",
        description: "Sweet, salt or both.",
        ingredients: "Lime, soda, black salt",
        price: 119,
        spiceLevel: "MILD",
        vegetarian: true,
      },
    ],
  },
  {
    category: "Desserts",
    description: "The last course, and worth saving room for.",
    items: [
      {
        name: "Shahi Tukda",
        description: "Ghee-fried bread soaked in saffron rabri, finished with pistachio.",
        ingredients: "Bread, ghee, milk, saffron, pistachio, sugar",
        price: 229,
        spiceLevel: "MILD",
        vegetarian: true,
        featured: true,
      },
      {
        name: "Gulab Jamun",
        description: "Two warm, in cardamom syrup.",
        ingredients: "Khoya, refined flour, cardamom, rose water, sugar",
        price: 169,
        spiceLevel: "MILD",
        vegetarian: true,
      },
      {
        name: "Kesar Phirni",
        description: "Ground rice set in saffron milk, served cold in clay.",
        ingredients: "Rice, milk, saffron, cardamom, almond",
        price: 199,
        spiceLevel: "MILD",
        vegetarian: true,
      },
    ],
  },
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function daysAgo(days: number, hour = 12): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("→ Clearing existing data…");
  // Order matters: children before parents.
  await db.notification.deleteMany();
  await db.review.deleteMany();
  await db.orderEvent.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.favorite.deleteMany();
  await db.reservation.deleteMany();
  await db.menuItem.deleteMany();
  await db.category.deleteMany();
  await db.coupon.deleteMany();
  await db.restaurantLocation.deleteMany();
  await db.address.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.user.deleteMany();
  await db.siteSetting.deleteMany();
  await db.$executeRawUnsafe("ALTER SEQUENCE order_number_seq RESTART WITH 1024");
  // The seeded orders below are numbered from this same starting point without
  // going through the sequence, so the sequence is fast-forwarded past them at
  // the end of the seed (see "Aligning the order-number sequence").

  console.log("→ Users…");
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const customerHash = await bcrypt.hash(DEV_PASSWORD, 12);

  const admin = await db.user.create({
    data: {
      name: "Aarav Khan",
      email: "admin@mrbiryani.com",
      phone: "+977 9801000001",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  const customerSeed = [
    { name: "Rahul Sharma", email: "rahul@example.com", phone: "+977 9812345678", city: "Kathmandu" },
    { name: "Priya Thapa", email: "priya@example.com", phone: "+977 9843211234", city: "Lalitpur" },
    { name: "Sameer Gurung", email: "sameer@example.com", phone: "+977 9807654321", city: "Bhaktapur" },
    { name: "Anjali Rai", email: "anjali@example.com", phone: "+977 9861122334", city: "Kathmandu" },
    { name: "Bikash Shrestha", email: "bikash@example.com", phone: "+977 9855667788", city: "Pokhara" },
    { name: "Nisha Karki", email: "nisha@example.com", phone: "+977 9819988776", city: "Kathmandu" },
  ];

  const customers = [];
  for (const [index, seed] of customerSeed.entries()) {
    const user = await db.user.create({
      data: {
        name: seed.name,
        email: seed.email,
        phone: seed.phone,
        passwordHash: customerHash,
        role: "CUSTOMER",
        createdAt: daysAgo(60 - index * 8),
        addresses: {
          create: {
            label: "Home",
            address: `${10 + index * 7} Durbar Marg, Ward ${index + 2}`,
            city: seed.city,
            postalCode: `4460${index}`,
            isDefault: true,
          },
        },
      },
    });
    customers.push(user);
  }

  console.log("→ Locations…");
  const locations = await Promise.all([
    db.restaurantLocation.create({
      data: {
        name: "Mr. Biryani — Durbar Marg",
        slug: "durbar-marg",
        address: "142 Durbar Marg, opposite the Garden of Dreams",
        city: "Kathmandu",
        phone: "+977 9801000010",
        email: "durbarmarg@mrbiryani.com",
        openingHours: "Mon–Sun · 11:00 – 23:00",
        latitude: 27.7128,
        longitude: 85.3167,
        image: "/images/locations/durbar-marg.webp",
      },
    }),
    db.restaurantLocation.create({
      data: {
        name: "Mr. Biryani — Jhamsikhel",
        slug: "jhamsikhel",
        address: "22 Jhamsikhel Road, Sanepa",
        city: "Lalitpur",
        phone: "+977 9801000011",
        email: "jhamsikhel@mrbiryani.com",
        openingHours: "Mon–Sun · 11:30 – 22:30",
        latitude: 27.6795,
        longitude: 85.3095,
        image: "/images/locations/jhamsikhel.webp",
      },
    }),
    db.restaurantLocation.create({
      data: {
        name: "Mr. Biryani — Lakeside",
        slug: "lakeside",
        address: "8 Lakeside Road, Baidam",
        city: "Pokhara",
        phone: "+977 9801000012",
        email: "lakeside@mrbiryani.com",
        openingHours: "Mon–Sun · 12:00 – 23:00",
        latitude: 28.2096,
        longitude: 83.9583,
        image: "/images/locations/lakeside.webp",
      },
    }),
  ]);

  console.log("→ Categories & menu…");
  const allItems: { id: string; name: string; price: number; image: string | null }[] = [];

  for (const [index, group] of CATALOGUE.entries()) {
    const slug = slugify(group.category);
    const category = await db.category.create({
      data: {
        name: group.category,
        slug,
        description: group.description,
        image: `/images/categories/${slug}.webp`,
        sortOrder: index,
      },
    });

    for (const [itemIndex, item] of group.items.entries()) {
      const itemSlug = slugify(item.name);
      const created = await db.menuItem.create({
        data: {
          categoryId: category.id,
          name: item.name,
          slug: itemSlug,
          description: item.description,
          ingredients: item.ingredients,
          price: item.price,
          image: `/images/menu/${itemSlug}.webp`,
          spiceLevel: item.spiceLevel,
          vegetarian: item.vegetarian ?? false,
          available: item.available ?? true,
          featured: item.featured ?? false,
          sortOrder: itemIndex,
        },
      });
      allItems.push({
        id: created.id,
        name: created.name,
        price: Number(created.price),
        image: created.image,
      });
    }
  }

  console.log("→ Coupons…");
  await db.coupon.createMany({
    data: [
      {
        code: "BIRYANI10",
        description: "10% off any order over Rs. 800",
        type: "PERCENTAGE",
        value: 10,
        minimumOrder: 800,
        maxDiscount: 300,
        usageLimit: 500,
        usedCount: 41,
      },
      {
        code: "WELCOME200",
        description: "Rs. 200 off your first order over Rs. 1000",
        type: "FIXED",
        value: 200,
        minimumOrder: 1000,
        usageLimit: 1000,
        usedCount: 128,
      },
      {
        code: "DUM25",
        description: "25% off — weekend special",
        type: "PERCENTAGE",
        value: 25,
        minimumOrder: 1500,
        maxDiscount: 600,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        usageLimit: 200,
        usedCount: 12,
      },
      {
        code: "EXPIRED50",
        description: "Lapsed launch offer",
        type: "FIXED",
        value: 50,
        minimumOrder: 0,
        expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        active: false,
      },
    ],
  });

  console.log("→ Orders…");
  const statuses: OrderStatus[] = [
    "DELIVERED",
    "DELIVERED",
    "DELIVERED",
    "DELIVERED",
    "OUT_FOR_DELIVERY",
    "PREPARING",
    "CONFIRMED",
    "PENDING",
    "READY",
    "CANCELLED",
  ];

  let orderSeq = 1024;
  const deliveredOrders: { id: string; userId: string; itemIds: string[] }[] = [];

  for (let i = 0; i < 46; i++) {
    const customer = pick(customers);
    const status = i < 8 ? statuses[i % statuses.length] : pick(statuses);
    const orderType = Math.random() > 0.25 ? "DELIVERY" : "PICKUP";
    const lineCount = 1 + Math.floor(Math.random() * 3);

    const chosen = new Map<string, number>();
    for (let l = 0; l < lineCount; l++) {
      const item = pick(allItems);
      chosen.set(item.id, (chosen.get(item.id) ?? 0) + 1 + Math.floor(Math.random() * 2));
    }

    const lines = [...chosen.entries()].map(([id, quantity]) => {
      const item = allItems.find((candidate) => candidate.id === id)!;
      return {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        subtotal: item.price * quantity,
        image: item.image,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
    const deliveryFee = orderType === "PICKUP" || subtotal >= 2500 ? 0 : 100;
    const useCoupon = Math.random() > 0.7 && subtotal >= 1000;
    const discount = useCoupon ? 200 : 0;
    const total = Math.max(subtotal + deliveryFee - discount, 0);
    const createdAt = daysAgo(Math.floor(Math.random() * 29), 10 + Math.floor(Math.random() * 11));
    const address = `${12 + i} Durbar Marg, Ward ${(i % 9) + 2}`;

    const order = await db.order.create({
      data: {
        orderNumber: `MB${orderSeq++}`,
        userId: customer.id,
        locationId: pick(locations).id,
        customerName: customer.name,
        customerPhone: customer.phone!,
        customerEmail: customer.email,
        deliveryAddress: orderType === "DELIVERY" ? address : null,
        city: orderType === "DELIVERY" ? "Kathmandu" : null,
        orderType,
        status,
        paymentStatus: status === "DELIVERED" ? "PAID" : status === "CANCELLED" ? "FAILED" : "UNPAID",
        paymentMethod: Math.random() > 0.5 ? "CASH_ON_DELIVERY" : "ONLINE",
        couponCode: useCoupon ? "WELCOME200" : null,
        subtotal,
        deliveryFee,
        discount,
        total,
        notes: Math.random() > 0.8 ? "Please ring the bell twice. Extra raita if possible." : null,
        createdAt,
        updatedAt: createdAt,
        items: { create: lines },
      },
    });

    // Build a plausible event history up to the current status.
    const fullTrack: OrderStatus[] =
      status === "CANCELLED"
        ? ["PENDING", "CONFIRMED", "CANCELLED"]
        : orderType === "PICKUP"
          ? ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"]
          : ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

    const upto = fullTrack.indexOf(status);
    const history = upto === -1 ? ["PENDING" as OrderStatus] : fullTrack.slice(0, upto + 1);

    await db.orderEvent.createMany({
      data: history.map((entry, index) => ({
        orderId: order.id,
        status: entry,
        note: index === 0 ? "Order placed." : null,
        createdAt: new Date(createdAt.getTime() + index * 12 * 60 * 1000),
      })),
    });

    if (status === "DELIVERED") {
      deliveredOrders.push({
        id: order.id,
        userId: customer.id,
        itemIds: lines.map((line) => line.menuItemId),
      });
    }
  }

  console.log("→ Reservations…");
  const reservationStatuses: ReservationStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
  const reservationRows: Prisma.ReservationCreateManyInput[] = [];
  for (let i = 0; i < 22; i++) {
    const customer = pick(customers);
    const offset = Math.floor(Math.random() * 20) - 8;
    const date = new Date();
    date.setDate(date.getDate() + offset);
    date.setHours(0, 0, 0, 0);
    reservationRows.push({
      userId: Math.random() > 0.3 ? customer.id : null,
      locationId: pick(locations).id,
      name: customer.name,
      phone: customer.phone!,
      email: customer.email,
      date,
      time: pick(["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"]),
      guests: 2 + Math.floor(Math.random() * 8),
      status: offset < 0 ? pick<ReservationStatus>(["COMPLETED", "CANCELLED"]) : pick(reservationStatuses),
      notes: Math.random() > 0.75 ? "Window table if possible — it's a birthday." : null,
      createdAt: daysAgo(Math.max(1, Math.abs(offset))),
    });
  }
  await db.reservation.createMany({ data: reservationRows });

  console.log("→ Reviews…");
  const reviewTexts = [
    "The mutton falls apart the second you touch it. Best biryani I've had in Kathmandu, and I've tried most of them.",
    "Ordered for eight people and every single portion arrived hot. The raita alone is worth the trip.",
    "Genuinely fragrant — you can smell the saffron before the box is open. Will order again.",
    "Delivery was quick and the packaging kept everything intact. Flavour is properly authentic.",
    "The vegetable dum surprised me. Not a compromise dish at all.",
    "Portion sizes are generous and the spice level was exactly as described.",
  ];

  for (const [index, delivered] of deliveredOrders.slice(0, 12).entries()) {
    await db.review.create({
      data: {
        userId: delivered.userId,
        orderId: delivered.id,
        menuItemId: delivered.itemIds[0] ?? null,
        rating: index % 7 === 0 ? 4 : 5,
        title: index % 3 === 0 ? "Worth every rupee" : null,
        comment: reviewTexts[index % reviewTexts.length],
        status: index < 8 ? "APPROVED" : "PENDING",
        createdAt: daysAgo(index + 1),
      },
    });
  }

  console.log("→ Favourites & notifications…");
  for (const customer of customers.slice(0, 4)) {
    const favourites = [pick(allItems), pick(allItems)];
    for (const favourite of favourites) {
      await db.favorite.upsert({
        where: { userId_menuItemId: { userId: customer.id, menuItemId: favourite.id } },
        create: { userId: customer.id, menuItemId: favourite.id },
        update: {},
      });
    }
  }

  await db.notification.createMany({
    data: [
      {
        userId: customers[0].id,
        type: "ORDER",
        title: "Order Confirmed",
        message: "Your order #MB1024 has been confirmed.",
        link: "/account/orders",
        read: false,
      },
      {
        userId: customers[0].id,
        type: "PROMOTION",
        title: "25% off this weekend",
        message: "Use DUM25 on orders over Rs. 1,500.",
        link: "/menu",
        read: false,
      },
      {
        userId: customers[1].id,
        type: "RESERVATION",
        title: "Reservation Confirmed",
        message: "Your table for 4 is confirmed. We look forward to seeing you.",
        link: "/account/reservations",
      },
      {
        forAdmin: true,
        type: "ORDER",
        title: "New Order",
        message: "A new order #MB1041 has been placed.",
        link: "/admin/orders",
        read: false,
      },
      {
        forAdmin: true,
        type: "RESERVATION",
        title: "New Reservation",
        message: "A table for 6 has been requested for Friday at 20:00.",
        link: "/admin/reservations",
        read: false,
      },
      {
        forAdmin: true,
        type: "REVIEW",
        title: "Review Awaiting Approval",
        message: "A 5-star review is waiting for moderation.",
        link: "/admin/reviews",
        read: false,
      },
    ],
  });

  console.log("→ Settings…");
  await db.siteSetting.createMany({
    data: [
      { key: "restaurantName", value: "Mr. Biryani" },
      { key: "tagline", value: "Biryani Made With Passion." },
      { key: "supportEmail", value: "hello@mrbiryani.com" },
      { key: "supportPhone", value: "+977 9801000010" },
      { key: "deliveryFee", value: "100" },
      { key: "freeDeliveryOver", value: "2500" },
      { key: "minimumOrder", value: "300" },
      { key: "orderingEnabled", value: "true" },
      { key: "reservationsEnabled", value: "true" },
    ],
  });

  // Aligning the order-number sequence: seeded orders were numbered by hand, so
  // the sequence must be moved past them or the first real order would collide
  // on the unique orderNumber constraint.
  await db.$executeRawUnsafe(
    `ALTER SEQUENCE order_number_seq RESTART WITH ${orderSeq}`,
  );

  const orderCount = await db.order.count();
  const itemCount = await db.menuItem.count();

  console.log("\n✓ Seed complete");
  console.log(`  ${itemCount} menu items across ${CATALOGUE.length} categories`);
  console.log(`  ${orderCount} orders · ${reservationRows.length} reservations · ${customers.length} customers`);
  console.log("\n  Admin    admin@mrbiryani.com / " + ADMIN_PASSWORD);
  console.log("  Customer rahul@example.com  / " + DEV_PASSWORD);
  void admin;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
