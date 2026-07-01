"use client";

import { useEffect, useState } from "react";
import { getClients, updateClientDeliveryPrice, type ClientRecord } from "../order/clientStorage";
import { Edit2, Save, X } from "lucide-react";

export default function DeliveryFeeManager() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState("0");
  const [loading, setLoading] = useState(true);

  const loadClients = async () => {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleEdit = (client: ClientRecord) => {
    setEditingId(client.id);
    setTempPrice((client.delivery_price || 0).toString());
  };

  const handleSave = async (clientId: string) => {
    const price = parseFloat(tempPrice) || 0;
    await updateClientDeliveryPrice(clientId, price);
    setEditingId(null);
    loadClients(); // Reload to reflect changes
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Delivery Fees</h2>
        <p className="text-sm text-slate-500">Manage delivery fees for all registered schools.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto min-h-0 flex-1">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm border-b border-slate-200 z-10">
              <tr>
                <th className="px-6 py-4">School Name</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4 text-right">Delivery Fee (₱)</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{client.name}</td>
                  <td className="px-6 py-4">{client.address || <span className="text-slate-400 italic">Not set</span>}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-700">
                    {editingId === client.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-400">₱</span>
                        <input
                          type="number"
                          value={tempPrice}
                          onChange={(e) => setTempPrice(e.target.value)}
                          className="w-24 rounded border border-blue-300 px-2 py-1 text-right outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      `₱${(client.delivery_price || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editingId === client.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleSave(client.id)}
                          className="rounded-lg bg-blue-600 p-1.5 text-white hover:bg-blue-700 transition"
                          title="Save"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="rounded-lg bg-slate-200 p-1.5 text-slate-600 hover:bg-slate-300 transition"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(client)}
                        className="rounded-lg bg-slate-100 p-1.5 text-blue-600 hover:bg-blue-50 transition"
                        title="Edit Delivery Fee"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No schools found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
