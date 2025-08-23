export function validateOrbId(orbId: string): void {
  if (!orbId || typeof orbId !== "string") {
    throw new Error(`Invalid orbId: ${orbId}`);
  }
}
