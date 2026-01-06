"use client";

import { useEffect, useMemo, useState } from "react";
import type { Client, PlansMap } from "../lib/types";

type Mode = "create" | "update";

function ModalShell({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay: azul en tema azul, más oscuro en dark */}
      <button
        className="absolute inset-0 bg-sky-950/25 dark:bg-black/55"
        onClick={onClose}
        aria-label="Cerrar"
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-sky-200/70 bg-sky-50/95 p-5 text-sky-950 shadow-xl backdrop-blur dark:border-white/10 dark:bg-black dark:text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-semibold">{title}</div>

          <button
            onClick={onClose}
            className="rounded-xl border border-sky-200/70 bg-white/60 px-3 py-1 text-sm hover:bg-sky-100/70 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <div className="text-xs font-medium text-sky-950/70 dark:text-white/70">
        {label}
      </div>
      {children}
    </label>
  );
}

function inputClass() {
  return [
    "w-full rounded-xl border px-3 py-2 text-sm outline-none",
    "border-sky-200/80 bg-white/80 text-sky-950",
    "focus:ring-2 focus:ring-sky-300",
    "dark:border-white/15 dark:bg-white/10 dark:text-white dark:focus:ring-white/20",
  ].join(" ");
}

export default function ClientFormModal({
  open,
  mode,
  plans,
  busy,
  initial,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  mode: Mode;
  plans: PlansMap | null;
  busy: boolean;
  initial: Client | null;
  onClose: () => void;
  onCreate: (payload: any) => void;
  onUpdate: (id: number, payload: any) => void;
}) {
  const isUpdate = mode === "update";

  const planOptions = useMemo(() => {
    if (!plans) return [];
    return Object.entries(plans).map(([k, v]) => ({
      key: k,
      label: `${k} · ${v.price} USD · ${v.hours}h`,
    }));
  }, [plans]);

  const [name, setName] = useState("");
  const [dni, setDni] = useState("");
  const [representative, setRepresentative] = useState("");
  const [representativeDni, setRepresentativeDni] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState("12h-u");
  const [abono, setAbono] = useState<number>(0);

  // Create: horas iniciales
  // Update/Renovar: por defecto 0 (reinicio) a menos que el usuario cambie el valor
  const [hours, setHours] = useState<number>(0);

  useEffect(() => {
    if (!open) return;

    if (isUpdate && initial) {
      setName(initial.name ?? "");
      setDni(initial.dni ?? "");
      setRepresentative(initial.representative ?? "");
      setRepresentativeDni(initial.representative_dni ?? "");
      setEmail(initial.email ?? "");
      setAddress(initial.address ?? "");
      setPhone(initial.phone ?? "");
      setPlan(initial.plan ?? "12h-u");
      setAbono(Number(initial.abono ?? 0));

      // Renovar: default 0
      setHours(0);
      return;
    }

    // Create defaults
    setName("");
    setDni("");
    setRepresentative("");
    setRepresentativeDni("");
    setEmail("");
    setAddress("");
    setPhone("");
    setPlan("12h-u");
    setAbono(0);
    setHours(0);
  }, [open, isUpdate, initial]);

  function payload() {
    return {
      name: name.trim(),
      dni: dni.trim() || "",
      representative: representative.trim() || "",
      representative_dni: representativeDni.trim() || "",
      email: email.trim() || "",
      address: address.trim() || "",
      phone: phone.trim() || "",
      plan,
      abono: Number.isFinite(abono) ? abono : 0,
      hours: Number.isFinite(hours) ? Math.max(0, Math.trunc(hours)) : 0,
    };
  }

  function submit() {
    if (!name.trim()) return alert("El nombre es requerido.");
    if (!plans) return alert("Planes no cargados aún. Presiona 'Ver clientes' primero.");
    if (!Object.prototype.hasOwnProperty.call(plans, plan)) return alert("Plan inválido.");

    if (isUpdate && initial) onUpdate(initial.id, payload());
    else onCreate(payload());
  }

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isUpdate ? "♻️ Renovar / Actualizar cliente" : "➕ Registrar nuevo cliente"}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre (requerido)">
          <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Plan (requerido)">
          <select className={inputClass()} value={plan} onChange={(e) => setPlan(e.target.value)}>
            {planOptions.length ? (
              planOptions.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))
            ) : (
              <option value="12h-u">12h-u</option>
            )}
          </select>
        </Field>

        <Field label="Abono (USD)">
          <input
            type="number"
            step="0.01"
            className={inputClass()}
            value={abono}
            onChange={(e) => setAbono(Number(e.target.value))}
          />
        </Field>

        <Field label={isUpdate ? "Horas (por defecto 0 al renovar)" : "Horas iniciales (al crear)"}>
          <input
            type="number"
            step="1"
            className={inputClass()}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          />
          {isUpdate && initial && (
            <div className="mt-1 text-xs text-sky-950/60 dark:text-white/60">
              Horas actuales del cliente: <b>{initial.hours}</b>. (Si quieres conservarlas, escribe {initial.hours})
            </div>
          )}
        </Field>

        <Field label="DNI (opcional)">
          <input className={inputClass()} value={dni} onChange={(e) => setDni(e.target.value)} />
        </Field>

        <Field label="Correo (opcional)">
          <input className={inputClass()} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field label="Representante (opcional)">
          <input className={inputClass()} value={representative} onChange={(e) => setRepresentative(e.target.value)} />
        </Field>

        <Field label="DNI Representante (opcional)">
          <input
            className={inputClass()}
            value={representativeDni}
            onChange={(e) => setRepresentativeDni(e.target.value)}
          />
        </Field>

        <Field label="Dirección (opcional)">
          <input className={inputClass()} value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>

        <Field label="Celular (opcional)">
          <input className={inputClass()} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button
          onClick={onClose}
          className="rounded-xl border border-sky-200/70 bg-white/60 px-4 py-2 text-sm font-medium hover:bg-sky-100/70 disabled:opacity-60 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/15"
          disabled={busy}
        >
          Cancelar
        </button>

        <button
          onClick={submit}
          className="rounded-xl bg-sky-800 px-4 py-2 text-sm font-medium text-white hover:bg-sky-900 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
          disabled={busy}
        >
          {busy ? "Guardando..." : isUpdate ? "Guardar cambios (PUT)" : "Registrar (POST)"}
        </button>
      </div>

      <div className="mt-3 text-xs text-sky-950/60 dark:text-white/60">
        🐾 Nota: En RENOVAR, si no tocas horas, se enviará 0 (reinicio del plan).
      </div>
    </ModalShell>
  );
}
