// src/utils/gradeUtils.ts
// Shared GPA calculation logic

export const GRADE_POINTS: Record<string, number> = {
  'A+': 10, 'A': 9, 'B+': 8, 'B': 7,
  'C+': 6,  'C': 5, 'D': 4,  'F': 0,
};

/**
 * Calculate SGPA for one semester from SEE grades only.
 * SGPA = Σ(grade_points × credits) / Σ(credits)
 */
export function calculateSGPA(
  seeGrades: { grade: string; credits: number }[]
): number {
  if (seeGrades.length === 0) return 0;
  const totalPoints  = seeGrades.reduce((sum, g) => sum + (GRADE_POINTS[g.grade] ?? 0) * g.credits, 0);
  const totalCredits = seeGrades.reduce((sum, g) => sum + g.credits, 0);
  if (totalCredits === 0) return 0;
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

/**
 * Calculate CGPA as the average of all semester SGPAs.
 */
export function calculateCGPA(sgpaList: number[]): number {
  if (sgpaList.length === 0) return 0;
  const sum = sgpaList.reduce((s, v) => s + v, 0);
  return Math.round((sum / sgpaList.length) * 100) / 100;
}