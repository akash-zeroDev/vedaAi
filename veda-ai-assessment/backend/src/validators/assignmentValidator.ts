import { z } from 'zod';

export const createAssignmentSchema = z.object({
  totalQuestions: z.number().positive(),
  totalMarks: z.number().positive(),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date string",
  }),
  questionTypes: z.array(z.string()).nonempty(),
  instructions: z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
