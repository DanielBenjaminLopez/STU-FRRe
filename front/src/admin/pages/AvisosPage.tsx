import CrudAdminPage from "../components/CrudAdminPage";
import {
  fetchAvisos,
  createAviso,
  updateAviso,
  deleteAviso,
  TIPOS_AVISO,
} from "../../shared/api/avisos";
import type { Column } from "../components/DataTable";

const columns: Column<Record<string, unknown>>[] = [
  { key: "tipo", label: "Tipo", sortable: true },
  { key: "motivo", label: "Motivo" },
  { key: "fecha", label: "Fecha", sortable: true },
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
  columns,
  formFields,
  fetchList: fetchAvisos,
  create: createAviso,
  update: updateAviso,
  remove: deleteAviso,
  getRowLabel: (row: Record<string, unknown>) =>
    `${row.tipo} - ${row.motivo}`,
};

export default function AvisosPage() {
  return <CrudAdminPage config={config} />;
}
