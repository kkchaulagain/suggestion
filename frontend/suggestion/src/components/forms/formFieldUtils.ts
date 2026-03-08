/** Options that match the 5-star rating pattern (e.g. "★ 1 Star" … "★★★★★ 5 Stars") get the star UI. */
export function isStarRatingOptions(options: string[]): boolean {
  if (options.length !== 5) return false
  const pattern = /^★+\s*\d+\s*Stars?$/i
  return options.every((opt) => pattern.test(opt.trim()))
}
