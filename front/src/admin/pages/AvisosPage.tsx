import CrudAdminPage from "../components/CrudAdminPage";
import { API_ENDPOINTS } from "../../shared/api/endpoints";
import {
  fetchAvisos,
  createAviso,
  updateAviso,
  deleteAviso,
  TIPOS_AVISO,
  type Aviso,
} from "../../features/layout/api/avisos";
import type { Column } from "../components/DataTable";

const columns: Column<Aviso>[] = [
  {
    key: "tipo",
    label: "Tipo",
    sortable: true,
    align: "center",
    width: "w-44",
    render: (val) => {
      const label =
        TIPOS_AVISO.find((t) => t.value === val)?.label || String(val || "-");
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/70">
          {label}
        </span>
      );
    },
  },
  {
    key: "motivo",
    label: "Motivo",
    width: "w-[55%]",
    render: (val) => (
      <span className="font-medium text-gray-900">{String(val || "-")}</span>
    ),
  },
  {
    key: "fecha",
    label: "Fecha",
    sortable: true,
    align: "center",
    width: "w-[30%]",
    render: (val) => {
      if (!val) return <span className="text-gray-400">-</span>;
      const parts = String(val).split("-");
      const fechaStr =
        parts.length === 3
          ? `${parts[2]}/${parts[1]}/${parts[0]}`
          : String(val);
      return (
        <span className="tabular-nums font-medium text-gray-700">
          {fechaStr}
        </span>
      );
    },
  },
];

const formFields = [
  {
    name: "tipo",
    label: "Tipo",
    type: "select" as const,
    required: true,
    options: TIPOS_AVISO.map((t) => ({ value: t.value, label: t.label })),
  },
  { name: "fecha", label: "Fecha", type: "date" as const, required: true },
  {
    name: "motivo",
    label: "Motivo",
    type: "text" as const,
    required: true,
  },
];

const config = {
  title: "Avisos",
  subtitle: "Gestión de avisos y suspensiones",
  entityName: "aviso",
  cacheKey: API_ENDPOINTS.avisos,
  columns,
  formFields,
  fetchList: fetchAvisos,
  create: createAviso,
  update: updateAviso,
  remove: deleteAviso,
  getRowLabel: (row: Aviso) => `${row.tipo} - ${row.motivo}`,
  notifyOnUpdate: false,
};

export default function AvisosPage() {
  return <CrudAdminPage config={config} />;
}
