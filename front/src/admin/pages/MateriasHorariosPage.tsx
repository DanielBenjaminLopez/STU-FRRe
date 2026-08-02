import { useEffect, useState } from "react";
import {
  fetchPlanMaterias,
  createPlanMateria,
  deletePlanMateria,
  fetchComisiones,
  createComision,
  deleteComision,
  fetchHorarios,
  createHorario,
  deleteHorario,
  fetchEspaciosForSelect,
  DIAS_SEMANA,
  NIVELES,
  MODALIDADES,
  PLANES,
  type PlanMateria,
  type Comision,
  type HorarioCursado,
} from "../../shared/api/horariosAdmin";
import { fetchCarreras, type Carrera } from "../../shared/api/carreras";
import {
  fetchMaterias,
  createMateria,
  type Materia,
} from "../../shared/api/materias";
import type { Espacio } from "../../shared/api/totems";

const DIA_LABELS: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mie",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sab",
};

interface HorarioGroup {
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  espacios: { id: number; nombre: string }[];
  activo: boolean;
  horario_ids: number[];
}

interface ComisionConHorarios extends Comision {
  horarios_agrupados: HorarioGroup[];
}

interface PlanMateriaConComisiones extends PlanMateria {
  comisiones: ComisionConHorarios[];
  expanded?: boolean;
}

