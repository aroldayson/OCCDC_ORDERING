type ClientNameFieldProps = {
  clientName: string;
  onClientNameChange: (name: string) => void;
};

export default function ClientNameField({ clientName, onClientNameChange }: ClientNameFieldProps) {
  return (
    <div>
      <label htmlFor="client-name" className="mb-1 block text-xs font-medium text-slate-500">
        Your name / Cooperative
      </label>
      <input
        id="client-name"
        type="text"
        value={clientName}
        onChange={(e) => onClientNameChange(e.target.value)}
        placeholder="e.g. Coco Bee Cooperative"
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}
