// src/dtos/student.dto.ts
import { z } from 'zod';

export const CreateStudentSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  dateOfBirth: z.string().pipe(z.coerce.date()),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(5).max(200),
});

export const UpdateStudentSchema = CreateStudentSchema.partial();

export type CreateStudentDto = z.infer<typeof CreateStudentSchema>;
export type UpdateStudentDto = z.infer<typeof UpdateStudentSchema>;