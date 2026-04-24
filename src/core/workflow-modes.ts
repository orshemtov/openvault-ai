export const WORKFLOW_MODES = ["ask", "edit", "analytics"] as const;

export type WorkflowMode = (typeof WORKFLOW_MODES)[number];
