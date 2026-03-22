"use client";

import { useEffect, useMemo, useState } from "react";

import { getApiErrorMessage } from "@/lib/api-errors";

type TemplateVariable = {
  key: string;
  label: string;
  source: string;
};

type TemplateItem = {
  _id: string;
  name: string;
  description?: string;
  definition: Record<string, unknown>;
  variables: TemplateVariable[];
  version: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    name: string;
    email: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
};

type TemplateEditorClientProps = {
  templates: TemplateItem[];
};

type TemplateHistoryItem = {
  _id: string;
  version: number;
  changeType: "created" | "updated" | "duplicated" | "set-default" | "rolled-back" | "deleted";
  createdAt: string;
  changedBy?: {
    name?: string;
    email?: string;
  };
};

type TemplateHistoryDetail = {
  _id: string;
  version: number;
  name: string;
  description?: string;
  definition: Record<string, unknown>;
  variables: TemplateVariable[];
};

function buildPreviewUrl(templateId: string, token?: string | number) {
  if (token === undefined) {
    return `/api/templates/${templateId}/preview`;
  }

  return `/api/templates/${templateId}/preview?v=${token}`;
}

const CHANGE_TYPE_LABEL: Record<TemplateHistoryItem["changeType"], string> = {
  created: "Creado",
  updated: "Actualizado",
  duplicated: "Duplicado",
  "set-default": "Marcado por defecto",
  "rolled-back": "Restaurado",
  deleted: "Eliminado",
};

