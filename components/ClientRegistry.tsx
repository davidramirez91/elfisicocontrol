"use client";

import { useEffect, useMemo, useState } from "react";
import type { Client, PlansMap } from "../lib/types";
import {
  createClient,
  deleteClient,
  getClient,
  getPlans,
  incHours,
  listClients,
  updateClient,
} from "../lib/api";
import ClientCard from "./ClientCard";
import ClientDetails from "./ClientDetails";
import ClientFormModal from "./ClientFormModal";
import ThemeToggle from "./ThemeToggle";

type ModalState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "update"; client: Client };

function replaceClient(list: Client[], updated: Client) {
  return list.map((c) => (c.id === updated.id ? updated : c));
}

export default function ClientRegistry() {
  const [loaded, setLoaded] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plans, setPlans] = useState<PlansMap | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const [modal, setModal] = useState<ModalState>({ open: false });

  const selected = useMemo(
    () => clients.find((c) => c.id === selectedId) ?? null,
    [clients, selectedId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  async function ensurePlans() {
    if (plans) return;
    const r = await getPlans();
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setPlans(r.data);
  }

  // ✅ Cargar planes al iniciar (sin necesidad de presionar GET)
  useEffect(() => {
    (async () => {
      await ensurePlans();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLoadClients() {
    setError(null);
    setLoadingList(true);
    await ensurePlans();

    const r = await listClients();
    setLoadingList(false);

    if (!r.ok) return setError(r.error);

    setClients(r.data);
    setLoaded(true);

    if (r.data.length && selectedId === null) setSelectedId(r.data[0].id);
  }

  async function refreshSelected(id: number) {
    const r = await getClient(id);
    if (!r.ok) return;
    setClients((prev) => replaceClient(prev, r.data));
  }

  useEffect(() => {
    if (!loaded || !selectedId) return;

    const t = setInterval(() => {
      refreshSelected(selectedId);
    }, 3000);

    return () => clearInterval(t);
  }, [loaded, selectedId]);

  function openCreate() {
    setError(null);
    setModal({ open: true, mode: "create" });
  }

  function openUpdate(client: Client) {
    setError(null);
    setModal({ open: true, mode: "update", client });
  }

  async function onCreate(payload: any) {
    setBusyAction(true);
    setError(null);

    const r = await createClient(payload);
    setBusyAction(false);

    if (!r.ok) return setError(r.error);

    setClients((prev) => [...prev, r.data]);
    setSelectedId(r.data.id);
    setModal({ open: false });
    setLoaded(true);
  }

  async function onUpdate(id: number, payload: any) {
    setBusyAction(true);
    setError(null);

    const r = await updateClient(id, payload);
    setBusyAction(false);

    if (!r.ok) return setError(r.error);

    setClients((prev) => replaceClient(prev, r.data));
    setSelectedId(r.data.id);
    setModal({ open: false });
  }

  async function onDelete(client: Client) {
    const ok = confirm(`¿Eliminar a "${client.name}"? Esta acción no se puede deshacer.`);
    if (!ok) return;

    setBusyAction(true);
    setError(null);

    const r = await deleteClient(client.id);
    setBusyAction(false);

    if (!r.ok) return setError(r.error);

    setClients((prev) => prev.filter((c) => c.id !== client.id));
    setSelectedId((prevSel) => {
      if (prevSel !== client.id) return prevSel;
      const remaining = clients.filter((c) => c.id !== client.id);
      return remaining.length ? remaining[0].id : null;
    });
  }

  async function onRegisterHour(client: Client) {
    const planHours = client.planInfo?.hours ?? 0;
    const remaining = Math.max(0, planHours - client.hours);
    if (remaining <= 0) return;

    setBusyAction(true);
    setError(null);

    const r = await incHours(client.id, 1);
    setBusyAction(false);

    if (!r.ok) return setError(r.error);

    setClients((prev) => replaceClient(prev, r.data));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-sky-200/50 bg-sky-50/70 p-5 shadow-sm backdrop-blur dark:bg-black/30 dark:border-white/10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">🐾 Registro de Clientes</h1>
            <p className="text-sm text-sky-950/60 dark:text-white/60">
              Controla planes, horas y abonos de forma rápida e intuitiva.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />

            {!loaded ? (
              <button
                onClick={handleLoadClients}
                className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                disabled={loadingList}
              >
                {loadingList ? "Cargando..." : "Ver clientes (GET)"}
              </button>
            ) : (
              <button
                onClick={handleLoadClients}
                className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
                disabled={loadingList}
              >
                {loadingList ? "Actualizando..." : "Actualizar lista"}
              </button>
            )}

            <button
              onClick={openCreate}
              className="rounded-xl border border-sky-200/70 bg-white/70 px-4 py-2 text-sm font-medium hover:bg-sky-50 disabled:opacity-60 dark:bg-white/10 dark:border-white/15 dark:hover:bg-white/15"
              disabled={busyAction}
            >
              ➕ Nuevo cliente (POST)
            </button>
          </div>
        </div>

        {loaded && (
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full rounded-xl border border-sky-200/70 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-300 dark:bg-white/10 dark:border-white/15 dark:focus:ring-white/20 md:max-w-sm"
            />
            <div className="text-xs text-sky-950/60 dark:text-white/60">
              Clientes: <span className="font-semibold">{clients.length}</span>
              {selected ? (
                <>
                  {" · "}Seleccionado: <span className="font-semibold">{selected.name}</span>
                </>
              ) : null}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Content */}
      {loaded ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-sky-200/50 bg-sky-50/60 p-6 text-sm text-sky-950/60 dark:bg-black/30 dark:border-white/10 dark:text-white/60">
                No hay clientes para mostrar.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((c) => (
                  <ClientCard
                    key={c.id}
                    client={c}
                    selected={c.id === selectedId}
                    onSelect={() => setSelectedId(c.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <ClientDetails
                client={selected}
                busy={busyAction}
                onRegisterHour={onRegisterHour}
                onRenew={(c) => openUpdate(c)}
                onDelete={onDelete}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-sky-200/50 bg-sky-50/70 p-8 shadow-sm dark:bg-black/30 dark:border-white/10">
          <div className="space-y-3">
            <div className="text-3xl">🦊🦁🐼</div>
            <h2 className="text-xl font-semibold">Panel listo</h2>
            <p className="text-sm text-sky-950/60 dark:text-white/60">
              Presiona <b>“Ver clientes (GET)”</b> para cargar los registros. También puedes
              crear un cliente sin cargar la lista primero.
            </p>
          </div>
        </div>
      )}

      <ClientFormModal
        open={modal.open}
        mode={modal.open ? modal.mode : "create"}
        plans={plans}
        busy={busyAction}
        initial={modal.open && modal.mode === "update" ? modal.client : null}
        onClose={() => setModal({ open: false })}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </div>
  );
}
