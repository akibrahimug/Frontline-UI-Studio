import { z } from "zod";

export const PropSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string().optional(),
  defaultValue: z.string().optional(),
});

export const LLMRefactorResultSchema = z.object({
  transformedCode: z.string(),
  commentary: z.string(),
  docsMarkdown: z.string(),
  props: z.array(PropSchema).optional().default([]),
  breakingChanges: z.array(z.string()).optional().default([]),
  suggestions: z.array(z.string()).optional().default([]),
  testIdeas: z.array(z.string()).optional().default([]),
});

export type Prop = z.infer<typeof PropSchema>;
export type LLMRefactorResult = z.infer<typeof LLMRefactorResultSchema>;
