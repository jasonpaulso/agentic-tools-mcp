import { z } from 'zod';
import { createTool, ToolDefinition } from '../base-tool.js';
import { ToolRegistry } from '../registry.js';
import { getWorkingDirectoryDescription } from '../../utils/storage-config.js';
import { createParsePRDTool } from '../../features/task-management/tools/prd/parse-prd.js';
import { createNextTaskRecommendationTool } from '../../features/task-management/tools/recommendations/next-task.js';
import { createComplexityAnalysisTool } from '../../features/task-management/tools/analysis/complexity-analysis.js';
import { createProgressInferenceTool } from '../../features/task-management/tools/analysis/progress-inference.js';
import { createTaskResearchTool } from '../../features/task-management/tools/research/task-research.js';
import { createResearchQueriesGeneratorTool } from '../../features/task-management/tools/research/research-queries.js';

export function createAdvancedTaskTools(registry: ToolRegistry): ToolDefinition[] {
  const config = registry.config;
  
  return [
    // Parse PRD
    createTool(
      'parse_prd',
      'Parse a Product Requirements Document (PRD) and automatically generate structured tasks with dependencies, priorities, and complexity estimates. Transform high-level requirements into actionable task breakdowns with intelligent analysis.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        projectId: z.string().describe('ID of the project to add tasks to'),
        prdContent: z.string().describe('Content of the Product Requirements Document to parse'),
        generateSubtasks: z.boolean().optional().default(true).describe('Whether to generate subtasks for complex tasks'),
        defaultPriority: z.number().min(1).max(10).optional().default(5).describe('Default priority for generated tasks (1-10)'),
        estimateComplexity: z.boolean().optional().default(true).describe('Whether to estimate complexity for tasks'),
      }),
      async ({ workingDirectory, ...params }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createParsePRDTool(storage, getWorkingDirectoryDescription, config);
        return await tool.handler({ workingDirectory, ...params });
      }
    ),

    // Get Next Task Recommendation
    createTool(
      'get_next_task_recommendation',
      'Get intelligent recommendations for the next task to work on based on dependencies, priorities, complexity, and current project status. Smart task recommendation engine for optimal workflow management and productivity.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        projectId: z.string().optional().describe('Filter recommendations to a specific project'),
        maxRecommendations: z.number().min(1).max(10).optional().default(3).describe('Maximum number of task recommendations to return'),
        considerComplexity: z.boolean().optional().default(true).describe('Whether to factor in task complexity for recommendations'),
        preferredTags: z.array(z.string()).optional().describe('Preferred task tags to prioritize in recommendations'),
        excludeBlocked: z.boolean().optional().default(true).describe('Whether to exclude blocked tasks from recommendations'),
      }),
      async ({ workingDirectory, ...params }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createNextTaskRecommendationTool(storage, getWorkingDirectoryDescription, config);
        return await tool.handler({ workingDirectory, ...params });
      }
    ),

    // Analyze Task Complexity
    createTool(
      'analyze_task_complexity',
      'Analyze task complexity and suggest breaking down overly complex tasks into smaller, manageable subtasks. Intelligent complexity analysis to identify tasks that should be split for better productivity and progress tracking.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        taskId: z.string().optional().describe('Specific task ID to analyze (if not provided, analyzes all tasks)'),
        projectId: z.string().optional().describe('Filter analysis to a specific project'),
        complexityThreshold: z.number().min(1).max(10).optional().default(7).describe('Complexity threshold above which tasks should be broken down'),
        suggestBreakdown: z.boolean().optional().default(true).describe('Whether to suggest specific task breakdowns'),
        autoCreateSubtasks: z.boolean().optional().default(false).describe('Whether to automatically create suggested subtasks'),
      }),
      async ({ workingDirectory, ...params }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createComplexityAnalysisTool(storage, getWorkingDirectoryDescription, config);
        return await tool.handler({ workingDirectory, ...params });
      }
    ),

    // Infer Task Progress
    createTool(
      'infer_task_progress',
      'Analyze the codebase to infer which tasks appear to be completed based on code changes, file creation, and implementation evidence. Intelligent progress inference to automatically track task completion from code analysis.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        projectId: z.string().optional().describe('Filter analysis to a specific project'),
        scanDepth: z.number().min(1).max(5).optional().default(3).describe('Directory depth to scan for code files'),
        fileExtensions: z.array(z.string()).optional().default(['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cs', '.go', '.rs']).describe('File extensions to analyze'),
        autoUpdateTasks: z.boolean().optional().default(false).describe('Whether to automatically update task status based on inference'),
        confidenceThreshold: z.number().min(0).max(1).optional().default(0.7).describe('Confidence threshold for auto-updating tasks (0-1)'),
      }),
      async ({ workingDirectory, ...params }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createProgressInferenceTool(storage, getWorkingDirectoryDescription, config);
        return await tool.handler({ workingDirectory, ...params });
      }
    ),

    // Research Task
    createTool(
      'research_task',
      'Guide the AI agent to perform comprehensive web research for a task, with intelligent research suggestions and automatic memory storage of findings. Combines web research capabilities with local knowledge caching and indexed documentation for optimal research workflow.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        taskId: z.string().describe('ID of the task to research'),
        researchAreas: z.array(z.string()).optional().describe('Specific areas to research (auto-generated if not provided)'),
        saveToMemories: z.boolean().optional().default(true).describe('Whether to save research findings to memories'),
        checkExistingMemories: z.boolean().optional().default(true).describe('Whether to check existing memories first'),
        checkDocumentation: z.boolean().optional().default(true).describe('Whether to check indexed documentation'),
        researchDepth: z.enum(['quick', 'standard', 'comprehensive']).optional().default('standard').describe('Depth of research to perform'),
      }),
      async ({ workingDirectory, ...params }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const memoryStorage = await registry.createMemoryStorage(workingDirectory);
        const docStorage = await registry.createDocStorage(workingDirectory);
        const tool = createTaskResearchTool(storage, memoryStorage, getWorkingDirectoryDescription, config, docStorage);
        return await tool.handler({ workingDirectory, ...params });
      }
    ),

    // Generate Research Queries
    createTool(
      'generate_research_queries',
      'Generate intelligent, targeted web search queries for task research. Provides structured search strategies to help AI agents find the most relevant information efficiently with optimized search terms and techniques.',
      z.object({
        workingDirectory: z.string().describe(getWorkingDirectoryDescription(config)),
        taskId: z.string().describe('ID of the task to generate research queries for'),
        queryTypes: z.array(z.enum(['implementation', 'best_practices', 'troubleshooting', 'alternatives', 'performance', 'security', 'examples', 'tools'])).optional().describe('Types of queries to generate'),
        includeAdvanced: z.boolean().optional().default(false).describe('Include advanced search operators and techniques'),
        targetYear: z.number().optional().default(new Date().getFullYear()).describe('Target year for recent information (default: current year)'),
      }),
      async ({ workingDirectory, ...params }) => {
        const storage = await registry.createTaskStorage(workingDirectory);
        const tool = createResearchQueriesGeneratorTool(storage, getWorkingDirectoryDescription, config);
        return await tool.handler({ workingDirectory, ...params });
      }
    ),
  ];
}