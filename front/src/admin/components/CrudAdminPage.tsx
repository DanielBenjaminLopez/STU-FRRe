import { useCallback, useEffect, useState } from "react";
import DataTable, { type Column } from "./DataTable";
import DataFormModal, { type FormField } from "./DataFormModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import PageHeader from "./PageHeader";

interface CrudConfig<T extends { id: number }> {
  title: string;
  subtitle?: string;
  entityName: string;
  columns: Column<T>[];
  formFields: FormField[];
  fetchList: () => Promise<T[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create?: (...args: any[]) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update?: (...args: any[]) => Promise<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remove?: (...args: any[]) => Promise<any>;
  getRowLabel?: (row: T) => string;
  validate?: (data: Record<string, unknown>) => string | null;
}

interface CrudAdminPageProps<T extends { id: number }> {
  config: CrudConfig<T>;
}

export default function CrudAdminPage<T extends { id: number }>({
  config,
}: CrudAdminPageProps<T>) {
  const {
    title,
    subtitle,
    entityName,
    columns,
    formFields,
    fetchList,
    create,
    update,
    remove,
    getRowLabel,
    validate,
  } = config;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState<T | null>(null);

  const [deletingRow, setDeletingRow] = useState<T | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await fetchList();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar los datos",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  useEffect(() => {
    let active = true;
    async function init() {
      if (active) await load();
    }
    init();
    return () => {
      active = false;
    };
  }, [load]);

  function handleCreate() {
    setEditingRow(null);
    setShowForm(true);
  }

  function handleEdit(row: T) {
    setEditingRow(row);
    setShowForm(true);
  }

  function handleDelete(row: T) {
    setDeletingRow(row);
  }

  async function handleSubmit(formData: Record<string, unknown>) {
    if (validate) {
      const error = validate(formData);
      if (error) {
        setError(error);
        return;
      }
    }
    try {
      if (editingRow && update) {
        await update(editingRow.id as number, formData);
      } else if (create) {
        await create(formData);
      }
      setShowForm(false);
      setEditingRow(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function handleConfirmDelete() {
    try {
      if (deletingRow && remove) {
        await remove(deletingRow.id as number);
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  const labelFn =
    getRowLabel ??
    ((row: T) =>
      String(
        (row as unknown as Record<string, unknown>).nombre ??
          (row as unknown as Record<string, unknown>).titulo ??
          row.id,
      ));

  return (
    <div className="p-8">
      <PageHeader
        title={title}
        subtitle={subtitle}
        onCreate={create ? handleCreate : undefined}
        createLabel={`Crear ${entityName}`}
      />

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
          {error}
        </div>
      )}

      <DataTable
        data={data}
        columns={columns}
        onEdit={update ? handleEdit : undefined}
        onDelete={remove ? handleDelete : undefined}
        isLoading={loading}
        searchPlaceholder={`Buscar ${entityName}...`}
        label={entityName + "s"}
      />

      {showForm && (
        <DataFormModal
          title={editingRow ? `Editar ${entityName}` : `Crear ${entityName}`}
          fields={formFields}
          initialData={
            (editingRow as unknown as Record<string, unknown>) ?? undefined
          }
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingRow(null);
          }}
        />
      )}

      {deletingRow && (
        <ConfirmDeleteModal
          title={`Eliminar ${entityName}`}
          itemName={labelFn(deletingRow)}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingRow(null)}
        />
      )}
    </div>
  );
}
