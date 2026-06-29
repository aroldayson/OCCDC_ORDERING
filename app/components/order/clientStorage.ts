export type ClientRecord = {
  id: string;
  name: string;
};

const STORAGE_KEY = "occdc_clients";
const STORAGE_VERSION = "excel-week1-v1";
const VERSION_KEY = "occdc_clients_version";

function seedClients(): ClientRecord[] {
  return [
    { id: "school-1", name: "ASINAN ELEMENTARY SCHOOL" },
    { id: "school-2", name: "BANICAIN ELEMENTARY SCHOOL" },
    { id: "school-3", name: "BARRETTO I ELEMENTARY SCHOOL" },
    { id: "school-4", name: "BOTON ELEMENTARY SCHOOL" },
    { id: "school-5", name: "ILALIM ELEMENTARY SCHOOL" },
    { id: "school-6", name: "IRAM I ELEMENTARY SCHOOL" },
    { id: "school-7", name: "JAMES L. GORDON INTEGRATED SCHOOL" },
    { id: "school-8", name: "MABAYUAN ELEMENTARY SCHOOL" },
    { id: "school-9", name: "NEW CABALAN ELEMENTARY SCHOOL" },
    { id: "school-10", name: "OLONGAPO CITY ELEMENTARY SCHOOL" },
    { id: "school-11", name: "SERGIA SORIANO ESTEBAN INTEGRATED SCHOOL II" },
    { id: "school-12", name: "STA. RITA ELEMENTARY SCHOOL" },
    { id: "school-13", name: "TAPINAC ELEMENTARY SCHOOL" },
  ];
}

function readClients(): ClientRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const version = localStorage.getItem(VERSION_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || version !== STORAGE_VERSION) {
      const seeded = seedClients();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      localStorage.setItem(VERSION_KEY, STORAGE_VERSION);
      return seeded;
    }
    return JSON.parse(raw) as ClientRecord[];
  } catch {
    return [];
  }
}

function notify() {
  window.dispatchEvent(new Event("occdc-clients-updated"));
}

export function getClients(): ClientRecord[] {
  return readClients();
}

export function getClientByName(name: string): ClientRecord | undefined {
  return readClients().find((c) => c.name === name);
}

export function resolveClientBySchoolName(schoolName: string): ClientRecord {
  const normalized = schoolName.trim().toUpperCase();
  const clients = readClients();
  const existing = clients.find((c) => c.name.toUpperCase() === normalized);
  if (existing) return existing;

  const partial = clients.find(
    (c) =>
      c.name.toUpperCase().includes(normalized) ||
      normalized.includes(c.name.toUpperCase()),
  );
  if (partial) return partial;

  return addClient(schoolName.trim());
}

export function addClient(name: string): ClientRecord {
  const clients = readClients();
  const existing = clients.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  if (existing) return existing;
  const entry: ClientRecord = { id: `school-${Date.now()}`, name: name.trim() };
  clients.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  notify();
  return entry;
}
