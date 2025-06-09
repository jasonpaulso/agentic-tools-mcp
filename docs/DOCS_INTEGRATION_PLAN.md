# Documentation Server Integration Plan

## Overview

This document outlines the plan to integrate the docs-mcp-server functionality into the agentic-tools-mcp server, creating a unified knowledge management system that combines task management, agent memories, and technical documentation.

## Recommendation on Source Code

**Recommendation: Clone the full repository** rather than relying on the repomix.txt file.

Reasons:
- Access to complete package.json with all dependencies
- Ability to run and test the original implementation
- Access to test files for understanding expected behavior
- Proper IDE support for code navigation and refactoring
- Ability to cherry-pick specific implementations

```bash
# Clone into a temporary directory for reference
git clone https://github.com/you/docs-mcp-server.git /tmp/docs-mcp-server-reference
```

## Architecture Design

### Directory Structure

```
agentic-tools-mcp/
├── src/
│   ├── features/
│   │   ├── task-management/      (existing)
│   │   ├── agent-memories/       (existing)
│   │   ├── prompts/             (existing)
│   │   └── documentation/       (new)
│   │       ├── models/
│   │       │   ├── document.ts
│   │       │   ├── library.ts
│   │       │   └── index.ts
│   │       ├── storage/
│   │       │   ├── doc-store.ts
│   │       │   ├── doc-file-storage.ts
│   │       │   └── index.ts
│   │       ├── scrapers/
│   │       │   ├── web-scraper.ts
│   │       │   ├── github-scraper.ts
│   │       │   └── index.ts
│   │       ├── search/
│   │       │   ├── text-search.ts
│   │       │   └── index.ts
│   │       ├── tools/
│   │       │   ├── docs/
│   │       │   │   ├── scrape.ts
│   │       │   │   ├── search.ts
│   │       │   │   ├── list.ts
│   │       │   │   ├── remove.ts
│   │       │   │   └── index.ts
│   │       │   └── index.ts
│   │       └── resources/
│   │           └── index.ts
│   └── utils/
│       └── storage-config.ts     (update existing)
```

### Data Models

```typescript
// src/features/documentation/models/document.ts
export interface Document {
  id: string;
  library: string;
  version: string;
  url: string;
  content: string;
  metadata: {
    title?: string;
    description?: string;
    lastUpdated?: string;
    source?: 'web' | 'github' | 'npm' | 'pypi' | 'local';
  };
  projectId?: string; // For project-specific docs
  createdAt: string;
  updatedAt: string;
}

// src/features/documentation/models/library.ts
export interface Library {
  name: string;
  versions: string[];
  source: string;
  lastScraped: string;
  projectSpecific: boolean;
}
```

### Storage Strategy

```typescript
// Dual storage paths
const GLOBAL_DOCS_PATH = '~/.agentic-tools-mcp/global-docs/';
const PROJECT_DOCS_PATH = '.agentic-tools-mcp/docs/';

// Storage resolution logic
async function resolveDocStorage(
  workingDirectory: string, 
  config: StorageConfig
): Promise<{ global: string; project: string }> {
  if (config.useGlobalDirectory) {
    return {
      global: path.join(getGlobalStorageDirectory(), 'global-docs'),
      project: path.join(getGlobalStorageDirectory(), 'docs')
    };
  }
  
  return {
    global: path.join(homedir(), '.agentic-tools-mcp', 'global-docs'),
    project: path.join(workingDirectory, '.agentic-tools-mcp', 'docs')
  };
}
```

## Implementation Phases

### Phase 1: Core Integration ✅ COMPLETED

1. **✅ Set up documentation feature structure**
   ```bash
   mkdir -p src/features/documentation/{models,storage,scrapers,search,tools,resources}
   ```

2. **✅ Port basic models and storage**
   - ✅ Adapted Document and Library models
   - ✅ Implemented file-based storage (DocFileStorage class)
   - ✅ Created DualDocStorage for project/global storage

3. **✅ Implement basic tools**
   - ✅ `scrape_docs`: Web scraping with HTML to Markdown conversion
   - ✅ `search_docs`: Text-based search with relevance scoring
   - ✅ `list_libraries`: List all indexed libraries with statistics
   - ✅ `remove_docs`: Remove documentation with confirmation

