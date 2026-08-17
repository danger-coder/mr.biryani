export type CartLine = {
  menuItemId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
};

export type CartSnapshot = {
  lines: CartLine[];
  couponCode: string | null;
  ready: boolean;
};

/**
 * The cart as a tiny external store, read through `useSyncExternalStore`.
 *
 * Doing it this way (rather than state + a hydration effect) means React reads
 * localStorage at exactly the right moment: the server snapshot is empty, the
 * client snapshot is the persisted cart, and no post-mount setState is needed.
 * Cross-tab updates fall out for free — the `storage` event just notifies the
 * same subscribers.
 *
 * The cached name/price on each line are for instant rendering only. Every
 * figure the customer is actually charged is recomputed server-side by
 * lib/pricing.
 */

const STORAGE_KEY = "mb.cart.v1";
const MAX_QTY = 50;

const SERVER_SNAPSHOT: CartSnapshot = { lines: [], couponCode: null, ready: false };

let snapshot: CartSnapshot = SERVER_SNAPSHOT;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function read(): CartSnapshot {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], couponCode: null, ready: true };

    const parsed = JSON.parse(raw) as { lines?: unknown; couponCode?: unknown };
    const lines = Array.isArray(parsed.lines)
      ? (parsed.lines as CartLine[]).filter(
          (line) =>
            line &&
            typeof line.menuItemId === "string" &&
            typeof line.slug === "string" &&
            Number.isFinite(line.quantity) &&
            line.quantity > 0,
        )
      : [];

    return {
      lines,
      couponCode: typeof parsed.couponCode === "string" ? parsed.couponCode : null,
      ready: true,
    };
  } catch {
    // Corrupt or blocked storage — start clean rather than crash.
    return { lines: [], couponCode: null, ready: true };
  }
}

function persist(next: CartSnapshot) {
  snapshot = next;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lines: next.lines, couponCode: next.couponCode }),
    );
  } catch {
    // Storage full or unavailable; the cart still works for this session.
  }
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    snapshot = read();

    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY) return;
      snapshot = read();
      emit();
    });
  }

  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): CartSnapshot {
  return snapshot;
}

export function getServerSnapshot(): CartSnapshot {
  return SERVER_SNAPSHOT;
}

export function addLine(line: Omit<CartLine, "quantity">, quantity = 1) {
  const existing = snapshot.lines.find((entry) => entry.menuItemId === line.menuItemId);
  const lines = existing
    ? snapshot.lines.map((entry) =>
        entry.menuItemId === line.menuItemId
          ? { ...entry, ...line, quantity: Math.min(entry.quantity + quantity, MAX_QTY) }
          : entry,
      )
    : [...snapshot.lines, { ...line, quantity: Math.min(quantity, MAX_QTY) }];

  persist({ ...snapshot, lines });
}

export function setLineQuantity(menuItemId: string, quantity: number) {
  const lines =
    quantity <= 0
      ? snapshot.lines.filter((entry) => entry.menuItemId !== menuItemId)
      : snapshot.lines.map((entry) =>
          entry.menuItemId === menuItemId
            ? { ...entry, quantity: Math.min(quantity, MAX_QTY) }
            : entry,
        );

  persist({ ...snapshot, lines });
}

export function removeLine(menuItemId: string) {
  persist({
    ...snapshot,
    lines: snapshot.lines.filter((entry) => entry.menuItemId !== menuItemId),
  });
}

export function clearCart() {
  persist({ ...snapshot, lines: [], couponCode: null });
}

export function setCouponCode(code: string | null) {
  persist({ ...snapshot, couponCode: code });
}
