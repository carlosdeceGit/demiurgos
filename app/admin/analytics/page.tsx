import { AnalyticsClient } from "@/components/admin/analytics-client";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Analíticas</h1>
        <p className="text-muted-foreground text-sm">
          Uso global de la plataforma · datos en tiempo real.
        </p>
      </div>
      <AnalyticsClient />
    </div>
  );
}
