import CrudAdminPage from "../components/CrudAdminPage";
import {
  fetchMaterias,
  createMateria,
  updateMateria,
  deleteMateria,
  type Materia,
} from "../../shared/api/materias";
import type { Column } from "../components/DataTable";

const columns: Column<Materia>[] = [
  { key: "codigo", label: "Código", sortable: true },
  { key: "nombre", label: "Nombre", sortable: true },
  { key: "profesores", label: "Profesores" },
];

const formFields = [
  { name: "codigo", label: "Código", type: "text" as const, required: true },
  { name: "nombre", label: "Nombre", type: "text" as const, required: true },
  {
    name: "profesores",
    label: "Profesores",
    type: "textarea" as const,
    required: false,
  },
];

const config = {
  title: "Materias",
  subtitle: "Gestión de materias de la facultad",
  entityName: "materia",
  columns,
  formFields,
  fetchList: fetchMaterias,
  create: createMateria,
  update: updateMateria,
  remove: deleteMateria,
  getRowLabel: (row: Materia) => `${row.codigo} - ${row.nombre}`,
};

export default function MateriasPage() {
  return <CrudAdminPage config={config} />;
}
