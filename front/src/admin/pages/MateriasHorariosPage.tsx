import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { sileo } from "sileo";
import DataTable, { type Column } from "../components/DataTable";
import DataFormModal, { type FormField } from "../components/DataFormModal";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import PageHeader from "../components/PageHeader";
import ImportCsvModal from "../components/ImportCsvModal";
import {
  modalBackdropVariants,
  modalPanelVariants,
} from "../components/modalMotion";
import Button from "../../shared/components/ui/Button";
import Select from "../../shared/components/ui/Select";
import { AdminSchedulesSkeleton } from "../../shared/components/ui/Skeleton";
import { Schedule } from "../../features/horarios/components/HorariosScheduleGrid";
import type { Clase } from "../../features/horarios/api/horarios";
import {
  fetchMaterias,
  fetchHorarios,
  createHorario,
  updateHorario,
  deleteHorario,
  vaciarHorarios,
  DIAS_SEMANA,
  NIVELES,
  importarHorariosCSV,
  type CsvImportResult,
  type Materia,
  type HorarioCursadoConNombres,
} from "../../features/horarios/api/horariosAdmin";
import { fetchCarreras, type Carrera } from "../../shared/api/carreras";

interface HorarioRow {
  id: number;
  materia: number;
  materia_nombre: string;
  carrera_id: number;
  carrera_codigo: string;
  carrera_nombre: string;
  nivel: string;
  nivel_label: string;
  comision: string;
  dia_semana: string;
  dia_label: string;
  hora_inicio: string;
  hora_fin: string;
  horario_str: string;
  espacio: string;
}

const DIA_FULL_LABELS: Record<string, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

function normalizeDia(dia: string): string {
  return (dia || "")
    .toLowerCase()
    .trim()
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u");
}

const columns: Column<HorarioRow>[] = [
  {
    key: "carrera_codigo",
    label: "Carrera",
    sortable: true,
    align: "center",
    render: (_, row) => (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800"
        title={row.carrera_nombre}
      >
        {row.carrera_codigo || row.carrera_nombre || "-"}
      </span>
    ),
  },
  {
    key: "materia_nombre",
    label: "Materia",
    sortable: true,
    render: (val) => (
      <span className="font-medium text-gray-900">{String(val || "-")}</span>
    ),
  },
  {
    key: "nivel_label",
    label: "Nivel",
    sortable: true,
    align: "center",
    render: (val) => (
      <span className="text-gray-600 text-xs font-medium">
        {String(val || "-")}
      </span>
    ),
  },
  {
    key: "comision",
    label: "Comisión",
    sortable: true,
    align: "center",
    render: (val) =>
      val ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
          {String(val)}
        </span>
      ) : (
        <span className="text-gray-400 text-xs italic">Sin comisión</span>
      ),
  },
  {
    key: "dia_label",
    label: "Día",
    sortable: true,
  },
  {
    key: "horario_str",
    label: "Horario",
    sortable: true,
    align: "center",
    render: (val) => (
      <span className="tabular-nums font-medium text-gray-700">
        {String(val)}
      </span>
    ),
  },
  {
    key: "espacio",
    label: "Espacio / Aula",
    sortable: true,
    align: "center",
    render: (val) =>
      val ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          {String(val)}
        </span>
      ) : (
        <span className="text-gray-400 text-xs italic">Sin asignar</span>
      ),
  },
];