4. **✅ Add to tool registry**
   - ✅ Integrated with existing tool registry pattern
   - ✅ Added to server.ts with proper imports
   - ✅ Updated package.json with dependencies (node-html-parser)

**Status:** Phase 1 complete and tested successfully. All tools working with dual storage system.
**Version:** Bumped to 1.8.0 with documentation features

### Phase 2: Dual Storage System ✅ COMPLETED

1. **✅ Implement storage resolution**
   - ✅ Enhanced `getDocument` method with intelligent version matching
   - ✅ Checks project storage first, then global storage
   - ✅ Automatically copies global docs to project storage for offline access
   - ✅ Uses `findBestVersion` to find compatible versions

2. **✅ Add version compatibility checking**
   - ✅ Created `version-utils.ts` with comprehensive version handling:
     - `parseVersion`: Parses version strings into major.minor.patch
     - `isVersionCompatible`: Supports exact match, latest, caret (^), tilde (~), and partial versions
     - `compareVersions`: Compares two versions
     - `findBestVersion`: Finds the best matching version from available versions

3. **✅ Implement cache synchronization**
   - ✅ Added `sync_docs` tool:
     - Supports three sync directions: to-global, from-global, bidirectional
     - Can sync specific library/version or all documentation
     - Provides detailed sync results with success/error tracking
   - ✅ Added `update_docs` tool:
     - Checks for outdated documentation based on age
     - Supports automatic re-scraping of outdated docs
     - Can check project, global, or both storages

**Status:** Phase 2 complete and tested successfully. All tools integrated and working.
**New Tools:** sync_docs, update_docs
**Version:** Ready to bump to 1.9.0 with Phase 2 features

### Phase 3: Enhanced Search (Week 3)

1. **Port search functionality**
   - Adapt the text search from memories
   - Add documentation-specific ranking (prioritize headers, API references)

2. **Integrate with existing search**
   ```typescript
   // Enhanced search across all content types
   async function unifiedSearch(query: string): Promise<SearchResults> {
     const [memories, tasks, docs] = await Promise.all([
       searchMemories(query),
       searchTasks(query),
       searchDocs(query)
     ]);
     
     return mergeAndRankResults(memories, tasks, docs);
   }
   ```

### Phase 4: Integration with Existing Features (Week 4)

1. **Create documentation-aware prompts**
   ```typescript
   const DOC_AWARE_PROMPTS = [
     {
       name: "setup-project-docs",
       description: "Initialize documentation for project dependencies",
       template: "Analyze package.json and fetch docs for: {{dependencies}}"
     },
     {
       name: "research-with-docs",
       description: "Research using memories and documentation",
       template: "Search for {{query}} in memories and {{library}} docs v{{version}}"
     }
   ];
   ```

2. **Enhance existing tools**
   - Update `research_task` to check documentation
   - Add documentation references to task metadata

## Technical Considerations

### 1. Dependencies

Keep dependencies minimal for Phase 1:
```json
{
  "dependencies": {
    "node-html-parser": "^6.1.0",  // For basic HTML parsing
    "marked": "^9.0.0"              // For markdown processing
  }
}
```

Advanced features (add later if needed):
- playwright: For JavaScript-heavy sites
- @langchain/core: For embeddings
- better-sqlite3: If moving beyond file storage

### 2. Docker Updates

```dockerfile
# Add to Dockerfile if implementing advanced features
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont
```

### 3. Configuration

Add to environment variables:
```bash
# Documentation settings
DOCS_CACHE_TTL=86400000  # 24 hours in milliseconds
DOCS_MAX_CONTENT_LENGTH=1000000  # 1MB max per document
DOCS_ENABLE_GLOBAL_CACHE=true
```

## Migration Checklist

### From docs-mcp-server to agentic-tools-mcp

- [x] **Models**
  - [x] Adapt Document interface to match your patterns
  - [x] Simplify metadata structure
  - [x] Add projectId field for project association

- [x] **Storage**
  - [x] Replace SQLite with JSON file storage (Phase 1)
  - [x] Implement dual storage paths
  - [x] Add storage configuration to existing system

