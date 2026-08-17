# Mr. Biryani

**Biryani Made With Passion.**

A full-stack restaurant platform: a cinematic customer-facing site with online
ordering, accounts and reservations, plus a data-dense admin panel for running
the restaurant. Both halves share one database and one backend.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS v4 (`@theme` tokens in `app/globals.css`) |
| Database | PostgreSQL 16 + Prisma 6 |
| Auth | Custom sessions — bcrypt hashing, HS256 JWT in an httpOnly cookie (`jose`) |
| Validation | Zod, on every request body |
| Motion | GSAP + ScrollTrigger, lazily imported |
| Charts | Recharts |
| Icons / toasts | lucide-react, sonner |

---

## Getting started

```bash
# 1. A PostgreSQL 16 instance (Docker is the quickest route)
docker run -d --name mrbiryani-pg \
  -e POSTGRES_USER=biryani -e POSTGRES_PASSWORD=biryani -e POSTGRES_DB=mrbiryani \
  -p 5433:5432 postgres:16-alpine

# 2. Configure the environment
cp .env.example .env      # then set DATABASE_URL and AUTH_SECRET
#    generate a secret with: openssl rand -hex 32

# 3. Install, migrate, seed
npm install
npx prisma migrate deploy
npm run db:seed

# 4. Run
npm run dev
```

### Development accounts

Created by the seed. Development-only credentials — never use them anywhere real.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@mrbiryani.com` | `admin12345` |
| Customer | `rahul@example.com` | `password123` |

Other seeded customers (`priya@`, `sameer@`, `anjali@`, `bikash@`, `nisha@`
`example.com`) share the customer password.

### Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:seed` | Seed development data |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm run db:studio` | Prisma Studio |

---

## Routes

### Customer — `app/(customer)`

`/` · `/menu` · `/menu/[slug]` · `/cart` · `/checkout` · `/checkout/success`
`/account` (profile, orders, order detail, addresses, reservations, favourites,
notifications) · `/reservations` · `/about` · `/story` · `/locations` · `/contact`

### Auth — `app/(auth)`

`/login` · `/register` · `/forgot-password` · `/reset-password`

### Admin — `app/admin`

`/admin/login` sits outside the guarded group. Everything else lives in
`app/admin/(panel)` behind `requireAdmin()`:

`/admin` (dashboard) · `/admin/orders` + detail · `/admin/menu` ·
`/admin/categories` · `/admin/customers` + detail · `/admin/reservations` ·
`/admin/coupons` · `/admin/locations` · `/admin/reviews` ·
`/admin/notifications` · `/admin/settings`

### API — `app/api`

```
auth/     register · login · logout · profile · forgot-password · reset-password
menu/     GET / · GET /[slug]          categories/  GET /
cart/     POST /quote                  orders/      GET,POST / · GET /[id]
reservations/ · reviews/ · favorites/ · addresses/ · notifications/

admin/    orders/[id] · menu(+[id]) · categories(+[id]) · coupons(+[id])
          locations(+[id]) · reservations/[id] · reviews/[id]
          settings · stats · search
