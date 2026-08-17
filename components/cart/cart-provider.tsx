"use client";

import * as React from "react";
import { toast } from "sonner";
import * as store from "@/lib/cart-store";
import type { CartLine } from "@/lib/cart-store";

export type { CartLine };

type CartState = {
  lines: CartLine[];
  /** False during the very first render, before localStorage has been read. */
  ready: boolean;
  count: number;
  /** Optimistic estimate for the header badge only — never used for charging. */
  estimatedSubtotal: number;
  couponCode: string | null;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  remove: (menuItemId: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
};

const CartContext = React.createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Reading the cart through an external store keeps SSR and the client in step
  // without a hydration effect. See lib/cart-store.ts.
  const snapshot = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const add = React.useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      store.addLine(line, quantity);
      toast.success("Added to cart", { description: line.name });
    },
    [],
  );

  const value = React.useMemo<CartState>(() => {
    const count = snapshot.lines.reduce((sum, line) => sum + line.quantity, 0);
    const estimatedSubtotal = snapshot.lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );

    return {
      lines: snapshot.lines,
      ready: snapshot.ready,
      couponCode: snapshot.couponCode,
      count,
      estimatedSubtotal,
      add,
      setQuantity: store.setLineQuantity,
      remove: store.removeLine,
      clear: store.clearCart,
      setCoupon: store.setCouponCode,
    };
  }, [snapshot, add]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const context = React.useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>.");
  return context;
}
