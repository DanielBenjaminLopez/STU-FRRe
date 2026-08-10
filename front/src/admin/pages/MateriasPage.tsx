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
  { key: "nombre", label: "Nombre", sortable: true },
];

const formFields = [
  { name: "nombre", label: "Nombre", type: "text" as const, required: true },
];

const config = {
  title: "Materias",
  subtitle: "Gestion de materias de la facultad",
  entityName: "materia",
  columns,
  formFields,
  fetchList: fetchMaterias,
  create: createMateria,
  update: updateMateria,
  remove: deleteMateria,
  getRowLabel: (row: Materia) => row.nombre,
};

export default function MateriasPage() {
  return <CrudAdminPage config={config} />;
}
