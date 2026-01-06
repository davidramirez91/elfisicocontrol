import type { Client } from "../lib/types";

function money(n: number) {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(n);
}

export default function ClientCard({
  client,
  selected,
  onSelect,
}: {
  client: Client;
  selected: boolean;
  onSelect: () => void;
}) {
  const planHours = client.planInfo?.hours ?? 0;
  const planPrice = client.planInfo?.price ?? 0;

  const remainingHours = Math.max(0, planHours - client.hours);
  const saldo = planPrice - (client.abono ?? 0);

  const finished = remainingHours <= 0;

  return (
    <button
      onClick={onSelect}
      className={[
        "text-left rounded-2xl border p-4 shadow-sm transition",
        "bg-white/70 backdrop-blur hover:-translate-y-[1px] hover:shadow-md",
        "dark:bg-black/30",
        selected ? "border-black/30 dark:border-white/30" : "border-black/10 dark:border-white/10",
        finished ? "ring-2 ring-red-500/35" : "ring-0",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-black/60 dark:text-white/60">🐾 Cliente</div>
          <div className="mt-1 text-lg font-semibold leading-tight">
            {client.name}
          </div>
        </div>

        {finished ? (
          <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
            FIN
          </span>
        ) : (
          <span className="rounded-full bg-black/5 px-2 py-1 text-xs font-semibold text-black/70 dark:bg-white/10 dark:text-white/70">
            {client.plan}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 dark:bg-black/20 dark:border-white/10">
          <div className="text-xs text-black/60 dark:text-white/60">Horas restantes</div>
          <div className={["mt-1 text-base font-semibold", finished ? "text-red-600 dark:text-red-300" : ""].join(" ")}>
            {remainingHours}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white/60 px-3 py-2 dark:bg-black/20 dark:border-white/10">
          <div className="text-xs text-black/60 dark:text-white/60">Saldo restante</div>
          <div className="mt-1 text-base font-semibold">
            {saldo >= 0 ? money(saldo) : `A favor ${money(Math.abs(saldo))}`}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-black/50 dark:text-white/50">
        Click para ver detalles 🐯
      </div>
    </button>
  );
}
