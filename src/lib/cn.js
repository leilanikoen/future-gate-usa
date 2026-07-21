// Tiny className joiner (keeps JSX readable without pulling in a dependency).
export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}
