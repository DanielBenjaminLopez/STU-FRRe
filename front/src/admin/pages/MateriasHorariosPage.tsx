import { useEffect, useState } from "react";
import { sileo } from "sileo";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import TipoCarreraBadge from "../components/TipoCarreraBadge";
import SearchableCarrera from "../components/SearchableCarrera";
import ImportCsvModal from "../components/ImportCsvModal";
import Button from "../../shared/components/ui/Button";
import { AdminSchedulesSkeleton } from "../../shared/components/ui/Skeleton";

import {
  fetchMaterias,
  deleteMateria,
  fetchHorarios,
  createHorario,
  deleteHorario,
  DIAS_SEMANA,
  NIVELES,
  importarHorariosCSV,
  type CsvImportResult,
  type Materia,
  type HorarioCursado,
} from "../../features/horarios/api/horariosAdmin";
import { fetchCarreras, type Carrera } from "../../shared/api/carreras";

function formatDia(dia: string): string {
  if (!dia) return "";
  const key = dia
    .toLowerCase()
    .trim()
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u");
  return DIA_LABELS[key] || dia;
}

const DIA_LABELS: Record<string, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mie",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sab",
  domingo: "Dom",
};

interface HorarioGroup {
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  espacios: string[];
  horario_ids: number[];
}

interface ComisionConHorarios {
  nombre: string;
  horarios_agrupados: HorarioGroup[];
  horario_ids: number[];
}

interface MateriaConComisiones extends Materia {
  comisiones: ComisionConHorarios[];
  expanded?: boolean;
}