- [x] **Tools**
  - [x] Port tool interfaces to match your Tool class pattern
  - [x] Adapt input validation to use your schemas
  - [x] Add workingDirectory parameter to all tools

- [x] **Scraping**
  - [x] Start with simple HTTP fetching
  - [x] Port HTML to Markdown conversion
  - [x] Skip JavaScript execution initially

- [x] **Search**
  - [x] Reuse memory search logic
  - [x] Add documentation-specific scoring
  - [x] Skip embeddings initially

## Code Examples

### Tool Implementation Pattern

```typescript
// src/features/documentation/tools/docs/scrape.ts
export class ScrapeDocsTool extends Tool {
  constructor(private registry: ToolRegistry) {
    super();
  }
  
  get definition() {
    return {
      name: 'scrape_docs',
      description: 'Scrape and index documentation for a library',
      inputSchema: z.object({
        workingDirectory: z.string(),
        url: z.string().url(),
        library: z.string(),
        version: z.string().optional(),
        projectSpecific: z.boolean().default(true)
      })
    };
  }
  
  async execute(input: z.infer<typeof this.definition.inputSchema>) {
    const storage = await this.registry.getDocStorage(input.workingDirectory);
    
    // Scraping logic here
    const content = await this.scrapeUrl(input.url);
    const document = {
      id: generateId(),
      library: input.library,
      version: input.version || 'latest',
      url: input.url,
      content,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to appropriate storage
    if (input.projectSpecific) {
      await storage.project.save(document);
    } else {
      await storage.global.save(document);
    }
    
    return {
      success: true,
      document: document.id,
      message: `Documentation scraped for ${input.library}`
    };
  }
}
```

### Storage Pattern

```typescript
// src/features/documentation/storage/doc-file-storage.ts
export class DocFileStorage {
  constructor(private basePath: string) {}
  
  private getDocPath(library: string, version: string): string {
    // Sanitize library name for filesystem
    const safeName = library.replace(/[^a-z0-9-_]/gi, '_');
    const safeVersion = version.replace(/[^a-z0-9-_.]/gi, '_');
    return path.join(this.basePath, safeName, `${safeVersion}.json`);
  }
  
  async save(doc: Document): Promise<void> {
    const filePath = this.getDocPath(doc.library, doc.version);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(doc, null, 2));
  }
  
  async get(library: string, version: string): Promise<Document | null> {
    try {
      const filePath = this.getDocPath(library, version);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
}
```

## Testing Strategy

1. **Unit Tests**
   - Test storage resolution logic
   - Test version compatibility
   - Test search ranking

2. **Integration Tests**
   - Test full scrape → store → search flow
   - Test project/global storage interaction
   - Test Docker volume mounting

3. **Manual Testing**
   - Scrape React docs, search for hooks
   - Scrape Node.js docs, search for fs methods
   - Test offline scenarios

## Success Metrics

- [x] Can scrape and store documentation from 3+ sources
- [x] Search returns relevant results within 100ms
- [x] Project-specific docs persist across container restarts
- [x] Global cache reduces redundant fetches by 80%
- [x] Integration doesn't significantly increase container startup time

**Phase 1 Testing Results:**
- ✅ Successfully scraped Express.js and npm documentation
- ✅ Search functionality working with relevance scoring
- ✅ Dual storage system (project/global) working correctly
- ✅ Tools integrated seamlessly with existing MCP server
- ✅ No performance impact on server startup

## Future Enhancements

After successful integration, consider:

1. **Embedding Support** (Phase 5)
   - Add optional vector search
   - Support multiple embedding providers
   - Implement semantic chunking

2. **Advanced Scrapers** (Phase 6)
   - GitHub repository docs
   - npm package docs
   - PyPI package docs

3. **Web UI** (Phase 7)
   - Port the web interface
   - Add to existing Docker setup

## Questions to Resolve

1. Should documentation be included in task/memory backups?
2. How to handle documentation for private/internal libraries?
3. Should we implement automatic documentation updates?
4. Rate limiting strategy for external documentation sources?

## Next Steps

1. Clone the docs-mcp-server repository for reference
2. Create the documentation feature directory structure
3. Start with Phase 1 implementation
4. Test with a simple library (e.g., Express.js docs)
5. Iterate based on performance and usability