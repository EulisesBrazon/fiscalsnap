export interface TemplateVariable {
  key: string;
  label: string;
  source: string;
}

export interface PdfTemplateDefinition {
  name: string;
  description?: string;
  definition: Record<string, unknown>;
  variables: TemplateVariable[];
}
