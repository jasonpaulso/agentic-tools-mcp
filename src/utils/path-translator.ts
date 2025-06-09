/**
 * Path translation utilities for Docker environments
 * 
 * When running in Docker, we need to translate between host paths
 * (what the client sends) and container paths (what the server can access)
 */

export interface PathMapping {
  hostPrefix: string;
  containerPrefix: string;
}

export class PathTranslator {
  private mappings: PathMapping[] = [];
  
  constructor() {
    // Parse PATH_MAPPING environment variable
    // Format: "host1:container1,host2:container2"
    const pathMappingEnv = process.env.PATH_MAPPING;
    if (pathMappingEnv) {
      const mappings = pathMappingEnv.split(',');
      for (const mapping of mappings) {
        const [hostPrefix, containerPrefix] = mapping.split(':');
        if (hostPrefix && containerPrefix) {
          this.mappings.push({ hostPrefix, containerPrefix });
        }
      }
    }
    
    // Sort mappings by host prefix length (longest first)
    // This ensures more specific paths are matched first
    this.mappings.sort((a, b) => b.hostPrefix.length - a.hostPrefix.length);
  }
  
  /**
   * Translate a host path to a container path
   */
  toContainerPath(hostPath: string): string {
    // If no mappings configured, return as-is
    if (this.mappings.length === 0) {
      return hostPath;
    }
    
    // Find the first matching mapping
    for (const mapping of this.mappings) {
      if (hostPath.startsWith(mapping.hostPrefix)) {
        return hostPath.replace(mapping.hostPrefix, mapping.containerPrefix);
      }
    }
    
    // No mapping found, return as-is
    return hostPath;
  }
  
  /**
   * Translate a container path back to a host path
   */
  toHostPath(containerPath: string): string {
    // If no mappings configured, return as-is
    if (this.mappings.length === 0) {
      return containerPath;
    }
    
    // Find the first matching mapping (in reverse)
    for (const mapping of this.mappings) {
      if (containerPath.startsWith(mapping.containerPrefix)) {
        return containerPath.replace(mapping.containerPrefix, mapping.hostPrefix);
      }
    }
    
    // No mapping found, return as-is
    return containerPath;
  }
  
  /**
   * Check if path translation is enabled
   */
  isEnabled(): boolean {
    return this.mappings.length > 0;
  }
  
  /**
   * Get current mappings for debugging
   */
  getMappings(): PathMapping[] {
    return [...this.mappings];
  }
}

// Singleton instance
export const pathTranslator = new PathTranslator();