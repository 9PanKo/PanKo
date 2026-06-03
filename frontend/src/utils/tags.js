/** PanKo — Parse tag input into normalized lowercase tags. */
export function parseTags(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return [...new Set(input.map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
  }
  return [
    ...new Set(
      String(input)
        .split(/[,#]+/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}
