/** Shared app-chrome helpers (NOT report content - chrome only). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
