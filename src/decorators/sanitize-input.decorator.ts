import { Transform, TransformFnParams } from 'class-transformer';

/**
 * Decorator to sanitize string inputs:
 * 1. Trims whitespace from start and end.
 * 2. Capitalizes the first letter and makes the rest lowercase.
 * 
 * Example: "  fERNANDO  " -> "Fernando"
 */
export function SanitizeInput() {
  return Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return '';
    }

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  });
}

/**
 * Decorator to only trim whitespace without changing case.
 * Useful for emails, codes, etc.
 */
export function TrimOnly() {
  return Transform(({ value }: TransformFnParams) => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.trim();
  });
}
