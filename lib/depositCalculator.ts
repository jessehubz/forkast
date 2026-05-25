export function calculateDeposit(
  existingReservationCount: number,
  totalTableCount: number
): number {
  if (totalTableCount === 0) return 0;
  const occupancyRate = existingReservationCount / totalTableCount;
  if (occupancyRate > 0.85) return 400;
  if (occupancyRate > 0.70) return 200;
  return 0;
}
