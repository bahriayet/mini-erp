import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Helper utility to merge Tailwind CSS classes cleanly.
 * Especially useful for dynamic classes and component styling.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
