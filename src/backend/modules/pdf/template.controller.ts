import { NextResponse } from "next/server";
import { z } from "zod";

import { isAppError } from "@/backend/shared/errors";

import { templateService } from "./template.service";

const variableSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  source: z.string().min(1),
});

const createTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(240).optional(),
  definition: z.record(z.string(), z.unknown()),
  variables: z.array(variableSchema).default([]),
});

const updateTemplateSchema = createTemplateSchema.partial();
const rollbackTemplateSchema = z.object({
  version: z.number().int().positive().optional(),
  revisionId: z.string().min(1).optional(),
}).refine((value) => value.version !== undefined || value.revisionId !== undefined, {
  message: "Debes enviar version o revisionId",
});

export async function listTemplatesController(tenantId: string) {
  const templates = await templateService.list(tenantId);
  return NextResponse.json({ data: templates });
}

export async function createTemplateController(tenantId: string, actorUserId: string, payload: unknown) {
  try {
    const input = createTemplateSchema.parse(payload);
    const template = await templateService.create(tenantId, input, actorUserId);
    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Datos inválidos", errors: error.flatten().fieldErrors }, { status: 400 });
    }

    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function getTemplateByIdController(tenantId: string, id: string) {
  try {
    const template = await templateService.getById(tenantId, id);
    return NextResponse.json({ data: template });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function listTemplateHistoryController(tenantId: string, id: string) {
  try {
    const revisions = await templateService.listHistory(tenantId, id);
    return NextResponse.json({ data: revisions });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function getTemplateHistoryByIdController(tenantId: string, id: string, revisionId: string) {
  try {
    const revision = await templateService.getHistoryEntryById(tenantId, id, revisionId);
    return NextResponse.json({ data: revision });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function updateTemplateController(tenantId: string, actorUserId: string, id: string, payload: unknown) {
  try {
    const input = updateTemplateSchema.parse(payload);
    const template = await templateService.update(tenantId, id, input, actorUserId);
    return NextResponse.json({ data: template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Datos inválidos", errors: error.flatten().fieldErrors }, { status: 400 });
    }

    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function duplicateTemplateController(tenantId: string, actorUserId: string, id: string) {
  try {
    const template = await templateService.duplicate(tenantId, id, actorUserId);
    return NextResponse.json({ data: template }, { status: 201 });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function setDefaultTemplateController(tenantId: string, actorUserId: string, id: string) {
  try {
    const template = await templateService.setDefault(tenantId, id, actorUserId);
    return NextResponse.json({ data: template });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function rollbackTemplateController(tenantId: string, actorUserId: string, id: string, payload: unknown) {
  try {
    const input = rollbackTemplateSchema.parse(payload);

    const template =
      input.revisionId !== undefined
        ? await templateService.rollbackToRevisionId(tenantId, id, input.revisionId, actorUserId)
        : await templateService.rollbackToVersion(tenantId, id, input.version as number, actorUserId);

    return NextResponse.json({ data: template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Datos inválidos", errors: error.flatten().fieldErrors }, { status: 400 });
    }

    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function deleteTemplateController(tenantId: string, actorUserId: string, id: string) {
  try {
    const template = await templateService.deactivate(tenantId, id, actorUserId);
    return NextResponse.json({ data: template });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