```

---

## How it is put together

### Money is decided by the server, always

`lib/pricing/index.ts` is the single pricing authority. The client sends only
`{ menuItemId, quantity }` — never a price, a discount or a total. Line prices
come from the `MenuItem` table, the delivery fee and minimum come from
`SiteSetting`, and the coupon is re-validated against the `Coupon` row. The cart
preview and checkout call the same function, so the quoted total and the charged
total cannot drift apart.

`lib/orders/create.ts` runs that pricing again *inside* the order transaction,
then writes the order, its items, its first timeline event, the coupon usage
increment and both notifications atomically. Any failure rolls the whole thing
back — there is no such thing as a partial order.

### Historical orders never change

`OrderItem` stores `name` and `price` as a snapshot taken at purchase time. Put
Chicken Dum Biryani up from Rs. 399 to Rs. 449 and every past order still reads
Rs. 399, because nothing recomputes an old order from the current menu.

### Order status is a state machine

`lib/orders/status.ts` defines the legal transitions; the API enforces them and
the admin UI derives its buttons from the same table, so the interface cannot
offer a move the server would reject. Delivery and pickup have different tracks.
Cancelling releases the coupon use back. Every transition writes an `OrderEvent`
and notifies the customer.

### Security

- bcrypt (cost 12); password hashes are never selected into any response.
- Sessions are httpOnly + SameSite=Lax + Secure in production, signed HS256.
- `proxy.ts` rejects non-admins at the edge, and *every* admin page and route
  additionally calls `requireAdmin()` / `withAdmin()`, which re-reads the role
  from the database — a stale or tampered token grants nothing.
- Order queries are scoped by `userId` from the session, so another customer's
  id simply matches no rows.
- Origin checks on every state-changing request, on top of SameSite.
- Rate limits on login, registration, password reset, checkout and reservations.
- Reviews require a delivered order containing that dish, and are moderated
  before publication.

Run `npm run build && npm run lint` plus the flows in "Verifying" below after
changing anything in `lib/pricing`, `lib/orders` or `lib/auth`.

### Payments

Not implemented, and the app says so rather than pretending. With no provider
configured, "Online Payment" and "Card" orders are recorded `UNPAID` and settled
on delivery; the customer sees an explicit notice at checkout. To add a provider,
implement capture in `lib/payments.ts` and flip `paymentStatus` from its webhook —
nothing else needs to change.

### Cinematic assets

Every image and video path is declared once in `lib/assets.ts`. Files go in
`/public/images` and `/public/videos` — see `public/images/README.md` for the
full manifest of expected filenames. Until a file exists, `SmartImage` renders a
deterministic warm gradient derived from the item name, so the design reads
correctly before any asset is produced and upgrades the moment one is dropped in.
Videos never autoplay under `prefers-reduced-motion` and are lazily attached.

### Motion

`components/motion/reveal.tsx` wires GSAP + ScrollTrigger once for the whole
customer site. Add `data-reveal` (or `data-reveal-stagger` on a parent, or
`data-parallax`) to opt an element in. Only `transform` and `opacity` animate.
`prefers-reduced-motion` short-circuits the whole system and content renders
immediately.

---

## Verifying

```bash
npm run lint
npm run typecheck
npm run build
```

Then, with `npm run dev` running, the flows worth walking manually:

- **Customer** — browse and search the menu, filter by category and veg, open a
  dish, add to cart, apply `BIRYANI10` or `WELCOME200`, check out as guest and as
  a signed-in customer, watch the order in `/account/orders`, book a table,
  review a delivered order.
- **Admin** — move an order through every status, create/edit/disable a dish and
  a category, create a coupon and use it, confirm and complete a reservation,
  approve a review, change a setting and watch the storefront pick it up.
- **Security** — as a customer, try `/admin` and `/api/admin/*`; try to read
  another customer's order; post a checkout body with `"total": 1`.

---

## Extending it later

The schema and module boundaries were chosen so these can be added without
restructuring:

- **Multiple restaurants** — `Order` and `Reservation` already carry
  `locationId`; scope the admin queries by it and add a location switcher.
- **Drivers / kitchen display** — `OrderEvent` is already an append-only audit
  trail; add a `DRIVER` role to the `Role` enum and a assignment table.
- **Payments** — see `lib/payments.ts`.
- **Email / SMS / WhatsApp** — `lib/notifications/index.ts` is the single entry
  point; fan out from there without touching callers.
- **Loyalty, memberships** — hang off `User`; order history is already accurate
  and immutable.
- **Real-time** — `components/admin/live-orders.tsx` polls `/api/admin/stats`
  every 20s and pauses when the tab is hidden. Swap the poll for a socket and the
  component's contract stays the same.

Rate limiting currently keeps its state in memory (`lib/auth/rate-limit.ts`),
which is fine for a single node. Move the `Map` to Redis before running more than
one instance; the call sites do not change.
