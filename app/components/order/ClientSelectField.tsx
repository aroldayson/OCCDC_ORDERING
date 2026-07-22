"use client";

import { useEffect, useState } from "react";
import { getClients } from "./clientStorage";
import type { ClientRecord } from "./clientStorage";

type ClientSelectFieldProps = {
  selectedClientId: string;
  onClientChange: (client: ClientRecord | null) => void;
  lockedClientName?: string;
};

export default function ClientSelectField({
  selectedClientId,
  onClientChange,
  lockedClientName,
}: ClientSelectFieldProps) {
  const [clients, setClients] = useState<ClientRecord[]>([]);

  useEffect(() => {
    getClients().then(setClients);
  }, []);



  function handleClientChange(clientId: string) {
    const client = clients.find((c) => c.id === clientId) ?? null;
    onClientChange(client);
  }

  if (lockedClientName) {
    return (
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            School
          </label>
          <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">
            {lockedClientName}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Linked to your account — cannot be changed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="client-select"
          className="mb-1 block text-xs font-medium text-slate-500"
        >
          School
        </label>
        <select
          id="client-select"
          value={selectedClientId}
          onChange={(e) => handleClientChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Select school...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>


    </div>
  );
}

export async function findClientIdByName(name: string): Promise<string> {
  const clients = await getClients();
  return clients.find((c) => c.name === name)?.id ?? "";
}
