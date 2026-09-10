import { describe, expect, it } from 'vitest';
import { calculateCGPA, calculateSGPA } from './gradeUtils';

describe('grade calculations', () => {
  it('calculates a credit-weighted SGPA', () => {
    expect(calculateSGPA([
      { grade: 'A+', credits: 4 },
      { grade: 'B+', credits: 2 },
      { grade: 'C', credits: 2 },
    ])).toBe(8.25);
  });

  it('returns zero for empty grades or zero credits', () => {
    expect(calculateSGPA([])).toBe(0);
    expect(calculateSGPA([{ grade: 'A+', credits: 0 }])).toBe(0);
  });

  it('calculates and rounds CGPA to two decimal places', () => {
    expect(calculateCGPA([8.25, 9.1, 7.66])).toBe(8.34);
    expect(calculateCGPA([])).toBe(0);
  });
});
