"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea, Toggle } from "@/components/ui/field";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  active: boolean;
  itemCount: number;
};

export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [order, setOrder] = React.useState(categories);
  const [editing, setEditing] = React.useState<AdminCategory | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<AdminCategory | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [active, setActive] = React.useState(true);

  const [lastCategories, setLastCategories] = React.useState(categories);

  // Resync when the server sends a fresh list (after a refresh).
  if (lastCategories !== categories) {
    setLastCategories(categories);
    setOrder(categories);
  }

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
    setErrors({});
  };

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      image: String(form.get("image") ?? ""),
      sortOrder: Number(form.get("sortOrder") ?? 0),
      active,
    };

    const response = await fetch(
      editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      setErrors(data.details ?? {});
      toast.error(data.error ?? "Couldn't save this category");
      return;
    }

    toast.success(editing ? "Category updated" : "Category created");
    closeForm();
    router.refresh();
  }

  /** Moves a category one position and persists the whole order. */
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;

    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next); // Optimistic — reverted below if the write fails.

    const response = await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((entry) => entry.id) }),
    });

    if (!response.ok) {
      setOrder(order);
      toast.error("Couldn't reorder categories");
      return;
    }
    toast.success("Order updated");
    router.refresh();
  }

  async function toggleActive(category: AdminCategory) {
    const response = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !category.active }),
    });
    if (!response.ok) {
      toast.error("Couldn't update this category");
      return;
    }
    toast.success(category.active ? "Category hidden" : "Category shown");
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    const response = await fetch(`/api/admin/categories/${deleting.id}`, {
      method: "DELETE",
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      toast.error(data.error ?? "Couldn't delete this category");
      setDeleting(null);
      return;
    }
    toast.success("Category deleted");
    setDeleting(null);
    router.refresh();
  }

  const open = creating || editing !== null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Categories</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            The order here is the order customers see on the menu.
          </p>
        </div>
        <Button
          onClick={() => {
            setActive(true);
            setErrors({});
            setCreating(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New category
        </Button>
      </div>

      <Card>
        {order.length === 0 ? (
          <EmptyState
            icon={<Tags className="h-6 w-6" />}
            title="No categories yet."
            message="Categories group the menu — create one before adding dishes."
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {order.map((category, index) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${category.name} up`}
                    className="flex h-5 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === order.length - 1}
                    aria-label={`Move ${category.name} down`}
                    className="flex h-5 w-6 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-25 disabled:hover:bg-transparent"
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>

                <div className="min-w-0 grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{category.name}</p>
                    <Badge tone={category.active ? "green" : "slate"}>
                      {category.active ? "Active" : "Hidden"}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {category.itemCount} {category.itemCount === 1 ? "dish" : "dishes"}
                    </span>
                  </div>
                  {category.description && (
                    <p className="mt-1 line-clamp-1 max-w-2xl text-xs text-slate-500">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleActive(category)}
                    className="rounded-lg px-2 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {category.active ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActive(category.active);
                      setErrors({});
                      setEditing(category);
                    }}
                    aria-label={`Edit ${category.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(category)}
                    aria-label={`Delete ${category.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={open}
        onClose={closeForm}
        title={editing ? `Edit ${editing.name}` : "New category"}
        footer={
          <>
            <Button variant="secondary" onClick={closeForm} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form="category-form" loading={busy}>
              {editing ? "Save changes" : "Create category"}
            </Button>
          </>
        }
      >
        <form id="category-form" onSubmit={save} className="space-y-4" noValidate>
          <Field label="Name" htmlFor="name" error={errors.name} required>
            <Input
              id="name"
              name="name"
              defaultValue={editing?.name ?? ""}
              required
              maxLength={60}
              error={errors.name}
            />
          </Field>

          <Field label="Description" htmlFor="description" error={errors.description}>
            <Textarea
              id="description"
              name="description"
              defaultValue={editing?.description ?? ""}
              maxLength={300}
              error={errors.description}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Image path"
              htmlFor="image"
              error={errors.image}
              hint="Defaults to /images/categories/<slug>.webp"
            >
              <Input
                id="image"
                name="image"
                defaultValue={editing?.image ?? ""}
                error={errors.image}
              />
            </Field>
            <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder}>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                max={999}
                defaultValue={editing?.sortOrder ?? categories.length}
              />
            </Field>
          </div>

          <Toggle
            label="Active"
            description="Hidden categories and their dishes disappear from the customer menu."
            checked={active}
            onChange={setActive}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${deleting?.name}?`}
        message={
          deleting && deleting.itemCount > 0
            ? `This category still holds ${deleting.itemCount} ${
                deleting.itemCount === 1 ? "dish" : "dishes"
              }. Move them elsewhere first — or just hide the category instead.`
            : "This category will be permanently removed."
        }
        confirmLabel="Delete category"
      />
    </div>
  );
}