function MateriasHorariosPage() {
  const [data, setData] = useState<MateriaConComisiones[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [filterCarrera, setFilterCarrera] = useState<number | "">("");
  const [filterNivel, setFilterNivel] = useState("");

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "materia" | "comision" | "horario";
    id: number | number[];
    name: string;
  } | null>(null);

  const [showImportModal, setShowImportModal] = useState(false);

  function reload() {
    setReloadKey((k) => k + 1);
  }

  useEffect(() => {
    let active = true;
    async function init() {
      if (!active) return;
      setLoading(true);
      try {
        const filters: {
          tipo?: string;
          carrera?: number;
          nivel?: string;
        } = {};
        if (filterCarrera !== "") filters.carrera = filterCarrera;
        if (filterNivel) filters.nivel = filterNivel;

        const [materias, allHorarios, car] = await Promise.all([
          fetchMaterias(filters),
          fetchHorarios(),
          fetchCarreras(),
        ]);

        if (!active) return;
        setCarreras(car);

        const horariosPorMateria = new Map<number, HorarioCursado[]>();
        for (const h of allHorarios) {
          if (h.materia) {
            const list = horariosPorMateria.get(h.materia) || [];
            list.push(h);
            horariosPorMateria.set(h.materia, list);
          }
        }

        const result: MateriaConComisiones[] = materias.map((mat) => {
          const horariosMat = horariosPorMateria.get(mat.id) || [];
          const comisionHorariosMap = new Map<string, HorarioCursado[]>();
          for (const h of horariosMat) {
            const comNombre = h.comision || "Sin comisión";
            const list = comisionHorariosMap.get(comNombre) || [];
            list.push(h);
            comisionHorariosMap.set(comNombre, list);
          }

          const comisiones: ComisionConHorarios[] = Array.from(
            comisionHorariosMap.entries(),
          ).map(([nombre, horarios]) => {
            const groups = new Map<string, HorarioGroup>();

            for (const h of horarios) {
              const key = `${h.dia_semana}|${h.hora_inicio}|${h.hora_fin}`;
              if (!groups.has(key)) {
                groups.set(key, {
                  dia_semana: h.dia_semana,
                  hora_inicio: h.hora_inicio,
                  hora_fin: h.hora_fin,
                  espacios: [],
                  horario_ids: [],
                });
              }
              const g = groups.get(key)!;
              g.horario_ids.push(h.id);
              if (h.espacio && !g.espacios.includes(h.espacio)) {
                g.espacios.push(h.espacio);
              }
            }

            return {
              nombre,
              horarios_agrupados: Array.from(groups.values()),
              horario_ids: horarios.map((h) => h.id),
            };
          });

          return { ...mat, comisiones };
        });

        setData(result);
      } catch (err) {
        if (active) {
          sileo.error({
            title: "Error al cargar datos",
            description:
              err instanceof Error ? err.message : "Error al cargar los datos",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [filterCarrera, filterNivel, reloadKey]);

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

  async function handleAddComision(materiaId: number, nombre: string) {
    try {
      await createHorario({
        materia: materiaId,
        comision: nombre,
        espacio: "",
        dia_semana: "lunes",
        hora_inicio: "07:45",
        hora_fin: "08:30",
      });
      reload();
    } catch (err) {
      sileo.error({
        title: "Error al crear comisión",
        description:
          err instanceof Error ? err.message : "Error al crear la comisión",
      });
    }
  }

  async function handleAddHorario(
    materiaId: number,
    comisionNombre: string,
    dias: string[],
    horaInicio: string,
    horaFin: string,
    espacio: string,
  ) {
    try {
      for (const dia of dias) {
        await createHorario({
          materia: materiaId,
          comision: comisionNombre,
          espacio,
          dia_semana: dia,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
        });
      }
      reload();
    } catch (err) {
      sileo.error({
        title: "Error al agregar horario",
        description:
          err instanceof Error ? err.message : "Error al agregar el horario",
      });
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "materia") {
        await deleteMateria(deleteTarget.id as number);
        sileo.success({ title: "Materia eliminada" });
      } else if (deleteTarget.type === "comision") {
        for (const id of deleteTarget.id as number[]) {
          await deleteHorario(id);
        }
        sileo.success({ title: "Comisión eliminada" });
      } else if (deleteTarget.type === "horario") {
        for (const id of deleteTarget.id as number[]) {
          await deleteHorario(id);
        }
      }
      reload();
    } catch (err) {
      sileo.error({
        title: "Error al eliminar",
        description:
          err instanceof Error ? err.message : "Error al eliminar el elemento",
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return <AdminSchedulesSkeleton />;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Horarios de cursado</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de comisiones y horarios por materia
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowImportModal(true)}>
          Importar
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Filtros
          </span>
        </div>

        <SearchableCarrera
          carreras={carreras}
          selectedId={filterCarrera}
          onChange={handleCarreraChange}
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-gray-500">Nivel</span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={filterCarrera === ""}
              onClick={() => setFilterNivel("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                filterCarrera === ""
                  ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                  : filterNivel === ""
                    ? "bg-black text-white border-black cursor-pointer"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 cursor-pointer"
              }`}
            >
              Todos
            </button>
            {NIVELES.map((n) => (
              <button
                key={n.value}
                type="button"
                disabled={filterCarrera === ""}
                onClick={() => setFilterNivel(n.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  filterCarrera === ""
                    ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                    : filterNivel === n.value
                      ? "bg-black text-white border-black cursor-pointer"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 cursor-pointer"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((mat) => (
          <MateriaCard
            key={mat.id}
            materia={mat}
            expanded={expandedIds.has(mat.id)}
            onToggle={() => toggleExpand(mat.id)}
            onAddComision={handleAddComision}
            onDelete={(name) =>
              setDeleteTarget({ type: "materia", id: mat.id, name })
            }
            onAddHorario={handleAddHorario}
            onDeleteHorarioGroup={(ids, name) =>
              setDeleteTarget({ type: "horario", id: ids, name })
            }
            onDeleteComision={(ids, name) =>
              setDeleteTarget({ type: "comision", id: ids, name })
            }
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

      {showImportModal && (
        <ImportCsvModal
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
            reload();
          }}
        />
      )}
    </div>
  );
}

function MateriaCard({
  materia: pm,
  expanded,
  onToggle,
  onAddComision,
  onDelete,
  onAddHorario,
  onDeleteHorarioGroup,
  onDeleteComision,
}: {
  materia: MateriaConComisiones;
  expanded: boolean;
  onToggle: () => void;
  onAddComision: (materiaId: number, nombre: string) => Promise<void>;
  onDelete: (name: string) => void;
  onAddHorario: (
    materiaId: number,
    comisionNombre: string,
    dias: string[],
    horaInicio: string,
    horaFin: string,
    espacio: string,
  ) => Promise<void>;
  onDeleteHorarioGroup: (horarioIds: number[], name: string) => void;
  onDeleteComision: (horarioIds: number[], name: string) => void;
}) {
  const [showAddComision, setShowAddComision] = useState(false);
  const [newComisionNombre, setNewComisionNombre] = useState("");
  const [showAddHorario, setShowAddHorario] = useState(false);

  const nivelLabel =
    NIVELES.find((n) => n.value === pm.nivel)?.label || pm.nivel;

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
            <h3 className="font-semibold text-gray-900">{pm.nombre}</h3>
            <TipoCarreraBadge tipo={pm.carrera_tipo} />
          </div>
          <p className="text-xs text-gray-500">
            {pm.carrera_nombre} | Nivel {nivelLabel}
          </p>
        </div>
        <span className="text-xs text-gray-400">
          {pm.comisiones.length} comisión(es)
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(pm.nombre || `Materia #${pm.id}`);
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                  key={c.nombre}
                  materiaId={pm.id}
                  comision={c}
                  onDelete={(name) => onDeleteComision(c.horario_ids, name)}
                  onAddHorario={onAddHorario}
                  onDeleteHorarioGroup={onDeleteHorarioGroup}
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
                  className="px-3 py-1.5 text-xs font-medium text-white bg-black rounded-lg hover:bg-gray-800 cursor-pointer"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddComision(false);
                    setNewComisionNombre("");
                  }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddComision(true)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors cursor-pointer"
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
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-black transition-colors cursor-pointer"
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
              materiaId={pm.id}
              comisiones={pm.comisiones}
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
  materiaId,
  comisiones,
  onAddHorario,
  onClose,
}: {
  materiaId: number;
  comisiones: ComisionConHorarios[];
  onAddHorario: (
    materiaId: number,
    comisionNombre: string,
    dias: string[],
    horaInicio: string,
    horaFin: string,
    espacio: string,
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [comisionNombre, setComisionNombre] = useState<string>(
    comisiones[0]?.nombre ?? "",
  );
  const [dias, setDias] = useState<string[]>([]);
  const [horaInicio, setHoraInicio] = useState("07:45");
  const [horaFin, setHoraFin] = useState("08:30");
  const [espacio, setEspacio] = useState<string>("");

  function toggleDia(dia: string) {
    setDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  }

  async function handleSubmit() {
    if (dias.length === 0 || !comisionNombre) return;
    await onAddHorario(
      materiaId,
      comisionNombre,
      dias,
      horaInicio,
      horaFin,
      espacio.trim(),
    );
    onClose();
  }

  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-gray-500 font-medium">Comisión:</span>
        <select
          value={comisionNombre}
          onChange={(e) => setComisionNombre(e.target.value)}
          className="px-2 py-1 border border-gray-200 rounded-lg bg-white text-xs"
        >
          {comisiones.map((c) => (
            <option key={c.nombre} value={c.nombre}>
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
        <input
          type="text"
          value={espacio}
          onChange={(e) => setEspacio(e.target.value)}
          placeholder="Aula / Laboratorio"
          className="px-2 py-1 border border-gray-200 rounded-lg bg-white"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-3 py-1 text-white bg-black rounded-lg hover:bg-gray-800 cursor-pointer"
        >
          OK
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ComisionBlock({
  materiaId,
  comision: c,
  onDelete,
  onAddHorario,
  onDeleteHorarioGroup,
}: {
  materiaId: number;
  comision: ComisionConHorarios;
  onDelete: (name: string) => void;
  onAddHorario: (
    materiaId: number,
    comisionNombre: string,
    dias: string[],
    horaInicio: string,
    horaFin: string,
    espacio: string,
  ) => Promise<void>;
  onDeleteHorarioGroup: (horarioIds: number[], name: string) => void;
}) {
  const [showAddHorario, setShowAddHorario] = useState(false);
  const [newDias, setNewDias] = useState<string[]>([]);
  const [newInicio, setNewInicio] = useState("07:45");
  const [newFin, setNewFin] = useState("08:30");
  const [newEspacio, setNewEspacio] = useState<string>("");

  async function handleAddHorarioLocal() {
    if (newDias.length === 0) return;
    await onAddHorario(
      materiaId,
      c.nombre,
      newDias,
      newInicio,
      newFin,
      newEspacio.trim(),
    );
    setShowAddHorario(false);
    setNewDias([]);
    setNewEspacio("");
  }

  function toggleDia(dia: string) {
    setNewDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
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
          onClick={() => onDelete(`Comisión ${c.nombre}`)}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
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
              <span className="font-medium w-8">{formatDia(g.dia_semana)}</span>
              <span>
                {g.hora_inicio.slice(0, 5)} - {g.hora_fin.slice(0, 5)}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">{g.espacios.join(", ")}</span>
              <button
                type="button"
                onClick={() =>
                  onDeleteHorarioGroup(
                    g.horario_ids,
                    `${formatDia(g.dia_semana)} ${g.hora_inicio.slice(0, 5)}-${g.hora_fin.slice(0, 5)}`,
                  )
                }
                className="ml-auto text-gray-400 hover:text-red-500 cursor-pointer"
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
            <input
              type="text"
              value={newEspacio}
              onChange={(e) => setNewEspacio(e.target.value)}
              placeholder="Aula / Laboratorio"
              className="px-2 py-1 border border-gray-200 rounded-lg bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddHorarioLocal}
              className="px-3 py-1 text-white bg-black rounded-lg hover:bg-gray-800 cursor-pointer"
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => setShowAddHorario(false)}
              className="text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddHorario(true)}
          className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-black transition-colors cursor-pointer"
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
