"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea, Input } from "@/components/ui/field";

const inputTone =
  "bg-cream-100/5 border-cream-100/15 text-cream-100 placeholder:text-cream-100/30 focus:border-saffron-400/60";

export function ReviewForm({
  orderId,
  items,
}: {
  orderId: string;
  items: { menuItemId: string; name: string }[];
}) {
  const router = useRouter();
  const [rating, setRating] = React.useState(5);
  const [menuItemId, setMenuItemId] = React.useState(items[0]?.menuItemId ?? "");
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        menuItemId,
        rating,
        title: String(form.get("title") ?? ""),
        comment: String(form.get("comment") ?? ""),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setLoading(false);

    if (!response.ok) {
      setErrors(data.details ?? {});
      toast.error(data.error ?? "Couldn't submit your review");
      return;
    }

    formElement.reset();
    toast.success("Thank you — your review is awaiting approval");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4" noValidate>
      <Field label="Which dish?" htmlFor="review-item">
        <Select
          id="review-item"
          value={menuItemId}
          onChange={(event) => setMenuItemId(event.target.value)}
          className={inputTone}
        >
          {items.map((item) => (
            <option key={item.menuItemId} value={item.menuItemId}>
              {item.name}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset>
        <legend className="mb-1.5 block text-xs font-medium tracking-wide text-cream-100/80">
          Rating
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
              aria-pressed={rating === value}
              className="rounded p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  value <= rating
                    ? "fill-saffron-400 text-saffron-400"
                    : "text-cream-100/25",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Title" htmlFor="review-title" error={errors.title} hint="Optional.">
        <Input
          id="review-title"
          name="title"
          maxLength={80}
          placeholder="Worth every rupee"
          className={inputTone}
        />
      </Field>

      <Field label="Your review" htmlFor="review-comment" error={errors.comment}>
        <Textarea
          id="review-comment"
          name="comment"
          required
          minLength={10}
          maxLength={1000}
          placeholder="Tell us what you thought…"
          error={errors.comment}
          className={inputTone}
        />
      </Field>

      <Button type="submit" loading={loading}>
        Submit review
      </Button>
    </form>
  );
}
