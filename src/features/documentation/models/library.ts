export interface Library {
  name: string;
  versions: string[];
  source: string;
  lastScraped: string;
  projectSpecific: boolean;
}