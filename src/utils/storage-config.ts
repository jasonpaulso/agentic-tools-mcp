import { homedir } from 'os';
import { join } from 'path';
import { pathTranslator } from './path-translator.js';

/**
 * Configuration for storage directory resolution
 */
export interface StorageConfig {
  /** Whether to use global user directory instead of project-specific directories */
  useGlobalDirectory: boolean;
}

/**
 * Parse command-line arguments to determine storage configuration
 */
export function parseCommandLineArgs(): StorageConfig {
  const args = process.argv.slice(2);
  const useGlobalDirectory = args.includes('--claude');
  
  return {
    useGlobalDirectory
  };
}

/**
 * Get the global storage directory path
 * - Windows: C:\Users\{username}\.agentic-tools-mcp\
 * - macOS/Linux: ~/.agentic-tools-mcp/
 */
export function getGlobalStorageDirectory(): string {
  const userHome = homedir();
  return join(userHome, '.agentic-tools-mcp');
}

/**
 * Resolve the actual working directory based on configuration
 * 
 * @param providedPath - The working directory path provided by the user
 * @param config - Storage configuration including global directory flag
 * @returns The actual working directory to use for storage
 */
export function resolveWorkingDirectory(providedPath: string, config: StorageConfig): string {
  if (config.useGlobalDirectory) {
    return getGlobalStorageDirectory();
  }
  
  // Apply path translation if running in Docker
  const translatedPath = pathTranslator.toContainerPath(providedPath);
  
  // Log translation for debugging if enabled
  if (pathTranslator.isEnabled() && translatedPath !== providedPath) {
    console.log(`Path translation: ${providedPath} -> ${translatedPath}`);
  }
  
  return translatedPath;
}

/**
 * Get updated parameter description for workingDirectory that includes --claude flag behavior
 */
export function getWorkingDirectoryDescription(config: StorageConfig): string {
  const baseDescription = 'The full absolute path to the working directory where data is stored. MUST be an absolute path, never relative. Windows: "C:\\Users\\username\\project" or "D:\\projects\\my-app". Unix/Linux/macOS: "/home/username/project" or "/Users/username/project". Do NOT use: ".", "..", "~", "./folder", "../folder" or any relative paths. Ensure the path exists and is accessible before calling this tool.';
  
  if (config.useGlobalDirectory) {
    return baseDescription + ' NOTE: Server started with --claude flag, so this parameter is ignored and a global user directory is used instead.';
  }
  
  return baseDescription + ' NOTE: When server is started with --claude flag, this parameter is ignored and a global user directory is used instead.';
}

/**
 * Get the current storage configuration
 * This is a convenience function for tools that need to access the config
 */
export function getStorageConfig(): StorageConfig {
  return parseCommandLineArgs();
}
