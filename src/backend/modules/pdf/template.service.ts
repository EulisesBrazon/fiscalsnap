import { Types } from "mongoose";

import { AppError } from "@/backend/shared/errors";

import { defaultRetentionTemplate } from "./template.seed";
import { PdfTemplateModel } from "./template.model";
import { TemplateRevisionModel } from "./template-revision.model";
import type { PdfTemplateDefinition } from "./pdf.types";

class TemplateService {
  private async createRevisionSnapshot(
    input: {
      tenantId: string;
      templateId: string;
      version: number;
      name: string;
      description?: string;
      definition: Record<string, unknown>;
      variables: Array<{ key: string; label: string; source: string }>;
    },
    changeType: "created" | "updated" | "duplicated" | "set-default" | "rolled-back" | "deleted",
    changedBy?: string,
  ) {
    await TemplateRevisionModel.create({
      tenantId: input.tenantId,
      templateId: input.templateId,
      version: input.version,
      name: input.name,
      description: input.description,
      definition: input.definition,
      variables: input.variables,
      changeType,
      changedBy,
    });
  }

  async list(tenantId: string) {
    return PdfTemplateModel.find({ tenantId, isActive: true })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 });
  }

  async getById(tenantId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Template inválido", 400);
    }

    const template = await PdfTemplateModel.findOne({ _id: id, tenantId, isActive: true })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");
    if (!template) {
      throw new AppError("Template no encontrado", 404);
    }

    return template;
  }

  async getDefaultTemplate(tenantId: string) {
    let template = await PdfTemplateModel.findOne({ tenantId, isDefault: true, isActive: true });

    if (!template) {
      template = await PdfTemplateModel.create({
        tenantId,
        ...defaultRetentionTemplate,
        isDefault: true,
        isActive: true,
        version: 1,
      });
    }

    return template;
  }

  async create(tenantId: string, input: PdfTemplateDefinition, actorUserId?: string) {
    const created = await PdfTemplateModel.create({
      tenantId,
      ...input,
      isDefault: false,
      isActive: true,
      version: 1,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    await this.createRevisionSnapshot(
      {
        tenantId,
        templateId: String(created._id),
        version: created.version,
        name: created.name,
        description: created.description,
        definition: created.definition as Record<string, unknown>,
        variables: created.variables.map((item: { key: string; label: string; source: string }) => ({
          key: item.key,
          label: item.label,
          source: item.source,
        })),
      },
      "created",
      actorUserId,
    );

    return created;
  }

  async update(tenantId: string, id: string, input: Partial<PdfTemplateDefinition>, actorUserId?: string) {
    const template = await this.getById(tenantId, id);

    if (input.name !== undefined) template.name = input.name;
    if (input.description !== undefined) template.description = input.description;
    if (input.definition !== undefined) template.definition = input.definition;
    if (input.variables !== undefined) template.variables = input.variables;

    template.version += 1;
    template.updatedBy = actorUserId;
    await template.save();

    await this.createRevisionSnapshot(
      {
        tenantId,
        templateId: String(template._id),
        version: template.version,
        name: template.name,
        description: template.description,
        definition: template.definition as Record<string, unknown>,
        variables: template.variables.map((item: { key: string; label: string; source: string }) => ({
          key: item.key,
          label: item.label,
          source: item.source,
        })),
      },
      "updated",
      actorUserId,
    );

    return template;
  }

  async duplicate(tenantId: string, id: string, actorUserId?: string) {
    const source = await this.getById(tenantId, id);

    const duplicated = await PdfTemplateModel.create({
      tenantId,
      name: `${source.name} (copia)`,
      description: source.description,
      definition: source.definition,
      variables: source.variables,
      isDefault: false,
      isActive: true,
      version: 1,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    await this.createRevisionSnapshot(
      {
        tenantId,
        templateId: String(duplicated._id),
        version: duplicated.version,
        name: duplicated.name,
        description: duplicated.description,
        definition: duplicated.definition as Record<string, unknown>,
        variables: duplicated.variables.map((item: { key: string; label: string; source: string }) => ({
          key: item.key,
          label: item.label,
          source: item.source,
        })),
      },
      "duplicated",
      actorUserId,
    );

    return duplicated;
  }

  async setDefault(tenantId: string, id: string, actorUserId?: string) {
    const template = await this.getById(tenantId, id);

    await PdfTemplateModel.updateMany({ tenantId, isDefault: true }, { $set: { isDefault: false } });

    template.isDefault = true;
    template.updatedBy = actorUserId;
    await template.save();

    await this.createRevisionSnapshot(
      {
        tenantId,
        templateId: String(template._id),
        version: template.version,
        name: template.name,
        description: template.description,
        definition: template.definition as Record<string, unknown>,
        variables: template.variables.map((item: { key: string; label: string; source: string }) => ({
          key: item.key,
          label: item.label,
          source: item.source,
        })),
      },
      "set-default",
      actorUserId,
    );

    return template;
  }

  async listHistory(tenantId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Template inválido", 400);
    }

    await this.getById(tenantId, id);

    return TemplateRevisionModel.find({ tenantId, templateId: id })
      .populate("changedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(30);
  }

  async getHistoryEntryById(tenantId: string, templateId: string, revisionId: string) {
    if (!Types.ObjectId.isValid(templateId) || !Types.ObjectId.isValid(revisionId)) {
      throw new AppError("Revisión inválida", 400);
    }

    await this.getById(tenantId, templateId);

    const revision = await TemplateRevisionModel.findOne({
      _id: revisionId,
      tenantId,
      templateId,
    }).populate("changedBy", "name email");

    if (!revision) {
      throw new AppError("Revisión no encontrada", 404);
    }

    return revision;
  }

  private async applyRevision(
    tenantId: string,
    templateId: string,
    revision: {
      name: string;
      description?: string;
      definition: unknown;
      variables: Array<{ key: string; label: string; source: string }>;
    },
    actorUserId?: string,
  ) {
    const template = await this.getById(tenantId, templateId);

    template.name = revision.name;
    template.description = revision.description;
    template.definition = revision.definition as Record<string, unknown>;
    template.variables = revision.variables.map((item) => ({
      key: item.key,
      label: item.label,
      source: item.source,
    }));
    template.version += 1;
    template.updatedBy = actorUserId;
    await template.save();

    await this.createRevisionSnapshot(
      {
        tenantId,
        templateId: String(template._id),
        version: template.version,
        name: template.name,
        description: template.description,
        definition: template.definition as Record<string, unknown>,
        variables: template.variables.map((item: { key: string; label: string; source: string }) => ({
          key: item.key,
          label: item.label,
          source: item.source,
        })),
      },
      "rolled-back",
      actorUserId,
    );

    return template;
  }

  async rollbackToVersion(tenantId: string, id: string, version: number, actorUserId?: string) {
    if (!Number.isInteger(version) || version < 1) {
      throw new AppError("Versión inválida", 400);
    }

    const revision = await TemplateRevisionModel.findOne({
      tenantId,
      templateId: id,
      version,
    }).sort({ createdAt: -1 });

    if (!revision) {
      throw new AppError("No se encontró la versión solicitada", 404);
    }

    return this.applyRevision(
      tenantId,
      id,
      {
        name: revision.name,
        description: revision.description,
        definition: revision.definition,
        variables: revision.variables.map((item: { key: string; label: string; source: string }) => ({
          key: item.key,
          label: item.label,
          source: item.source,
        })),
      },
      actorUserId,
    );
  }

  async rollbackToRevisionId(tenantId: string, templateId: string, revisionId: string, actorUserId?: string) {
    const revision = await this.getHistoryEntryById(tenantId, templateId, revisionId);

    return this.applyRevision(
      tenantId,
      templateId,
      {
        name: revision.name,
        description: revision.description,
        definition: revision.definition,
        variables: revision.variables.map((item: { key: string; label: string; source: string }) => ({
          key: item.key,
          label: item.label,
          source: item.source,
        })),
      },
      actorUserId,
    );
  }

  async deactivate(tenantId: string, id: string, actorUserId?: string) {
    const template = await this.getById(tenantId, id);

    if (template.isDefault) {
      throw new AppError("No puedes eliminar el template por defecto", 400);
    }

    const activeCount = await PdfTemplateModel.countDocuments({ tenantId, isActive: true });
    if (activeCount <= 1) {
      throw new AppError("No puedes eliminar el último template activo", 400);
    }

    template.isActive = false;
    template.updatedBy = actorUserId;
    await template.save();

    await this.createRevisionSnapshot(
      {
        tenantId,
        templateId: String(template._id),
        version: template.version,
        name: template.name,
        description: template.description,
        definition: template.definition as Record<string, unknown>,
        variables: template.variables.map((item: { key: string; label: string; source: string }) => ({
          key: item.key,
          label: item.label,
          source: item.source,
        })),
      },
      "deleted",
      actorUserId,
    );

    return template;
  }
}

export const templateService = new TemplateService();
