import CrudAdminPage from "../components/CrudAdminPage";
import {
  fetchNoticias,
  createNoticia,
  updateNoticia,
  deleteNoticia,
} from "../../shared/api/noticias";
import type { Column } from "../components/DataTable";

const columns: Column<Record<string, unknown>>[] = [
  { key: "titulo", label: "Título", sortable: true },
  {
    key: "fecha_publicacion",
    label: "Publicación",
    sortable: true,
    render: (val) => {
      const d = new Date(String(val));
      return d.toLocaleDateString("es-ES");
    },
  },
  {
    key: "fecha_expiracion",
    label: "Expiración",
    render: (val) => {
      if (!val) return "-";
      const d = new Date(String(val));
      return d.toLocaleDateString("es-ES");
    },
  },
];

const formFields = [
  { name: "titulo", label: "Título", type: "text" as const, required: true },
  {
    name: "contenido",
    label: "Contenido",
    type: "textarea" as const,
    required: true,
  },
  {
    name: "fecha_publicacion",
    label: "Fecha de publicación",
    type: "datetime-local" as const,
    required: true,
  },
  {
    name: "fecha_expiracion",
    label: "Fecha de expiración (opcional)",
    type: "datetime-local" as const,
    required: false,
  },
];

const config = {
  title: "Noticias",
  subtitle: "Gestión de noticias y publicaciones",
  entityName: "noticia",
  columns,
  formFields,
  fetchList: fetchNoticias,
  create: createNoticia,
  update: updateNoticia,
  remove: deleteNoticia,
  getRowLabel: (row: Record<string, unknown>) => String(row.titulo ?? ""),
};

export default function NoticiasPage() {
  return <CrudAdminPage config={config} />;
}
