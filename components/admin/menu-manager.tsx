"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Star, Trash2, UtensilsCrossed } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { FilterBar } from "@/components/admin/filters";

export type AdminMenuItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string | null;
  price: number;
  image: string | null;
  spiceLevel: "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT";
  vegetarian: boolean;
  available: boolean;
  featured: boolean;
  sortOrder: number;
  categoryId: string;
  categoryName: string;
  orderCount: number;
};

type Category = { id: string; name: string };

const SPICE = [
  { value: "MILD", label: "Mild" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HOT", label: "Hot" },
  { value: "EXTRA_HOT", label: "Extra hot" },
] as const;

export function MenuManager({
  items,
  categories,
}: {
  items: AdminMenuItem[];
  categories: Category[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const [editing, setEditing] = React.useState<AdminMenuItem | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState<AdminMenuItem | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Checkbox state lives outside the uncontrolled form so it can be reset per item.
  const [flags, setFlags] = React.useState({
    vegetarian: false,
    available: true,
    featured: false,
  });

  const query = params.get("q")?.toLowerCase() ?? "";
  const categoryFilter = params.get("category") ?? "";
  const availability = params.get("availability") ?? "";

  const visible = items.filter((item) => {
    if (categoryFilter && item.categoryId !== categoryFilter) return false;
    if (availability === "available" && !item.available) return false;
    if (availability === "unavailable" && item.available) return false;
    if (availability === "featured" && !item.featured) return false;
    if (query && !`${item.name} ${item.description}`.toLowerCase().includes(query)) {
      return false;
    }
    return true;
  });

  const openCreate = () => {
    setFlags({ vegetarian: false, available: true, featured: false });
    setErrors({});
    setCreating(true);
  };

  const openEdit = (item: AdminMenuItem) => {
    setFlags({
      vegetarian: item.vegetarian,
      available: item.available,
      featured: item.featured,
    });
    setErrors({});
    setEditing(item);
  };

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
      categoryId: String(form.get("categoryId") ?? ""),
      name: String(form.get("name") ?? ""),
      description: String(form.get("description") ?? ""),
      ingredients: String(form.get("ingredients") ?? ""),
      price: Number(form.get("price") ?? 0),
      image: String(form.get("image") ?? ""),
      spiceLevel: String(form.get("spiceLevel") ?? "MEDIUM"),
      sortOrder: Number(form.get("sortOrder") ?? 0),
      ...flags,
    };

    const response = await fetch(
      editing ? `/api/admin/menu/${editing.id}` : "/api/admin/menu",
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
      toast.error(data.error ?? "Couldn't save this item");
      return;
    }

    toast.success(editing ? "Menu item updated" : "Menu item created");
    closeForm();
    router.refresh();
  }

  async function toggle(item: AdminMenuItem, patch: Partial<AdminMenuItem>) {
    const response = await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      toast.error("Couldn't update this item");
      return;
    }
    toast.success("Menu item updated");
    router.refresh();
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    const response = await fetch(`/api/admin/menu/${deleting.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    setDeleting(null);

    if (!response.ok) {
      toast.error(data.error ?? "Couldn't delete this item");
      return;
    }
    // The API disables rather than deletes an item with order history.
    toast.success(data.message ?? "Menu item deleted");
    router.refresh();
  }

  const open = creating || editing !== null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Menu</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {items.length} dishes across {categories.length} categories.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          New item
        </Button>
      </div>

      <Card>
        <div className="border-b border-slate-200 p-3">
          <FilterBar
            searchPlaceholder="Search dishes…"
            selects={[
              {
                key: "category",
                label: "All categories",
                options: categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              },
              {
                key: "availability",
                label: "All items",
                options: [
                  { value: "available", label: "Available" },
                  { value: "unavailable", label: "Unavailable" },
                  { value: "featured", label: "Featured" },
                ],
              },
            ]}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed className="h-6 w-6" />}
            title="No menu items found."
            message="Try changing your filters, or add a new dish."
            action={<Button onClick={openCreate}>Add a dish</Button>}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto thin-scroll md:block">
              <table className="w-full min-w-3xl text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th scope="col" className="px-4 py-2.5 font-medium">Dish</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Category</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Price</th>
                    <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-500">
                          {item.description}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {item.categoryName}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone={item.available ? "green" : "slate"}>
                            {item.available ? "Available" : "Unavailable"}
                          </Badge>
                          {item.featured && <Badge tone="amber">Featured</Badge>}
                          {item.vegetarian && <Badge tone="green">Veg</Badge>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggle(item, { featured: !item.featured })}
                            aria-label={
                              item.featured
                                ? `Remove ${item.name} from featured`
                                : `Feature ${item.name}`
                            }
                            aria-pressed={item.featured}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-500"
                          >
                            <Star
                              className={cn(
                                "h-3.5 w-3.5",
                                item.featured && "fill-amber-400 text-amber-500",
                              )}
                              aria-hidden
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggle(item, { available: !item.available })}
                            className="rounded-lg px-2 py-1.5 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                          >
                            {item.available ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            aria-label={`Edit ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleting(item)}
                            aria-label={`Delete ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {visible.map((item) => (
                <li key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.categoryName}</p>
                    </div>
                    <p className="shrink-0 font-medium tabular-nums text-slate-900">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone={item.available ? "green" : "slate"}>
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                    {item.featured && <Badge tone="amber">Featured</Badge>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggle(item, { available: !item.available })}
                    >
                      {item.available ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleting(item)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Modal
        open={open}
        onClose={closeForm}
        size="lg"
        title={editing ? `Edit ${editing.name}` : "New menu item"}
        description="Changes go live on the customer site immediately."
        footer={
          <>
            <Button variant="secondary" onClick={closeForm} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" form="menu-form" loading={busy}>
              {editing ? "Save changes" : "Create item"}
            </Button>
          </>
        }
      >
        <form id="menu-form" onSubmit={save} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={errors.name} required>
              <Input
                id="name"
                name="name"
                defaultValue={editing?.name ?? ""}
                required
                maxLength={80}
                error={errors.name}
              />
            </Field>
            <Field label="Category" htmlFor="categoryId" error={errors.categoryId} required>
              <Select
                id="categoryId"
                name="categoryId"
                defaultValue={editing?.categoryId ?? categories[0]?.id ?? ""}
                required
                error={errors.categoryId}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Description" htmlFor="description" error={errors.description} required>
            <Textarea
              id="description"
              name="description"
              defaultValue={editing?.description ?? ""}
              required
              minLength={10}
              maxLength={600}
              error={errors.description}
            />
          </Field>

          <Field
            label="Ingredients"
            htmlFor="ingredients"
            error={errors.ingredients}
            hint="Comma separated — shown as tags on the dish page."
          >
            <Input
              id="ingredients"
              name="ingredients"
              defaultValue={editing?.ingredients ?? ""}
              maxLength={400}
              placeholder="Chicken, sella basmati, saffron, ghee"
              error={errors.ingredients}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (Rs.)" htmlFor="price" error={errors.price} required>
              <Input
                id="price"
                name="price"
                type="number"
                min={1}
                step="1"
                defaultValue={editing?.price ?? ""}
                required
                error={errors.price}
              />
            </Field>
            <Field label="Spice level" htmlFor="spiceLevel" error={errors.spiceLevel}>
              <Select
                id="spiceLevel"
                name="spiceLevel"
                defaultValue={editing?.spiceLevel ?? "MEDIUM"}
              >
                {SPICE.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Sort order" htmlFor="sortOrder" error={errors.sortOrder}>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                max={999}
                defaultValue={editing?.sortOrder ?? 0}
              />
            </Field>
          </div>

          <Field
            label="Image path"
            htmlFor="image"
            error={errors.image}
            hint="Leave blank to use /images/menu/<slug>.webp. A branded placeholder shows until the file exists."
          >
            <Input
              id="image"
              name="image"
              defaultValue={editing?.image ?? ""}
              placeholder="/images/menu/chicken-dum-biryani.webp"
              error={errors.image}
            />
          </Field>

          <div className="grid gap-2 sm:grid-cols-3">
            <Toggle
              label="Vegetarian"
              checked={flags.vegetarian}
              onChange={(value) => setFlags((current) => ({ ...current, vegetarian: value }))}
            />
            <Toggle
              label="Available"
              checked={flags.available}
              onChange={(value) => setFlags((current) => ({ ...current, available: value }))}
            />
            <Toggle
              label="Featured"
              description="Shows on the home page"
              checked={flags.featured}
              onChange={(value) => setFlags((current) => ({ ...current, featured: value }))}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${deleting?.name}?`}
        message={
          deleting && deleting.orderCount > 0
            ? `This dish appears in ${deleting.orderCount} past ${
                deleting.orderCount === 1 ? "order" : "orders"
              }, so it will be disabled rather than deleted — that keeps order history intact.`
            : "This dish will be permanently removed from the menu."
        }
        confirmLabel={
          deleting && deleting.orderCount > 0 ? "Disable item" : "Delete item"
        }
      />
    </div>
  );
}
