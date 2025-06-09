/**
 * Utility functions for version comparison and compatibility checking
 */

/**
 * Parse a version string into major, minor, patch components
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  if (version === 'latest' || version === '*') {
    return null;
  }

  // Remove common prefixes
  const cleaned = version.replace(/^[v^~]/, '');
  const match = cleaned.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  
  if (!match) {
    return null;
  }

  return {
    major: parseInt(match[1] || '0', 10),
    minor: parseInt(match[2] || '0', 10),
    patch: parseInt(match[3] || '0', 10)
  };
}

/**
 * Check if a stored version is compatible with a requested version
 * Supports common version range patterns:
 * - Exact match: "1.2.3"
 * - Latest: "latest"
 * - Caret ranges: "^1.2.3" (compatible when major matches)
 * - Tilde ranges: "~1.2.3" (compatible when major.minor matches)
 * - Major only: "1" (matches any 1.x.x)
 * - Major.minor: "1.2" (matches any 1.2.x)
 */
export function isVersionCompatible(stored: string, requested: string): boolean {
  // Handle special cases
  if (requested === 'latest' || requested === '*') {
    return true;
  }
  
  if (stored === requested) {
    return true;
  }

  // Parse versions
  const storedParsed = parseVersion(stored);
  const requestedParsed = parseVersion(requested);
  
  if (!storedParsed || !requestedParsed) {
    return false;
  }

  // Handle range operators
  if (requested.startsWith('^')) {
    // Caret: compatible when major version matches
    return storedParsed.major === requestedParsed.major &&
           (storedParsed.minor > requestedParsed.minor ||
            (storedParsed.minor === requestedParsed.minor && 
             storedParsed.patch >= requestedParsed.patch));
  }
  
  if (requested.startsWith('~')) {
    // Tilde: compatible when major.minor matches
    return storedParsed.major === requestedParsed.major &&
           storedParsed.minor === requestedParsed.minor &&
           storedParsed.patch >= requestedParsed.patch;
  }

  // Handle partial versions
  const requestedParts = requested.split('.').length;
  
  if (requestedParts === 1) {
    // Major only: "1" matches any 1.x.x
    return storedParsed.major === requestedParsed.major;
  }
  
  if (requestedParts === 2) {
    // Major.minor: "1.2" matches any 1.2.x
    return storedParsed.major === requestedParsed.major &&
           storedParsed.minor === requestedParsed.minor;
  }

  // Default to exact match for full versions
  return storedParsed.major === requestedParsed.major &&
         storedParsed.minor === requestedParsed.minor &&
         storedParsed.patch === requestedParsed.patch;
}

/**
 * Compare two versions and return:
 * - 1 if v1 > v2
 * - 0 if v1 = v2
 * - -1 if v1 < v2
 */
export function compareVersions(v1: string, v2: string): number {
  const p1 = parseVersion(v1);
  const p2 = parseVersion(v2);
  
  if (!p1 || !p2) {
    return 0;
  }

  if (p1.major !== p2.major) {
    return p1.major > p2.major ? 1 : -1;
  }
  
  if (p1.minor !== p2.minor) {
    return p1.minor > p2.minor ? 1 : -1;
  }
  
  if (p1.patch !== p2.patch) {
    return p1.patch > p2.patch ? 1 : -1;
  }

  return 0;
}

/**
 * Find the best matching version from available versions
 */
export function findBestVersion(available: string[], requested: string): string | null {
  if (available.length === 0) {
    return null;
  }

  // If requesting latest, return the highest version
  if (requested === 'latest' || requested === '*') {
    return available.reduce((highest, current) => {
      return compareVersions(current, highest) > 0 ? current : highest;
    });
  }

  // Find all compatible versions
  const compatible = available.filter(v => isVersionCompatible(v, requested));
  
  if (compatible.length === 0) {
    return null;
  }

  // Return the highest compatible version
  return compatible.reduce((highest, current) => {
    return compareVersions(current, highest) > 0 ? current : highest;
  });
}