import type { Metadata } from "next";
import { Info } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { paymentProvider } from "@/lib/payments";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card, CardHeader } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const provider = paymentProvider();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Site-wide configuration. Changes take effect immediately.
        </p>
      </div>

      <SettingsForm settings={settings} />

      <Card>
        <CardHeader
          title="Payments"
          description="Configured through environment variables, not this screen."
        />
        <div className="p-4">
          <p className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            {provider.configured ? (
              <span>
                Payment provider <strong>{provider.provider}</strong> is configured.
              </span>
            ) : (
              <span>
                No payment provider is connected, so nothing is charged online.
                Orders placed with &ldquo;Online Payment&rdquo; or &ldquo;Card&rdquo; are
                recorded as <strong>unpaid</strong> and settled on delivery or at the
                counter — mark them paid from the order screen. To connect a provider,
                set <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">PAYMENT_PROVIDER</code>{" "}
                and <code className="rounded bg-slate-200 px-1 py-0.5 text-xs">PAYMENT_SECRET_KEY</code>{" "}
                in your environment.
              </span>
            )}
          </p>
        </div>
      </Card>
    </div>
  );
}
