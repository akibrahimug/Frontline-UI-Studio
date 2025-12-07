export function incrementVersion(currentVersion: string): string {
  const parts = currentVersion.split(".");
  if (parts.length !== 3) {
    return "0.1.0";
  }

  const [major, minor, patch] = parts.map(Number);

  // Check if any part is NaN
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return "0.1.0";
  }

  return `${major}.${minor}.${patch + 1}`;
}
