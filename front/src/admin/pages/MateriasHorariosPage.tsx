import { useEffect, useMemo, useState } from "react";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import TipoCarreraBadge from "../components/TipoCarreraBadge";
import UploadZone from "../components/UploadZone";
import PreviewTable, { type PreviewRow } from "../components/PreviewTable";
import {
  fetchPlanMaterias,
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
  type PlanMateria,
  type Comision,
  type HorarioCursado,
} from "../../shared/api/horariosAdmin";
import { fetchCarreras, type Carrera } from "../../shared/api/carreras";
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

type UploadStep = "idle" | "uploading" | "preview" | "done";

function MateriasHorariosPage() {
  const [data, setData] = useState<PlanMateriaConComisiones[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [filterTipo, setFilterTipo] = useState<
    "" | "grado" | "tecnica" | "posgrado" | "diplomatura"
  >("");
  const [filterCarrera, setFilterCarrera] = useState<number | "">("");
  const [filterNivel, setFilterNivel] = useState("");
  const [filterSoloCuatri, setFilterSoloCuatri] = useState(false);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "materia" | "comision" | "horario";
    id: number | number[];
    name: string;
  } | null>(null);

  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [previewMeta, setPreviewMeta] = useState({
    fileName: "",
    totalHorarios: 0,
    totalPaginas: 0,
  });

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
        if (filterSoloCuatri) filters.modalidad = "cuatrimestral";

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
  }, [filterCarrera, filterNivel, filterSoloCuatri, reloadKey]);

  const TIPO_OPTIONS = [
    { value: "", label: "Todos los tipos" },
    { value: "grado", label: "Grado" },
    { value: "tecnica", label: "Tecnicatura" },
    { value: "posgrado", label: "Posgrado" },
    { value: "diplomatura", label: "Diplomatura" },
  ] as const;

  const carrerasFiltradas = useMemo(() => {
    if (!filterTipo) return carreras;
    return carreras.filter((c) => c.tipo === filterTipo);
  }, [carreras, filterTipo]);

  const nivelesDisponibles = useMemo(() => {
    const niveles = new Set(data.map((pm) => pm.nivel));
    return NIVELES.filter((n) => niveles.has(n.value));
  }, [data]);

  function handleTipoChange(
    value: "" | "grado" | "tecnica" | "posgrado" | "diplomatura",
  ) {
    setFilterTipo(value);
    setFilterCarrera("");
    setFilterNivel("");
  }

  function handleCarreraChange(value: number | "") {
    setFilterCarrera(value);
    setFilterNivel("");
  }

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      setSuccess("Comisión creada");
      setTimeout(() => setSuccess(""), 3000);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear comisión");
    }
  }

  async function handleAddHorario(
    comisionId: number,
    dias: string[],
    horaInicio: string,
    horaFin: string,
    espacioIds: number[],
  ) {
    try {
      for (const dia of dias) {
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
      }
      setSuccess("Horario agregado");
      setTimeout(() => setSuccess(""), 3000);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar horario");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "materia") {
        await deletePlanMateria(deleteTarget.id as number);
        setSuccess("Materia eliminada");
      } else if (deleteTarget.type === "comision") {
        await deleteComision(deleteTarget.id as number);
        setSuccess("Comisión eliminada");
      } else if (deleteTarget.type === "horario") {
        for (const id of deleteTarget.id as number[]) {
          await deleteHorario(id);
        }
        setSuccess("Horario eliminado");
      }
      setTimeout(() => setSuccess(""), 3000);
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleUploadFile(_file: File) {
    setUploadStep("uploading");
    setTimeout(() => {
      setPreviewRows([
        {
          anio: "primero",
          comision: "K1",
          materia: "Analisis Matematico I",
          dia: "lunes",
          hora_inicio: "08:00",
          hora_fin: "09:30",
          aula: "A101",
        },
        {
          anio: "primero",
          comision: "K1",
          materia: "Analisis Matematico I",
          dia: "miercoles",
          hora_inicio: "08:00",
          hora_fin: "09:30",
          aula: "A101",
        },
      ]);
      setPreviewMeta({
        fileName: _file.name,
        totalHorarios: 2,
        totalPaginas: 1,
      });
      setUploadStep("preview");
    }, 1500);
  }

  function handleConfirmImport(rows: PreviewRow[]) {
    setUploadStep("done");
    setSuccess(
      `Importación simulada: ${rows.length} horarios procesados. La implementación real se agregará pronto.`,
    );
    setTimeout(() => {
      setSuccess("");
      setUploadStep("idle");
    }, 4000);
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
        <h1 className="text-2xl font-semibold">Horarios de cursado</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestión de comisiones y horarios por materia
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

      {uploadStep === "idle" && (
        <div className="mb-6">
          <UploadZone onFileSelected={handleUploadFile} />
        </div>
      )}

      {uploadStep === "uploading" && (
        <div className="mb-6 px-4 py-8 bg-gray-50 border border-gray-200 rounded-2xl text-center">
          <svg
            className="animate-spin h-6 w-6 text-gray-400 mx-auto mb-3"
            viewBox="0 0 24 24"
            fill="none"
          >
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
          <p className="text-sm text-gray-600">Procesando PDF con OCR...</p>
        </div>
      )}

      {uploadStep === "preview" && (
        <div className="mb-6">
          <PreviewTable
            fileName={previewMeta.fileName}
            totalHorarios={previewMeta.totalHorarios}
            totalPaginas={previewMeta.totalPaginas}
            rows={previewRows}
            onConfirm={handleConfirmImport}
            onCancel={() => {
              setUploadStep("idle");
              setPreviewRows([]);
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select
          value={filterTipo}
          onChange={(e) =>
            handleTipoChange(
              e.target.value as
                | ""
                | "grado"
                | "tecnica"
                | "posgrado"
                | "diplomatura",
            )
          }
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        >
          {TIPO_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={filterCarrera}
          onChange={(e) =>
            handleCarreraChange(e.target.value ? Number(e.target.value) : "")
          }
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
        >
          <option value="">Todas las carreras</option>
          {carrerasFiltradas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <select
          value={filterNivel}
          onChange={(e) => setFilterNivel(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
          disabled={nivelesDisponibles.length === 0}
        >
          <option value="">
            {filterCarrera === "" ? "Todos los niveles" : "Niveles disponibles"}
          </option>
          {nivelesDisponibles.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={filterSoloCuatri}
            onChange={(e) => setFilterSoloCuatri(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-600">Solo cuatrimestrales</span>
        </label>
      </div>

      <div className="space-y-3">
        {data.map((pm) => (
          <MateriaCard
            key={pm.id}
            planMateria={pm}
            expanded={expandedIds.has(pm.id)}
            onToggle={() => toggleExpand(pm.id)}
            onAddComision={handleAddComision}
            onDelete={(name) =>
              setDeleteTarget({ type: "materia", id: pm.id, name })
            }
            onAddHorario={handleAddHorario}
            onDeleteHorarioGroup={(ids, name) =>
              setDeleteTarget({ type: "horario", id: ids, name })
            }
            onDeleteComision={(id, name) =>
              setDeleteTarget({ type: "comision", id, name })
            }
            espacios={espacios}
          />
        ))}
        {data.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            {filterCarrera === ""
              ? "Seleccioná una carrera para ver las materias disponibles."
              : "No se encontraron materias para los filtros seleccionados."}
          </div>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDeleteModal
          title={`Eliminar ${deleteTarget.type}`}
          itemName={deleteTarget.name}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
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
  onDelete,
  onAddHorario,
  onDeleteHorarioGroup,
  onDeleteComision,
  espacios,
}: {
  planMateria: PlanMateriaConComisiones;
  expanded: boolean;
  onToggle: () => void;
  onAddComision: (planMateriaId: number, nombre: string) => Promise<void>;
  onDelete: (name: string) => void;
  onAddHorario: (
    comisionId: number,
    dias: string[],
    horaInicio: string,
    horaFin: string,
    espacioIds: number[],
  ) => Promise<void>;
  onDeleteHorarioGroup: (horarioIds: number[], name: string) => void;
  onDeleteComision: (comisionId: number, name: string) => void;
  espacios: Espacio[];
}) {
  const [showAddComision, setShowAddComision] = useState(false);
  const [newComisionNombre, setNewComisionNombre] = useState("");
  const [showAddHorario, setShowAddHorario] = useState(false);

  const nivelLabel =
    NIVELES.find((n) => n.value === pm.nivel)?.label || pm.nivel;
  const modalidadLabel = pm.modalidad === "anual" ? "Anual" : "Cuatrimestral";

  const cuatrimestreLabel =
    pm.cuatrimestre === "primero"
      ? "1er"
      : pm.cuatrimestre === "segundo"
        ? "2do"
        : pm.cuatrimestre;

  async function handleAddComisionLocal() {
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
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{pm.materia_nombre}</h3>
            <TipoCarreraBadge tipo={pm.carrera_tipo} />
          </div>
          <p className="text-xs text-gray-500">
            {pm.carrera_nombre} | Nivel {nivelLabel} | {modalidadLabel}
            {cuatrimestreLabel && ` - ${cuatrimestreLabel}°`}
            {` | Plan ${pm.plan_estudio}`}
          </p>
        </div>
        <span className="text-xs text-gray-400">
          {pm.comisiones.length} comisión(es)
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(pm.materia_nombre || `Materia #${pm.id}`);
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
                  onDelete={(name) => onDeleteComision(c.id, name)}
                  onAddHorario={onAddHorario}
                  onDeleteHorarioGroup={onDeleteHorarioGroup}
                  espacios={espacios}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 mt-3">
            {showAddComision ? (
              <div className="flex items-center gap-2">
                <input
                  value={newComisionNombre}
                  onChange={(e) => setNewComisionNombre(e.target.value)}
                  placeholder="Nombre (ej: K1)"
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-32"
                  autoFocus
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddComisionLocal()
                  }
                />
                <button
                  type="button"
                  onClick={handleAddComisionLocal}
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
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
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
                Agregar comisión
              </button>
            )}

            {!showAddComision && (
              <button
                type="button"
                onClick={() => setShowAddHorario(!showAddHorario)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors"
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
                Agregar horario
              </button>
            )}
          </div>

          {showAddHorario && (
            <InlineAddHorario
              comisiones={pm.comisiones}
              espacios={espacios}
              onAddHorario={onAddHorario}
              onClose={() => setShowAddHorario(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function InlineAddHorario({
  comisiones,
  espacios,
  onAddHorario,
  onClose,
}: {
  comisiones: Comision[];
  espacios: Espacio[];
  onAddHorario: (
    comisionId: number,
    dias: string[],
    horaInicio: string,
    horaFin: string,
    espacioIds: number[],
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [comisionId, setComisionId] = useState<number>(comisiones[0]?.id ?? 0);
  const [dias, setDias] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState("07:45");
  const [horaFin, setHoraFin] = useState("08:30");
  const [espacioIds, setEspacioIds] = useState<number[]>([]);

  function toggleDia(dia: string) {
    setDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  }

  function toggleEspacio(id: number) {
    setEspacioIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    if (dias.length === 0 || espacioIds.length === 0 || !comisionId) return;
    await onAddHorario(comisionId, dias, horaInicio, horaFin, espacioIds);
    onClose();
  }

  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 font-medium">Comisión:</span>
        <select
          value={comisionId}
          onChange={(e) => setComisionId(Number(e.target.value))}
          className="px-2 py-1 border border-gray-200 rounded-lg bg-white text-xs"
        >
          {comisiones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-1">
        {DIAS_SEMANA.map((d) => (
          <label
            key={d.value}
            className={`px-2 py-0.5 rounded-lg border cursor-pointer transition-colors ${
              dias.includes(d.value)
                ? "bg-black text-white border-black"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            <input
              type="checkbox"
              checked={dias.includes(d.value)}
              onChange={() => toggleDia(d.value)}
              className="hidden"
            />
            {d.label}
          </label>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="time"
          step="300"
          value={horaInicio}
          onChange={(e) => setHoraInicio(e.target.value)}
          className="px-2 py-1 border border-gray-200 rounded-lg"
        />
        <span>a</span>
        <input
          type="time"
          step="300"
          value={horaFin}
          onChange={(e) => setHoraFin(e.target.value)}
          className="px-2 py-1 border border-gray-200 rounded-lg"
        />
        <div className="flex flex-wrap gap-1 ml-2">
          {espacios.map((esp) => (
            <label
              key={esp.id}
              className={`px-2 py-0.5 rounded-lg border cursor-pointer transition-colors ${
                espacioIds.includes(esp.id)
                  ? "bg-black text-white border-black"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={espacioIds.includes(esp.id)}
                onChange={() => toggleEspacio(esp.id)}
                className="hidden"
              />
              {esp.nombre}
            </label>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1 text-white bg-black rounded-lg hover:bg-gray-800"
        >
          OK
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
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
  onDelete: (name: string) => void;
  onAddHorario: (
    comisionId: number,
    dias: string[],
    horaInicio: string,
    horaFin: string,
    espacioIds: number[],
  ) => Promise<void>;
  onDeleteHorarioGroup: (horarioIds: number[], name: string) => void;
  espacios: Espacio[];
}) {
  const [showAddHorario, setShowAddHorario] = useState(false);
  const [newDias, setNewDias] = useState<string[]>([]);
  const [newInicio, setNewInicio] = useState("07:45");
  const [newFin, setNewFin] = useState("08:30");
  const [newEspacios, setNewEspacios] = useState<number[]>([]);

  async function handleAddHorarioLocal() {
    if (newEspacios.length === 0 || newDias.length === 0) return;
    await onAddHorario(c.id, newDias, newInicio, newFin, newEspacios);
    setShowAddHorario(false);
    setNewDias([]);
    setNewEspacios([]);
  }

  function toggleDia(dia: string) {
    setNewDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
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
          Comisión: {c.nombre}
        </span>
        <button
          type="button"
          onClick={() => onDelete(c.display_name || `Comisión ${c.nombre}`)}
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
                {g.hora_inicio.slice(0, 5)} - {g.hora_fin.slice(0, 5)}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">
                {g.espacios.map((e) => e.nombre).join(", ")}
              </span>
              <button
                type="button"
                onClick={() =>
                  onDeleteHorarioGroup(
                    g.horario_ids,
                    `${DIA_LABELS[g.dia_semana]} ${g.hora_inicio.slice(0, 5)}-${g.hora_fin.slice(0, 5)}`,
                  )
                }
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
        <div className="mt-2 flex flex-col gap-2 text-xs">
          <div className="flex flex-wrap gap-1">
            {DIAS_SEMANA.map((d) => (
              <label
                key={d.value}
                className={`px-2 py-0.5 rounded-lg border cursor-pointer transition-colors ${
                  newDias.includes(d.value)
                    ? "bg-black text-white border-black"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={newDias.includes(d.value)}
                  onChange={() => toggleDia(d.value)}
                  className="hidden"
                />
                {d.label}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="time"
              step="300"
              value={newInicio}
              onChange={(e) => setNewInicio(e.target.value)}
              className="px-2 py-1 border border-gray-200 rounded-lg"
            />
            <span>a</span>
            <input
              type="time"
              step="300"
              value={newFin}
              onChange={(e) => setNewFin(e.target.value)}
              className="px-2 py-1 border border-gray-200 rounded-lg"
            />
            <div className="flex flex-wrap gap-1 ml-2">
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
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddHorarioLocal}
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

export default MateriasHorariosPage;