export function TemplateEditorClient({ templates }: TemplateEditorClientProps) {
  const [templateOptions, setTemplateOptions] = useState<TemplateItem[]>(templates);
  const [selectedId, setSelectedId] = useState(templates[0]?._id ?? "");
  const [name, setName] = useState(templates[0]?.name ?? "");
  const [description, setDescription] = useState(templates[0]?.description ?? "");
  const [variables, setVariables] = useState<TemplateVariable[]>(templates[0]?.variables ?? []);
  const [jsonText, setJsonText] = useState(JSON.stringify(templates[0]?.definition ?? {}, null, 2));
  const [previewUrl, setPreviewUrl] = useState(
    templates[0]?._id ? buildPreviewUrl(templates[0]._id, templates[0].version) : "",
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<TemplateHistoryItem[]>([]);
  const [historyReloadCounter, setHistoryReloadCounter] = useState(0);

  const hasDuplicateVariableKeys = useMemo(() => {
    const keys = variables.map((item) => item.key.trim()).filter(Boolean);
    return new Set(keys).size !== keys.length;
  }, [variables]);

  const selectedTemplate = useMemo(
    () => templateOptions.find((item) => item._id === selectedId),
    [templateOptions, selectedId],
  );

  async function reloadSelectedTemplate(id: string) {
    const response = await fetch(`/api/templates/${id}`);
    const payload = (await response.json()) as { data?: TemplateItem; message?: string; errors?: Record<string, string[]> };

    if (!response.ok || !payload.data) {
      setMessage(getApiErrorMessage(payload, "No se pudo recargar el template actualizado."));
      return;
    }

    const updated = payload.data;
    setTemplateOptions((prev) => {
      const exists = prev.some((item) => item._id === id);
      const next = exists ? prev.map((item) => (item._id === id ? { ...item, ...updated } : item)) : [updated, ...prev];

      if (updated.isDefault) {
        return next.map((item) => ({ ...item, isDefault: item._id === id }));
      }

      return next;
    });

    setName(updated.name);
    setDescription(updated.description ?? "");
    setVariables(updated.variables ?? []);
    setJsonText(JSON.stringify(updated.definition ?? {}, null, 2));
    setPreviewUrl(buildPreviewUrl(id, updated.version));
  }

  useEffect(() => {
    async function loadHistory() {
      if (!selectedId) {
        setHistory([]);
        return;
      }

      const response = await fetch(`/api/templates/${selectedId}/history`);
      const payload = (await response.json()) as { data?: TemplateHistoryItem[] };

      if (!response.ok || !payload.data) {
        setHistory([]);
        return;
      }

      setHistory(
        payload.data.map((item) => ({
          _id: String(item._id),
          version: item.version,
          changeType: item.changeType,
          createdAt: item.createdAt,
          changedBy: item.changedBy,
        })),
      );
    }

    void loadHistory();
  }, [selectedId, historyReloadCounter]);

  function onSelectTemplate(id: string) {
    const template = templateOptions.find((item) => item._id === id);
    if (!template) return;

    setSelectedId(template._id);
    setName(template.name);
    setDescription(template.description ?? "");
    setVariables(template.variables);
    setJsonText(JSON.stringify(template.definition, null, 2));
    setPreviewUrl(buildPreviewUrl(template._id, template.version));
    setMessage("");
  }

  function updateVariable(index: number, field: keyof TemplateVariable, value: string) {
    setVariables((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, [field]: value };
      }),
    );
  }

  function addVariable() {
    setVariables((prev) => [...prev, { key: "", label: "", source: "" }]);
  }

  function removeVariable(index: number) {
    setVariables((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function saveTemplate() {
    if (!selectedId) {
      setMessage("No hay template seleccionado.");
      return;
    }

    let parsedDefinition: Record<string, unknown>;

    try {
      parsedDefinition = JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      setMessage("El JSON del template no es válido.");
      return;
    }

    const normalizedVariables = variables
      .map((item) => ({
        key: item.key.trim(),
        label: item.label.trim(),
        source: item.source.trim(),
      }))
      .filter((item) => item.key && item.label && item.source);

    if (hasDuplicateVariableKeys) {
      setMessage("Las variables tienen claves duplicadas. Corrige antes de guardar.");
      return;
    }

    setSaving(true);
    setMessage("Guardando template...");

    const response = await fetch(`/api/templates/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        definition: parsedDefinition,
        variables: normalizedVariables,
      }),
    });

    const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };

    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo guardar el template."));
      setSaving(false);
      return;
    }

    setMessage("Template actualizado.");
    await reloadSelectedTemplate(selectedId);
    setHistoryReloadCounter((prev) => prev + 1);
    setSaving(false);
  }

  function openPreview() {
    if (!selectedId) {
      setMessage("No hay template seleccionado para previsualizar.");
      return;
    }

    window.open(`/api/templates/${selectedId}/preview`, "_blank", "noopener,noreferrer");
  }

  async function duplicateTemplate() {
    if (!selectedId) return;

    setSaving(true);
    setMessage("Duplicando template...");

    const response = await fetch(`/api/templates/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "duplicate" }),
    });

    const payload = (await response.json()) as { message?: string; data?: TemplateItem; errors?: Record<string, string[]> };
    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo duplicar."));
      setSaving(false);
      return;
    }

    setMessage("Template duplicado.");
    if (payload.data) {
      const duplicated = payload.data;
      setTemplateOptions((prev) => [duplicated, ...prev]);
      setSelectedId(String(duplicated._id));
      setName(duplicated.name);
      setDescription(duplicated.description ?? "");
      setVariables(duplicated.variables ?? []);
      setJsonText(JSON.stringify(duplicated.definition ?? {}, null, 2));
      setPreviewUrl(buildPreviewUrl(String(duplicated._id), duplicated.version));
    }
    setHistoryReloadCounter((prev) => prev + 1);
    setSaving(false);
  }

  async function createTemplate() {
    setSaving(true);
    setMessage("Creando template...");

    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Nuevo template",
        description: "",
        definition: {
          pageSize: "LETTER",
          content: [{ text: "NUEVO TEMPLATE", style: "header" }],
          styles: { header: { bold: true, fontSize: 14, alignment: "center" } },
        },
        variables: [],
      }),
    });

    const payload = (await response.json()) as { message?: string; data?: TemplateItem; errors?: Record<string, string[]> };
    if (!response.ok || !payload.data) {
      setMessage(getApiErrorMessage(payload, "No se pudo crear el template."));
      setSaving(false);
      return;
    }

    const created = payload.data;
    setTemplateOptions((prev) => [created, ...prev]);
    setSelectedId(created._id);
    setName(created.name);
    setDescription(created.description ?? "");
    setVariables(created.variables ?? []);
    setJsonText(JSON.stringify(created.definition ?? {}, null, 2));
    setPreviewUrl(buildPreviewUrl(created._id, created.version));
    setHistoryReloadCounter((prev) => prev + 1);
    setMessage("Template creado.");
    setSaving(false);
  }

  async function setAsDefault() {
    if (!selectedId) return;

    setSaving(true);
    setMessage("Marcando como template por defecto...");

    const response = await fetch(`/api/templates/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-default" }),
    });

    const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo actualizar el template por defecto."));
      setSaving(false);
      return;
    }

    setMessage("Template por defecto actualizado.");
    await reloadSelectedTemplate(selectedId);
    setHistoryReloadCounter((prev) => prev + 1);
    setSaving(false);
  }

  async function deleteTemplate() {
    if (!selectedId) return;

    const selected = templateOptions.find((item) => item._id === selectedId);
    if (!selected) return;

    const confirmed = window.confirm(
      `Vas a eliminar el template \"${selected.name}\". Esta accion lo ocultara de la lista activa. Deseas continuar?`,
    );
    if (!confirmed) return;

    setSaving(true);
    setMessage("Eliminando template...");

    const response = await fetch(`/api/templates/${selectedId}`, {
      method: "DELETE",
    });

    const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo eliminar el template."));
      setSaving(false);
      return;
    }

    const remaining = templateOptions.filter((item) => item._id !== selectedId);
    setTemplateOptions(remaining);

    const nextSelected = remaining.find((item) => item.isDefault) ?? remaining[0];
    if (!nextSelected) {
      setSelectedId("");
      setName("");
      setDescription("");
      setVariables([]);
      setJsonText("{}");
      setPreviewUrl("");
      setHistory([]);
      setMessage("Template eliminado.");
      setSaving(false);
      return;
    }

    setSelectedId(nextSelected._id);
    setName(nextSelected.name);
    setDescription(nextSelected.description ?? "");
    setVariables(nextSelected.variables ?? []);
    setJsonText(JSON.stringify(nextSelected.definition ?? {}, null, 2));
    setPreviewUrl(buildPreviewUrl(nextSelected._id, nextSelected.version));

    setHistoryReloadCounter((prev) => prev + 1);
    setMessage("Template eliminado.");
    setSaving(false);
  }

  async function rollbackTemplate(entry: TemplateHistoryItem) {
    if (!selectedId) return;

    const revisionResponse = await fetch(`/api/templates/${selectedId}/history/${entry._id}`);
    const revisionPayload = (await revisionResponse.json()) as { data?: TemplateHistoryDetail; message?: string; errors?: Record<string, string[]> };

    if (!revisionResponse.ok || !revisionPayload.data) {
      setMessage(getApiErrorMessage(revisionPayload, "No se pudo cargar la revisión para comparar cambios."));
      return;
    }

    const revision = revisionPayload.data;

    let currentDefinitionSize = 0;
    try {
      currentDefinitionSize = JSON.stringify(JSON.parse(jsonText)).length;
    } catch {
      currentDefinitionSize = jsonText.length;
    }

    const nextDefinitionSize = JSON.stringify(revision.definition).length;
    const variableDelta = revision.variables.length - variables.length;
    const definitionDelta = nextDefinitionSize - currentDefinitionSize;

    const summary = [
      `Version destino: v${entry.version}`,
      `Nombre: ${name} -> ${revision.name}`,
      `Descripcion: ${(description || "-")} -> ${(revision.description || "-")}`,
      `Variables: ${variables.length} -> ${revision.variables.length} (${variableDelta >= 0 ? "+" : ""}${variableDelta})`,
      `Tamano JSON: ${currentDefinitionSize} -> ${nextDefinitionSize} (${definitionDelta >= 0 ? "+" : ""}${definitionDelta})`,
      "",
      "Deseas continuar con la restauracion?",
    ].join("\n");

    const confirmed = window.confirm(summary);
    if (!confirmed) return;

    setSaving(true);
    setMessage(`Revirtiendo a la version v${entry.version}...`);

    const response = await fetch(`/api/templates/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rollback", revisionId: entry._id }),
    });

    const payload = (await response.json()) as { message?: string; errors?: Record<string, string[]> };
    if (!response.ok) {
      setMessage(getApiErrorMessage(payload, "No se pudo revertir el template."));
      setSaving(false);
      return;
    }

    setMessage(`Template restaurado desde v${entry.version}.`);
    await reloadSelectedTemplate(selectedId);
    setHistoryReloadCounter((prev) => prev + 1);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-4">
        <h1 className="text-lg font-semibold">Templates PDF</h1>
        <p className="mt-1 text-sm text-muted-foreground">Edita el JSON de pdfmake. Los cambios impactan la generación sin tocar código.</p>
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Template</label>
          <select value={selectedId} onChange={(event) => onSelectTemplate(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
            {templateOptions.map((item) => (
              <option key={item._id} value={item._id}>{`${item.name} (v${item.version})${item.isDefault ? " • default" : ""}`}</option>
            ))}
          </select>
        </div>

        {selectedTemplate ? (
          <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
            <p>
              Creado por: {selectedTemplate.createdBy?.name ?? "N/A"} ({selectedTemplate.createdBy?.email ?? "-"}) ·{" "}
              {new Date(selectedTemplate.createdAt).toISOString().slice(0, 10)}
            </p>
            <p>
              Última edición: {selectedTemplate.updatedBy?.name ?? "N/A"} ({selectedTemplate.updatedBy?.email ?? "-"}) ·{" "}
              {new Date(selectedTemplate.updatedAt).toISOString().slice(0, 10)}
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <input value={name} onChange={(event) => setName(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descripción</label>
            <input value={description} onChange={(event) => setDescription(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Document definition (JSON)</label>
          <textarea value={jsonText} onChange={(event) => setJsonText(event.target.value)} rows={22} className="w-full rounded-md border bg-background p-3 font-mono text-xs" />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button disabled={saving} onClick={saveTemplate} type="button" className="h-10 w-full rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar template"}
          </button>
          <button type="button" onClick={openPreview} className="h-10 w-full rounded-md border px-4 text-sm font-medium">
            Previsualizar PDF
          </button>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Variables del template</label>
            <button type="button" onClick={addVariable} className="h-8 rounded-md border px-2.5 text-xs font-medium">
              Agregar variable
            </button>
          </div>

          {variables.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay variables configuradas.</p>
          ) : (
            <div className="space-y-2">
              {variables.map((variable, index) => (
                <div key={`${index}-${variable.key}`} className="grid gap-2 rounded-md border p-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <input
                    value={variable.key}
                    onChange={(event) => updateVariable(index, "key", event.target.value)}
                    placeholder="key"
                    className="h-9 rounded-md border bg-background px-2 text-xs"
                  />
                  <input
                    value={variable.label}
                    onChange={(event) => updateVariable(index, "label", event.target.value)}
                    placeholder="label"
                    className="h-9 rounded-md border bg-background px-2 text-xs"
                  />
                  <input
                    value={variable.source}
                    onChange={(event) => updateVariable(index, "source", event.target.value)}
                    placeholder="source (ej: retention.voucherNumber)"
                    className="h-9 rounded-md border bg-background px-2 text-xs"
                  />
                  <button type="button" onClick={() => removeVariable(index)} className="h-9 rounded-md border px-2 text-xs">
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          )}

          {hasDuplicateVariableKeys ? <p className="text-xs text-destructive">Hay claves de variable duplicadas.</p> : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button disabled={saving} onClick={createTemplate} type="button" className="h-10 w-full rounded-md border px-4 text-sm font-medium disabled:opacity-60">
            Nuevo template
          </button>
          <button disabled={saving} onClick={duplicateTemplate} type="button" className="h-10 w-full rounded-md border px-4 text-sm font-medium disabled:opacity-60">
            Duplicar template
          </button>
          <button disabled={saving} onClick={setAsDefault} type="button" className="h-10 w-full rounded-md border px-4 text-sm font-medium disabled:opacity-60">
            Marcar por defecto
          </button>
        </div>

        <button
          disabled={saving || selectedTemplate?.isDefault}
          onClick={deleteTemplate}
          type="button"
          className="h-10 w-full rounded-md border border-destructive/40 px-4 text-sm font-medium text-destructive disabled:opacity-60"
        >
          Eliminar template
        </button>
        {selectedTemplate?.isDefault ? (
          <p className="text-xs text-muted-foreground">No puedes eliminar el template por defecto.</p>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Preview embebido</label>
          {previewUrl ? (
            <iframe
              title="Vista previa PDF"
              src={previewUrl}
              className="h-120 w-full rounded-md border bg-white"
            />
          ) : (
            <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
              Selecciona un template para ver su preview.
            </div>
          )}
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <label className="text-sm font-medium">Historial de versiones</label>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin revisiones registradas para este template.</p>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <div key={entry._id} className="rounded-md border p-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">v{entry.version}</p>
                  <p>
                    Tipo: {CHANGE_TYPE_LABEL[entry.changeType]} · Fecha: {new Date(entry.createdAt).toISOString().slice(0, 10)}
                  </p>
                  <p>
                    Usuario: {entry.changedBy?.name ?? "N/A"} ({entry.changedBy?.email ?? "-"})
                  </p>
                  <button
                    type="button"
                    onClick={() => void rollbackTemplate(entry)}
                    disabled={saving}
                    className="mt-2 h-8 rounded-md border px-2.5 text-xs font-medium disabled:opacity-60"
                  >
                    Restaurar esta versión
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </section>
    </div>
  );
}
