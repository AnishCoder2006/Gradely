// src/dtos/course.dto.ts
import { z } from 'zod';

export const CreateCourseSchema = z.object({
  name: z.string().min(3).max(150),
  code: z.string().min(3).max(20).toUpperCase(),
  description: z.string().min(10),
  credits: z.number().min(1).max(8),
  instructor: z.string().min(3),
  semester: z.string().min(3),
  maxStudents: z.number().min(1).max(500),
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

export type CreateCourseDto = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseDto = z.infer<typeof UpdateCourseSchema>;