function MateriasHorariosPage() {
  const [data, setData] = useState<PlanMateriaConComisiones[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [filterCarrera, setFilterCarrera] = useState<number | "">("");
  const [filterNivel, setFilterNivel] = useState("");
  const [filterModalidad, setFilterModalidad] = useState("");

  const [showCreateMateria, setShowCreateMateria] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  function reload() {
    setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    let active = true;
    async function init() {
      if (!active) return;
      setLoading(true);
      setError("");
      try {
        const filters: {
          carrera?: number;
          nivel?: string;
          modalidad?: string;
        } = {};
        if (filterCarrera !== "") filters.carrera = filterCarrera;
        if (filterNivel) filters.nivel = filterNivel;
        if (filterModalidad) filters.modalidad = filterModalidad;

        const [planMaterias, allComisiones, allHorarios, esp, car] =
          await Promise.all([
            fetchPlanMaterias(filters),
            fetchComisiones(),
            fetchHorarios(),
            fetchEspaciosForSelect(),
            fetchCarreras(),
          ]);

        if (!active) return;
        setEspacios(esp);
        setCarreras(car);

        const comisionMap = new Map<number, Comision[]>();
        for (const c of allComisiones) {
          const list = comisionMap.get(c.plan_materia) || [];
          list.push(c);
          comisionMap.set(c.plan_materia, list);
        }

        const horarioMap = new Map<number, HorarioCursado[]>();
        for (const h of allHorarios) {
          if (h.comision) {
            const list = horarioMap.get(h.comision) || [];
            list.push(h);
            horarioMap.set(h.comision, list);
          }
        }

        const espacioMap = new Map(esp.map((e) => [e.id, e]));

        const result: PlanMateriaConComisiones[] = planMaterias.map((pm) => {
          const comisiones = (comisionMap.get(pm.id) || []).map((c) => {
            const horarios = horarioMap.get(c.id) || [];
            const groups = new Map<string, HorarioGroup>();

            for (const h of horarios) {
              const key = `${h.dia_semana}|${h.hora_inicio}|${h.hora_fin}`;
              if (!groups.has(key)) {
                groups.set(key, {
                  dia_semana: h.dia_semana,
                  hora_inicio: h.hora_inicio,
                  hora_fin: h.hora_fin,
                  espacios: [],
                  activo: h.activo,
                  horario_ids: [],
                });
              }
              const g = groups.get(key)!;
              g.horario_ids.push(h.id);
              const espacio = espacioMap.get(h.espacio);
              if (espacio) {
                g.espacios.push({ id: espacio.id, nombre: espacio.nombre });
              }
            }

            return {
              ...c,
              horarios_agrupados: Array.from(groups.values()),
            };
          });

          return { ...pm, comisiones };
        });

        setData(result);
      } catch {
        if (active) setError("Error al cargar datos");
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [filterCarrera, filterNivel, filterModalidad, reloadKey]);

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateMateria(formData: {
    nombre: string;
    carrera: number;
    nivel: string;
    modalidad: string;
    cuatrimestre?: string;
    plan_estudio: string;
    comision_nombre: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    espacios: number[];
  }) {
    try {
      let materia: Materia;
      const materiasExistentes = await fetchMaterias();
      const existente = materiasExistentes.find(
        (m) => m.nombre === formData.nombre,
      );
      if (existente) {
        materia = existente;
      } else {
        materia = await createMateria({ nombre: formData.nombre });
      }

      const planMateria = await createPlanMateria({
        carrera: formData.carrera,
        materia: materia.id,
        nivel: formData.nivel,
        modalidad: formData.modalidad,
        cuatrimestre:
          formData.modalidad === "cuatrimestral"
            ? formData.cuatrimestre || "primero"
            : null,
        plan_estudio: formData.plan_estudio,
      });

      const comision = await createComision({
        plan_materia: planMateria.id,
        nombre: formData.comision_nombre,
      });

      for (const espacioId of formData.espacios) {
        await createHorario({
          comision: comision.id,
          espacio: espacioId,
          dia_semana: formData.dia_semana,
          hora_inicio: formData.hora_inicio,
          hora_fin: formData.hora_fin,
          activo: true,
        });
      }

      setShowCreateMateria(false);
      setSuccess("Materia creada correctamente");
      setTimeout(() => setSuccess(""), 3000);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear materia");
    }
  }

  async function handleAddComision(planMateriaId: number, nombre: string) {
    try {
      const comision = await createComision({
        plan_materia: planMateriaId,
        nombre,
      });
      await createHorario({
        comision: comision.id,
        espacio: espacios[0]?.id ?? 1,
        dia_semana: "lunes",
        hora_inicio: "07:45",
        hora_fin: "08:30",
        activo: true,
      });
      setSuccess("Comision creada");
      setTimeout(() => setSuccess(""), 3000);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear comision");
    }
  }

  async function handleDeleteComision(comisionId: number) {
    try {
      await deleteComision(comisionId);
      setSuccess("Comision eliminada");
      setTimeout(() => setSuccess(""), 3000);
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar comision",
      );
    }
  }

  async function handleAddHorario(
    comisionId: number,
    dia: string,
    horaInicio: string,
    horaFin: string,
    espacioIds: number[],
  ) {
    try {
      for (const eid of espacioIds) {
        await createHorario({
          comision: comisionId,
          espacio: eid,
          dia_semana: dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          activo: true,
        });
      }
      setSuccess("Horario agregado");
      setTimeout(() => setSuccess(""), 3000);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar horario");
    }
  }

  async function handleDeleteHorarioGroup(horarioIds: number[]) {
    try {
      for (const id of horarioIds) {
        await deleteHorario(id);
      }
      setSuccess("Horario eliminado");
      setTimeout(() => setSuccess(""), 3000);
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar horario",
      );
    }
  }

  async function handleDeletePlanMateria(planMateriaId: number) {
    try {
      await deletePlanMateria(planMateriaId);
      setSuccess("Materia eliminada");
      setTimeout(() => setSuccess(""), 3000);
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar materia",
      );
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 text-sm text-gray-600 py-8">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Cargando...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Materias y Horarios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestion de materias, comisiones y horarios de cursado
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <select
          value={filterCarrera}
          onChange={(e) =>
            setFilterCarrera(e.target.value ? Number(e.target.value) : "")
          }
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">Todas las carreras</option>
          {carreras.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select
          value={filterNivel}
          onChange={(e) => setFilterNivel(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">Todos los niveles</option>
          {NIVELES.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
        <select
          value={filterModalidad}
          onChange={(e) => setFilterModalidad(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">Todas las modalidades</option>
          {MODALIDADES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowCreateMateria(true)}
          className="px-5 py-2 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors"
        >
          + Crear materia
        </button>
      </div>

      <div className="space-y-3">
        {data.map((pm) => (
          <MateriaCard
            key={pm.id}
            planMateria={pm}
            expanded={expandedIds.has(pm.id)}
            onToggle={() => toggleExpand(pm.id)}
            onAddComision={handleAddComision}
            onDeleteComision={handleDeleteComision}
            onAddHorario={handleAddHorario}
            onDeleteHorarioGroup={handleDeleteHorarioGroup}
            onDeletePlanMateria={handleDeletePlanMateria}
            espacios={espacios}
          />
        ))}
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No se encontraron materias. Creá una nueva materia para comenzar.
          </div>
        )}
      </div>

      {showCreateMateria && (
        <CreateMateriaModal
          carreras={carreras}
          espacios={espacios}
          onSubmit={handleCreateMateria}
          onClose={() => setShowCreateMateria(false)}
        />
      )}
    </div>
  );
}

function MateriaCard({
  planMateria: pm,
  expanded,
  onToggle,
  onAddComision,
  onDeleteComision,
  onAddHorario,
  onDeleteHorarioGroup,
  onDeletePlanMateria,
  espacios,
}: {
  planMateria: PlanMateriaConComisiones;
  expanded: boolean;
  onToggle: () => void;
  onAddComision: (planMateriaId: number, nombre: string) => Promise<void>;
  onDeleteComision: (comisionId: number) => Promise<void>;
  onAddHorario: (
    comisionId: number,
    dia: string,
    horaInicio: string,
    horaFin: string,
    espacioIds: number[],
  ) => Promise<void>;
  onDeleteHorarioGroup: (horarioIds: number[]) => Promise<void>;
  onDeletePlanMateria: (planMateriaId: number) => Promise<void>;
  espacios: Espacio[];
}) {
  const [showAddComision, setShowAddComision] = useState(false);
  const [newComisionNombre, setNewComisionNombre] = useState("");

  const nivelLabel =
    NIVELES.find((n) => n.value === pm.nivel)?.label || pm.nivel;
  const modalidadLabel =
    MODALIDADES.find((m) => m.value === pm.modalidad)?.label || pm.modalidad;

  async function handleAddComision() {
    if (!newComisionNombre.trim()) return;
    await onAddComision(pm.id, newComisionNombre.trim());
    setNewComisionNombre("");
    setShowAddComision(false);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{pm.materia_nombre}</h3>
          <p className="text-xs text-gray-500">
            {pm.carrera_nombre} | Nivel {nivelLabel} | {modalidadLabel}
            {pm.cuatrimestre && ` - ${pm.cuatrimestre}er cuatrimestre`}
            {` | Plan ${pm.plan_estudio}`}
          </p>
        </div>
        <span className="text-xs text-gray-400">
          {pm.comisiones.length} comision(es)
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (
              confirm("Eliminar esta materia y todas sus comisiones/horarios?")
            ) {
              onDeletePlanMateria(pm.id);
            }
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar materia"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100">
          {pm.comisiones.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">
              No hay comisiones. Agregá una para comenzar.
            </p>
          ) : (
            <div className="space-y-3 pt-3">
              {pm.comisiones.map((c) => (
                <ComisionBlock
                  key={c.id}
                  comision={c}
                  onDelete={() => onDeleteComision(c.id)}
                  onAddHorario={onAddHorario}
                  onDeleteHorarioGroup={onDeleteHorarioGroup}
                  espacios={espacios}
                />
              ))}
            </div>
          )}

          {showAddComision ? (
            <div className="flex items-center gap-2 mt-3">
              <input
                value={newComisionNombre}
                onChange={(e) => setNewComisionNombre(e.target.value)}
                placeholder="Nombre (ej: K1)"
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-32"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAddComision()}
              />
              <button
                type="button"
                onClick={handleAddComision}
                className="px-3 py-1.5 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddComision(false);
                  setNewComisionNombre("");
                }}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddComision(true)}
              className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Agregar comision
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ComisionBlock({
  comision: c,
  onDelete,
  onAddHorario,
  onDeleteHorarioGroup,
  espacios,
}: {
  comision: ComisionConHorarios;
  onDelete: () => void;
  onAddHorario: (
    comisionId: number,
    dia: string,
    horaInicio: string,
    horaFin: string,
    espacioIds: number[],
  ) => Promise<void>;
  onDeleteHorarioGroup: (horarioIds: number[]) => Promise<void>;
  espacios: Espacio[];
}) {
  const [showAddHorario, setShowAddHorario] = useState(false);
  const [newDia, setNewDia] = useState("lunes");
  const [newInicio, setNewInicio] = useState("07:45");
  const [newFin, setNewFin] = useState("08:30");
  const [newEspacios, setNewEspacios] = useState<number[]>([]);

  async function handleAddHorario() {
    if (newEspacios.length === 0) return;
    await onAddHorario(c.id, newDia, newInicio, newFin, newEspacios);
    setShowAddHorario(false);
    setNewEspacios([]);
  }

  function toggleEspacio(id: number) {
    setNewEspacios((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Comision: {c.nombre}
        </span>
        <button
          type="button"
          onClick={() => {
            if (confirm("Eliminar esta comision y sus horarios?")) onDelete();
          }}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          Eliminar
        </button>
      </div>

      {c.horarios_agrupados.length > 0 ? (
        <div className="space-y-1.5">
          {c.horarios_agrupados.map((g, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-gray-600"
            >
              <span className="font-medium w-8">
                {DIA_LABELS[g.dia_semana]}
              </span>
              <span>
                {g.hora_inicio} - {g.hora_fin}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">
                {g.espacios.map((e) => e.nombre).join(", ")}
              </span>
              <button
                type="button"
                onClick={() => onDeleteHorarioGroup(g.horario_ids)}
                className="ml-auto text-gray-400 hover:text-red-500"
                title="Eliminar horario"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">Sin horarios</p>
      )}

      {showAddHorario ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <select
            value={newDia}
            onChange={(e) => setNewDia(e.target.value)}
            className="px-2 py-1 border border-gray-200 rounded-lg bg-white"
          >
            {DIAS_SEMANA.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={newInicio}
            onChange={(e) => setNewInicio(e.target.value)}
            className="px-2 py-1 border border-gray-200 rounded-lg"
          />
          <span>a</span>
          <input
            type="time"
            value={newFin}
            onChange={(e) => setNewFin(e.target.value)}
            className="px-2 py-1 border border-gray-200 rounded-lg"
          />
          <div className="flex flex-wrap gap-1">
            {espacios.map((esp) => (
              <label
                key={esp.id}
                className={`px-2 py-0.5 rounded-lg border cursor-pointer transition-colors ${
                  newEspacios.includes(esp.id)
                    ? "bg-black text-white border-black"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={newEspacios.includes(esp.id)}
                  onChange={() => toggleEspacio(esp.id)}
                  className="hidden"
                />
                {esp.nombre}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddHorario}
            className="px-3 py-1 text-white bg-black rounded-lg hover:bg-gray-800"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setShowAddHorario(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddHorario(true)}
          className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Agregar horario
        </button>
      )}
    </div>
  );
}

function CreateMateriaModal({
  carreras,
  espacios,
  onSubmit,
  onClose,
}: {
  carreras: Carrera[];
  espacios: Espacio[];
  onSubmit: (data: {
    nombre: string;
    carrera: number;
    nivel: string;
    modalidad: string;
    cuatrimestre?: string;
    plan_estudio: string;
    comision_nombre: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    espacios: number[];
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [carrera, setCarrera] = useState<number>(carreras[0]?.id ?? 0);
  const [nivel, setNivel] = useState("primero");
  const [modalidad, setModalidad] = useState("anual");
  const [cuatrimestre, setCuatrimestre] = useState("primero");
  const [planEstudio, setPlanEstudio] = useState("2023");
  const [comisionNombre, setComisionNombre] = useState("Unica");
  const [diaSemana, setDiaSemana] = useState("lunes");
  const [horaInicio, setHoraInicio] = useState("07:45");
  const [horaFin, setHoraFin] = useState("08:30");
  const [selectedEspacios, setSelectedEspacios] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleEspacio(id: number) {
    setSelectedEspacios((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !carrera || selectedEspacios.length === 0) {
      setError("Completa todos los campos obligatorios");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit({
        nombre: nombre.trim(),
        carrera,
        nivel,
        modalidad,
        cuatrimestre: modalidad === "cuatrimestral" ? cuatrimestre : undefined,
        plan_estudio: planEstudio,
        comision_nombre: comisionNombre.trim() || "Unica",
        dia_semana: diaSemana,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        espacios: selectedEspacios,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-4xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 className="text-xl font-semibold">Crear materia</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg p-1"
          >
            &times;
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-8 pb-8 overflow-y-auto"
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Nombre *</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Ej: Analisis Matematico I"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Carrera *</span>
            <select
              value={carrera}
              onChange={(e) => setCarrera(Number(e.target.value))}
              required
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Nivel *</span>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                {NIVELES.map((n) => (
                  <option key={n.value} value={n.value}>
                    {n.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Modalidad *</span>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                {MODALIDADES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {modalidad === "cuatrimestral" && (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Cuatrimestre</span>
              <select
                value={cuatrimestre}
                onChange={(e) => setCuatrimestre(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <option value="primero">1er cuatrimestre</option>
                <option value="segundo">2do cuatrimestre</option>
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Plan de estudio</span>
            <select
              value={planEstudio}
              onChange={(e) => setPlanEstudio(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              {PLANES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          <hr className="border-gray-100" />

          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
            Primera comision y horario
          </p>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Comision</span>
            <input
              value={comisionNombre}
              onChange={(e) => setComisionNombre(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Ej: K1, Unica"
            />
          </label>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Dia</span>
              <select
                value={diaSemana}
                onChange={(e) => setDiaSemana(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Inicio</span>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-gray-700">Fin</span>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700">Espacios *</span>
            <div className="flex flex-wrap gap-1.5">
              {espacios.map((esp) => (
                <label
                  key={esp.id}
                  className={`px-3 py-1 rounded-lg border cursor-pointer transition-colors text-xs ${
                    selectedEspacios.includes(esp.id)
                      ? "bg-black text-white border-black"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedEspacios.includes(esp.id)}
                    onChange={() => toggleEspacio(esp.id)}
                    className="hidden"
                  />
                  {esp.nombre}
                </label>
              ))}
            </div>
          </label>

          {error && <span className="text-red-500 text-sm">{error}</span>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-black rounded-2xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear materia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MateriasHorariosPage;