export default function MateriasHorariosPage() {
  const [horarios, setHorarios] = useState<HorarioCursadoConNombres[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCarrera, setFilterCarrera] = useState<number | "">("");
  const [filterNivel, setFilterNivel] = useState("");
  const [filterComision, setFilterComision] = useState("");
  const [filterDia, setFilterDia] = useState("");

  const [showGridModal, setShowGridModal] = useState(false);
  const [gridCarrera, setGridCarrera] = useState<number | "">("");
  const [gridNivel, setGridNivel] = useState("");
  const [gridComision, setGridComision] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<HorarioRow | null>(null);
  const [selectedFormCarrera, setSelectedFormCarrera] = useState<number | null>(
    null,
  );
  const [deletingRow, setDeletingRow] = useState<HorarioRow | null>(null);
  const [showVaciarModal, setShowVaciarModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [matList, horList, carList] = await Promise.all([
        fetchMaterias(),
        fetchHorarios(),
        fetchCarreras(),
      ]);
      setMaterias(matList);
      setHorarios(horList);
      setCarreras(carList);
    } catch (err) {
      sileo.error({
        title: "Error al cargar datos",
        description:
          err instanceof Error ? err.message : "Error al cargar los horarios",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      if (active) {
        await loadData();
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, [loadData]);

  const materiasById = useMemo(
    () => new Map(materias.map((m) => [m.id, m])),
    [materias],
  );

  const carrerasById = useMemo(
    () => new Map(carreras.map((c) => [c.id, c])),
    [carreras],
  );

  const allRows: HorarioRow[] = useMemo(() => {
    return horarios.map((h) => {
      const mat = materiasById.get(h.materia);
      const car = mat ? carrerasById.get(mat.carrera) : undefined;
      const nivelRaw = h.nivel || mat?.nivel || "";
      const nivelLabel =
        NIVELES.find((n) => n.value === nivelRaw)?.label || nivelRaw;
      const diaKey = normalizeDia(h.dia_semana);
      const hIni = (h.hora_inicio || "").slice(0, 5);
      const hFin = (h.hora_fin || "").slice(0, 5);

      return {
        id: h.id,
        materia: h.materia,
        materia_nombre:
          h.materia_nombre || mat?.nombre || `Materia #${h.materia}`,
        carrera_id: mat?.carrera ?? 0,
        carrera_codigo:
          h.carrera_codigo || mat?.carrera_codigo || car?.codigo || "",
        carrera_nombre:
          h.carrera_nombre || mat?.carrera_nombre || car?.nombre || "",
        nivel: nivelRaw,
        nivel_label: nivelLabel,
        comision: h.comision || "",
        dia_semana: diaKey,
        dia_label: DIA_FULL_LABELS[diaKey] || h.dia_semana,
        hora_inicio: hIni,
        hora_fin: hFin,
        horario_str: hIni && hFin ? `${hIni} - ${hFin}` : hIni,
        espacio: h.espacio || "",
      };
    });
  }, [horarios, materiasById, carrerasById]);

  const carrerasConDatos = useMemo(() => {
    const idsConHorarios = new Set(
      allRows.map((r) => r.carrera_id).filter(Boolean),
    );
    const idsConMaterias = new Set(
      materias.map((m) => m.carrera).filter(Boolean),
    );
    const activas = carreras.filter(
      (c) => idsConHorarios.has(c.id) || idsConMaterias.has(c.id),
    );
    return activas.length > 0 ? activas : carreras;
  }, [carreras, allRows, materias]);

  const comisionesDisponibles = useMemo(() => {
    const subset = allRows.filter((r) => {
      if (filterCarrera !== "" && r.carrera_id !== filterCarrera) return false;
      if (filterNivel && r.nivel !== filterNivel) return false;
      return true;
    });
    return [
      ...new Set(subset.map((r) => r.comision).filter((c) => c.trim() !== "")),
    ].sort();
  }, [allRows, filterCarrera, filterNivel]);

  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      if (filterCarrera !== "" && r.carrera_id !== filterCarrera) return false;
      if (filterNivel && r.nivel !== filterNivel) return false;
      if (filterComision && r.comision !== filterComision) return false;
      if (filterDia && r.dia_semana !== filterDia) return false;
      return true;
    });
  }, [allRows, filterCarrera, filterNivel, filterComision, filterDia]);

  const getNivelesForCarreraId = useCallback(
    (cId: number | "") => {
      if (cId === "") return [];
      const set = new Set(
        allRows.filter((r) => r.carrera_id === cId).map((r) => r.nivel),
      );
      return NIVELES.filter((n) => set.has(n.value));
    },
    [allRows],
  );

  const getComisionesForCarreraNivel = useCallback(
    (cId: number | "", niv: string) => {
      if (cId === "" || !niv) return [];
      return [
        ...new Set(
          allRows
            .filter((r) => r.carrera_id === cId && r.nivel === niv)
            .map((r) => r.comision)
            .filter((c) => c.trim() !== ""),
        ),
      ].sort();
    },
    [allRows],
  );

  const gridNiveles = useMemo(
    () => getNivelesForCarreraId(gridCarrera),
    [getNivelesForCarreraId, gridCarrera],
  );

  const gridComisiones = useMemo(
    () => getComisionesForCarreraNivel(gridCarrera, gridNivel),
    [getComisionesForCarreraNivel, gridCarrera, gridNivel],
  );

  const gridClases: Clase[] = useMemo(() => {
    if (gridCarrera === "" || !gridNivel || !gridComision) return [];
    return allRows
      .filter(
        (r) =>
          r.carrera_id === gridCarrera &&
          r.nivel === gridNivel &&
          r.comision === gridComision,
      )
      .map((r) => ({
        id: r.id,
        carrera_codigo: r.carrera_codigo,
        carrera_nombre: r.carrera_nombre || r.carrera_codigo,
        materia: r.materia,
        nivel: r.nivel,
        comision: r.comision,
        materia_nombre: r.materia_nombre,
        hora_inicio: r.hora_inicio,
        hora_fin: r.hora_fin,
        dia_semana: r.dia_semana,
        aula: r.espacio,
      }));
  }, [allRows, gridCarrera, gridNivel, gridComision]);

  const handleOpenGridModal = useCallback(() => {
    const carrerasConHorarios = carrerasConDatos.filter((c) =>
      allRows.some((r) => r.carrera_id === c.id),
    );
    const defaultCarrera =
      filterCarrera !== "" &&
      carrerasConHorarios.some((c) => c.id === filterCarrera)
        ? filterCarrera
        : (carrerasConHorarios[0]?.id ?? carrerasConDatos[0]?.id ?? "");

    const nivelesDisp = getNivelesForCarreraId(defaultCarrera);
    const defaultNivel =
      filterNivel && nivelesDisp.some((n) => n.value === filterNivel)
        ? filterNivel
        : (nivelesDisp[0]?.value ?? "");

    const comsDisp = getComisionesForCarreraNivel(defaultCarrera, defaultNivel);
    const defaultComision =
      filterComision && comsDisp.includes(filterComision)
        ? filterComision
        : (comsDisp[0] ?? "");

    setGridCarrera(defaultCarrera);
    setGridNivel(defaultNivel);
    setGridComision(defaultComision);
    setShowGridModal(true);
  }, [
    carrerasConDatos,
    allRows,
    filterCarrera,
    getNivelesForCarreraId,
    filterNivel,
    getComisionesForCarreraNivel,
    filterComision,
  ]);

  function handleGridCarreraChange(val: string) {
    const nextCarrera = val ? Number(val) : "";
    const nextNiveles = getNivelesForCarreraId(nextCarrera);
    const nextNivel = nextNiveles.some((n) => n.value === gridNivel)
      ? gridNivel
      : (nextNiveles[0]?.value ?? "");
    const nextComs = getComisionesForCarreraNivel(nextCarrera, nextNivel);
    const nextComision = nextComs.includes(gridComision)
      ? gridComision
      : (nextComs[0] ?? "");

    setGridCarrera(nextCarrera);
    setGridNivel(nextNivel);
    setGridComision(nextComision);
  }

  function handleGridNivelChange(nextNivel: string) {
    const nextComs = getComisionesForCarreraNivel(gridCarrera, nextNivel);
    const nextComision = nextComs.includes(gridComision)
      ? gridComision
      : (nextComs[0] ?? "");

    setGridNivel(nextNivel);
    setGridComision(nextComision);
  }

  const handleCarreraChange = useCallback((value: number | "") => {
    setFilterCarrera(value);
    setFilterComision("");
  }, []);

  const handleNivelChange = useCallback((value: string) => {
    setFilterNivel(value);
    setFilterComision("");
  }, []);

  function handleCreate() {
    setSelectedFormCarrera(filterCarrera !== "" ? Number(filterCarrera) : null);
    setEditingRow(null);
    setShowForm(true);
  }

  const handleEdit = useCallback((row: HorarioRow) => {
    setSelectedFormCarrera(row.carrera_id || null);
    setEditingRow(row);
    setShowForm(true);
  }, []);

  function handleFormChange(
    name: string,
    value: unknown,
    setFormData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
  ) {
    if (name === "carrera") {
      const cId = value ? Number(value) : null;
      setSelectedFormCarrera(cId);
      setFormData((prev) => ({ ...prev, materia: "" }));
    }
  }

  const materiasOptions = useMemo(() => {
    const list = selectedFormCarrera
      ? materias.filter(
          (m) => Number(m.carrera) === Number(selectedFormCarrera),
        )
      : materias;
    return list.map((m) => {
      const nLabel = NIVELES.find((n) => n.value === m.nivel)?.label || m.nivel;
      return {
        value: m.id,
        label: selectedFormCarrera
          ? `${m.nombre} (${nLabel})`
          : `${m.nombre} - ${m.carrera_nombre} (${nLabel})`,
      };
    });
  }, [materias, selectedFormCarrera]);

  const formFields: FormField[] = useMemo(
    () => [
      {
        name: "carrera",
        label: "Carrera",
        type: "select",
        required: false,
        options: carreras.map((c) => ({ value: c.id, label: c.nombre })),
        placeholder: "Todas las carreras",
      },
      {
        name: "materia",
        label: "Materia",
        type: "select",
        required: true,
        options: materiasOptions,
        placeholder: "Seleccionar materia...",
      },
      {
        name: "comision",
        label: "Comisión",
        type: "text",
        required: true,
        placeholder: "Ej: 1ro A, 1ro - C1, Recursantes",
        half: true,
      },
      {
        name: "espacio",
        label: "Espacio / Aula",
        type: "text",
        required: false,
        placeholder: "Ej: Aula 2.4, X0.5, Lab. Química",
        half: true,
      },
      {
        name: "dia_semana",
        label: "Día de la semana",
        type: "select",
        required: true,
        options: DIAS_SEMANA.map((d) => ({ value: d.value, label: d.label })),
        placeholder: "Seleccionar día...",
      },
      {
        name: "hora_inicio",
        label: "Hora de inicio",
        type: "time",
        required: true,
        defaultValue: "07:45",
        half: true,
      },
      {
        name: "hora_fin",
        label: "Hora de fin",
        type: "time",
        required: true,
        defaultValue: "10:00",
        half: true,
      },
    ],
    [carreras, materiasOptions],
  );

  async function handleSubmit(formData: Record<string, unknown>) {
    const payload = {
      materia: Number(formData.materia),
      comision: String(formData.comision || "").trim(),
      espacio: String(formData.espacio || "").trim(),
      dia_semana: String(formData.dia_semana || "lunes"),
      hora_inicio: String(formData.hora_inicio || "07:45"),
      hora_fin: String(formData.hora_fin || "10:00"),
    };

    if (editingRow) {
      await updateHorario(editingRow.id, payload);
      sileo.success({ title: "Horario actualizado" });
    } else {
      await createHorario(payload);
      sileo.success({ title: "Horario creado" });
    }
    await loadData();
  }

  async function handleConfirmDelete() {
    if (!deletingRow) return;
    try {
      await deleteHorario(deletingRow.id);
      sileo.success({ title: "Horario eliminado" });
      await loadData();
    } catch (err) {
      sileo.error({
        title: "Error al eliminar",
        description:
          err instanceof Error ? err.message : "Error al eliminar el horario",
      });
    }
  }

  const hasActiveFilters =
    filterCarrera !== "" ||
    filterNivel !== "" ||
    filterComision !== "" ||
    filterDia !== "";

  const vaciarTargetLabel = useMemo(() => {
    if (!hasActiveFilters) {
      return `todos los horarios cargados (${allRows.length} registros)`;
    }
    const parts: string[] = [];
    if (filterCarrera !== "") {
      const car = carrerasById.get(Number(filterCarrera));
      if (car) {
        parts.push(car.codigo ? `${car.codigo} - ${car.nombre}` : car.nombre);
      }
    }
    if (filterNivel) {
      const nivLabel =
        NIVELES.find((n) => n.value === filterNivel)?.label || filterNivel;
      parts.push(`Nivel ${nivLabel}`);
    }
    if (filterComision) {
      parts.push(`Comisión ${filterComision}`);
    }
    if (filterDia) {
      parts.push(DIA_FULL_LABELS[filterDia] || filterDia);
    }
    return `los horarios de ${parts.join(" · ")} (${filteredRows.length} registros)`;
  }, [
    hasActiveFilters,
    allRows.length,
    filterCarrera,
    carrerasById,
    filterNivel,
    filterComision,
    filterDia,
    filteredRows.length,
  ]);

  async function handleConfirmVaciar() {
    try {
      const res = await vaciarHorarios({
        carrera: filterCarrera !== "" ? Number(filterCarrera) : undefined,
        nivel: filterNivel || undefined,
        comision: filterComision || undefined,
        dia_semana: filterDia || undefined,
      });
      setFilterCarrera("");
      setFilterNivel("");
      setFilterComision("");
      setFilterDia("");
      sileo.success({
        title: "Horarios vaciados",
        description: `Se eliminaron ${res.eliminados} horarios correctamente.`,
      });
      await loadData();
    } catch (err) {
      sileo.error({
        title: "Error al vaciar horarios",
        description:
          err instanceof Error
            ? err.message
            : "No se pudieron eliminar los horarios",
      });
    }
  }

  const filterSlot = useMemo(
    () => (
      <>
        <Select
          role="combobox"
          align="left"
          colorVariant="gray"
          aria-label="Filtrar por carrera"
          value={filterCarrera === "" ? "" : String(filterCarrera)}
          onChange={(val) => handleCarreraChange(val ? Number(val) : "")}
          options={[
            { value: "", label: "Todas las carreras" },
            ...carrerasConDatos.map((c) => ({
              value: String(c.id),
              label: c.codigo ? `${c.codigo} - ${c.nombre}` : c.nombre,
            })),
          ]}
          triggerClassName="px-4 py-2 font-medium"
        />

        <Select
          role="combobox"
          align="left"
          colorVariant="gray"
          aria-label="Filtrar por nivel"
          value={filterNivel}
          onChange={handleNivelChange}
          options={[
            { value: "", label: "Todos los niveles" },
            ...NIVELES.map((n) => ({ value: n.value, label: n.label })),
          ]}
          triggerClassName="px-4 py-2 font-medium"
        />

        {comisionesDisponibles.length > 0 && (
          <Select
            role="combobox"
            align="left"
            colorVariant="gray"
            aria-label="Filtrar por comisión"
            value={filterComision}
            onChange={setFilterComision}
            options={[
              { value: "", label: "Todas las comisiones" },
              ...comisionesDisponibles.map((com) => ({
                value: com,
                label: com,
              })),
            ]}
            triggerClassName="px-4 py-2 font-medium"
          />
        )}

        <Select
          role="combobox"
          align="left"
          colorVariant="gray"
          aria-label="Filtrar por día"
          value={filterDia}
          onChange={setFilterDia}
          options={[
            { value: "", label: "Todos los días" },
            ...DIAS_SEMANA.map((d) => ({ value: d.value, label: d.label })),
          ]}
          triggerClassName="px-4 py-2 font-medium"
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setFilterCarrera("");
              setFilterNivel("");
              setFilterComision("");
              setFilterDia("");
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </>
    ),
    [
      filterCarrera,
      carrerasConDatos,
      handleCarreraChange,
      filterNivel,
      handleNivelChange,
      comisionesDisponibles,
      filterComision,
      filterDia,
      hasActiveFilters,
    ],
  );

  const rightSlot = useMemo(
    () =>
      allRows.length > 0 ? (
        <Button
          variant="secondary"
          onClick={handleOpenGridModal}
          className="gap-2"
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          Vista semanal
        </Button>
      ) : undefined,
    [allRows.length, handleOpenGridModal],
  );

  useEffect(() => {
    if (!showGridModal || showForm) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowGridModal(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showGridModal, showForm]);

  if (loading) {
    return <AdminSchedulesSkeleton />;
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Horarios de cursado"
        subtitle="Gestión de comisiones, aulas y bloques horarios"
        onCreate={handleCreate}
        createLabel="Nuevo"
      >
        {filteredRows.length > 0 && (
          <Button
            variant="danger"
            onClick={() => setShowVaciarModal(true)}
            className="gap-2"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Vaciar
          </Button>
        )}

        <Button variant="primary" onClick={() => setShowImportModal(true)}>
          Importar
        </Button>
      </PageHeader>

      <DataTable
        data={filteredRows}
        columns={columns}
        onEdit={handleEdit}
        onDelete={setDeletingRow}
        searchPlaceholder="Buscar por materia, comisión, aula o carrera..."
        label="horarios"
        filterSlot={filterSlot}
        rightSlot={rightSlot}
      />

      <AnimatePresence>
        {showGridModal && (
          <motion.div
            key="grid-modal"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-8"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowGridModal(false);
            }}
          >
            <motion.div
              variants={modalPanelVariants}
              className="bg-white rounded-4xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
            >
              <div className="px-8 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Vista semanal
                  </h2>
                  <span className="text-xs text-gray-500">
                    Hacé clic en un bloque para editar su horario
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Select
                    role="combobox"
                    align="left"
                    colorVariant="gray"
                    aria-label="Carrera de la grilla"
                    value={gridCarrera === "" ? "" : String(gridCarrera)}
                    onChange={handleGridCarreraChange}
                    options={carrerasConDatos.map((c) => ({
                      value: String(c.id),
                      label: c.codigo ? `${c.codigo} - ${c.nombre}` : c.nombre,
                    }))}
                    placeholder="Carrera"
                    triggerClassName="px-4 py-2 font-medium"
                  />

                  {gridNiveles.length > 0 && (
                    <Select
                      role="combobox"
                      align="left"
                      colorVariant="gray"
                      aria-label="Nivel de la grilla"
                      value={gridNivel}
                      onChange={handleGridNivelChange}
                      options={gridNiveles.map((n) => ({
                        value: n.value,
                        label: n.label,
                      }))}
                      placeholder="Nivel"
                      triggerClassName="px-4 py-2 font-medium"
                    />
                  )}

                  {gridComisiones.length > 0 && (
                    <Select
                      role="combobox"
                      align="left"
                      colorVariant="gray"
                      aria-label="Comisión de la grilla"
                      value={gridComision}
                      onChange={setGridComision}
                      options={gridComisiones.map((com) => ({
                        value: com,
                        label: com,
                      }))}
                      placeholder="Comisión"
                      triggerClassName="px-4 py-2 font-medium"
                    />
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => setShowGridModal(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-gray-50/40">
                <Schedule
                  items={gridClases}
                  compact
                  onItemClick={(item) => {
                    const row = allRows.find((r) => r.id === item.id);
                    if (row) handleEdit(row);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}

        {showForm && (
          <DataFormModal
            key="form-modal"
            title={
              editingRow
                ? "Editar horario de cursado"
                : "Nuevo horario de cursado"
            }
            fields={formFields}
            initialData={
              editingRow
                ? {
                    carrera: editingRow.carrera_id || "",
                    materia: editingRow.materia,
                    comision: editingRow.comision,
                    espacio: editingRow.espacio,
                    dia_semana: editingRow.dia_semana,
                    hora_inicio: editingRow.hora_inicio,
                    hora_fin: editingRow.hora_fin,
                  }
                : {
                    carrera: filterCarrera !== "" ? filterCarrera : "",
                    materia: "",
                    comision: filterComision || "",
                    espacio: "",
                    dia_semana: filterDia || "lunes",
                    hora_inicio: "07:45",
                    hora_fin: "10:00",
                  }
            }
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onClose={() => {
              setShowForm(false);
              setEditingRow(null);
              setSelectedFormCarrera(null);
            }}
          />
        )}

        {deletingRow && (
          <ConfirmDeleteModal
            key="delete-modal"
            title="Eliminar horario"
            itemName={`${deletingRow.materia_nombre} (${deletingRow.comision}) - ${deletingRow.dia_label} ${deletingRow.horario_str}${deletingRow.espacio ? ` [${deletingRow.espacio}]` : ""}`}
            onConfirm={handleConfirmDelete}
            onClose={() => setDeletingRow(null)}
          />
        )}

        {showVaciarModal && (
          <ConfirmDeleteModal
            key="vaciar-modal"
            title="Vaciar horarios"
            itemName={vaciarTargetLabel}
            onConfirm={handleConfirmVaciar}
            onClose={() => setShowVaciarModal(false)}
          />
        )}

        {showImportModal && (
          <ImportCsvModal
            key="import-modal"
            title="Importar horarios de cursado"
            onClose={() => setShowImportModal(false)}
            onImport={importarHorariosCSV}
            onSuccess={(res: CsvImportResult) => {
              const exito = res.exito ?? (res.totales?.errores ?? 0) === 0;
              if (exito) {
                sileo.success({
                  title: "Importación exitosa",
                  description:
                    res.detail || "Importación realizada exitosamente.",
                });
              } else {
                sileo.error({
                  title: "La importación falló",
                  description: res.detail || "No se guardó ningún registro.",
                });
              }
              loadData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
