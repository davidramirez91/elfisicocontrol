import type { ApiResponse, Client, PlansMap } from "./types";

async function readJson<T>(res: Response): Promise<ApiResponse<T>> {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    return { ok: false, error: msg, details: data?.details };
  }

  return data as ApiResponse<T>;
}

export async function getPlans(): Promise<ApiResponse<PlansMap>> {
  const res = await fetch("/api/plans", { method: "GET" });
  return readJson<PlansMap>(res);
}

export async function listClients(): Promise<ApiResponse<Client[]>> {
  const res = await fetch("/api/clients", { method: "GET" });
  return readJson<Client[]>(res);
}

export async function getClient(id: number): Promise<ApiResponse<Client>> {
  const res = await fetch(`/api/clients/${id}`, { method: "GET" });
  return readJson<Client>(res);
}

export async function createClient(payload: Partial<Client>) {
  const res = await fetch("/api/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson<Client>(res);
}

export async function updateClient(id: number, payload: Partial<Client>) {
  const res = await fetch(`/api/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readJson<Client>(res);
}

export async function deleteClient(id: number) {
  const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
  return readJson<Client>(res);
}

export async function incHours(id: number, delta = 1) {
  const res = await fetch(`/api/clients/${id}/hours`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  });
  return readJson<Client>(res);
}
