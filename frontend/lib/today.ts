// Today's date in Bangkok as "YYYY-MM-DD". Performance dates are stored as
// DATE (UTC midnight), so "has it passed" must flip at Bangkok midnight.
export function bangkokTodayStr(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
