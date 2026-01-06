import type { Client } from "../lib/types";

function money(n: number) {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(n);
}

/**
 * Formatea cualquier fecha que venga como:
 * - "YYYY-MM-DD"
 * - "YYYY-MM-DDTHH:mm:ss.sssZ"
 * a "DD-MM-YYYY" sin problemas de zona horaria (toma solo la parte YYYY-MM-DD).
 */
function formatDMY(input: string | null | undefined) {
  if (!input) return "—";

  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // fallback si viniera en un formato raro
  const d = new Date(String(input));
  if (Number.isNaN(d.getTime())) return String(input);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function Field({ label, value }: { label: string; value: any }) {
  const v = value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 dark:bg-black/20 dark:border-white/10">
      <div className="text-xs text-black/60 dark:text-white/60">{label}</div>
      <div className="mt-1 text-sm font-medium">{v}</div>
    </div>
  );
}

export default function ClientDetails({
  client,
  busy,
  onRegisterHour,
  onRenew,
  onDelete,
}: {
  client: Client | null;
  busy: boolean;
  onRegisterHour: (c: Client) => void;
  onRenew: (c: Client) => void;
  onDelete: (c: Client) => void;
}) {
  if (!client) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm dark:bg-black/30 dark:border-white/10">
        <div className="text-sm text-black/60 dark:text-white/60">
          Selecciona un cliente para ver los detalles 🐾
        </div>
      </div>
    );
  }

  const planHours = client.planInfo?.hours ?? 0;
  const planPrice = client.planInfo?.price ?? 0;

  const remainingHours = Math.max(0, planHours - client.hours);
  const finished = remainingHours <= 0;

  const saldo = planPrice - (client.abono ?? 0);

  return (
    <div
      className={[
        "rounded-2xl border p-5 shadow-sm backdrop-blur",
        "bg-white/70 dark:bg-black/30",
        "border-black/10 dark:border-white/10",
        finished ? "ring-2 ring-red-500/35" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-black/60 dark:text-white/60">🦊 Detalles</div>
          <div className="mt-1 text-xl font-semibold leading-tight">{client.name}</div>

          <div className="mt-1 text-xs text-black/60 dark:text-white/60">
            Plan: <span className="font-semibold">{client.plan}</span>
            {" · "}
            Registro: <span className="font-semibold">{formatDMY(client.created_date)}</span>
          </div>
        </div>

        {finished ? (
          <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
            FIN del plan
          </span>
        ) : (
          <span className="rounded-full bg-black/5 px-2 py-1 text-xs font-semibold text-black/70 dark:bg-white/10 dark:text-white/70">
            Activo 🐾
          </span>
        )}
      </div>

      {/* Resumen */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 dark:bg-black/20 dark:border-white/10">
          <div className="text-xs text-black/60 dark:text-white/60">Horas usadas</div>
          <div className="mt-1 text-base font-semibold">{client.hours}</div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 dark:bg-black/20 dark:border-white/10">
          <div className="text-xs text-black/60 dark:text-white/60">Horas restantes</div>
          <div className={["mt-1 text-base font-semibold", finished ? "text-red-600 dark:text-red-300" : ""].join(" ")}>
            {remainingHours}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 dark:bg-black/20 dark:border-white/10">
          <div className="text-xs text-black/60 dark:text-white/60">Total plan</div>
          <div className="mt-1 text-base font-semibold">
            {money(planPrice)} · {planHours}h
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 dark:bg-black/20 dark:border-white/10">
          <div className="text-xs text-black/60 dark:text-white/60">Saldo restante</div>
          <div className="mt-1 text-base font-semibold">
            {saldo >= 0 ? money(saldo) : `A favor ${money(Math.abs(saldo))}`}
          </div>
        </div>
      </div>

      {/* Campos */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="DNI" value={client.dni} />
        <Field label="Correo" value={client.email} />
        <Field label="Representante" value={client.representative} />
        <Field label="DNI Representante" value={client.representative_dni} />
        <Field label="Dirección" value={client.address} />
        <Field label="Celular" value={client.phone} />
        <Field label="Abono" value={money(client.abono ?? 0)} />
        <Field label="Etiqueta plan" value={client.planInfo?.label ?? "—"} />
      </div>

      {/* Acciones */}
      <div className="mt-5 flex flex-wrap gap-2">
        {!finished ? (
          <button
            onClick={() => onRegisterHour(client)}
            disabled={busy}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
          >
            ⏱️ Registrar hora (+1)
          </button>
        ) : (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            Plan terminado. Solo puedes <b>RENOVAR</b> o <b>ELIMINAR</b>.
          </div>
        )}

        <button
          onClick={() => onRenew(client)}
          disabled={busy}
          className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:bg-black/20 dark:border-white/15 dark:hover:bg-white/5"
        >
          ♻️ Renovar (PUT)
        </button>

        <button
          onClick={() => onDelete(client)}
          disabled={busy}
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-500/15 disabled:opacity-60 dark:text-red-300"
        >
          🗑️ Eliminar (DELETE)
        </button>
      </div>
    </div>
  );
}
