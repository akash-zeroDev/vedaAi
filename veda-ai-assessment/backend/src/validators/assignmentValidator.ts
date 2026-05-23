import { z } from 'zod';

export const createAssignmentSchema = z.object({
  title: z.string().min(1),
  totalQuestions: z.number().positive(),
  totalMarks: z.number().positive(),
  dueDate: z.string(),
  questionTypes: z.array(
    z.union([
      z.string(),
      z.object({
        type: z.string(),
        count: z.number(),
        marks: z.number()
      })
    ])
  ).nonempty(),
  instructions: z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
