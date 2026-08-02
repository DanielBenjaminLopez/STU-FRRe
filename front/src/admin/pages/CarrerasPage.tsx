import CrudAdminPage from "../components/CrudAdminPage";
import {
  fetchCarreras,
  createCarrera,
  updateCarrera,
  deleteCarrera,
  type Carrera,
} from "../../shared/api/carreras";
import type { Column } from "../components/DataTable";

const columns: Column<Carrera>[] = [
  { key: "nombre", label: "Nombre", sortable: true },
];

const formFields = [
  { name: "nombre", label: "Nombre", type: "text" as const, required: true },
];

const config = {
  title: "Carreras",
  subtitle: "Gestion de carreras de la facultad",
  entityName: "carrera",
  columns,
  formFields,
  fetchList: fetchCarreras,
  create: createCarrera,
  update: updateCarrera,
  remove: deleteCarrera,
  getRowLabel: (row: Carrera) => row.nombre,
};

export default function CarrerasPage() {
  return <CrudAdminPage config={config} />;
}
