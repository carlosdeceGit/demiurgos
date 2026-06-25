import { AuditTableClient } from "@/components/admin/audit-table-client";

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl">Auditoría</h1>
        <p className="text-muted-foreground text-sm">
          Registro de todas las acciones administrativas con fecha, responsable
          y motivo.
        </p>
      </div>
      <AuditTableClient />
    </div>
  );
}
