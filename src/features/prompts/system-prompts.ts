/**
 * System-provided prompt templates
 */

import { Prompt } from './models/prompt.js';

export const SYSTEM_PROMPTS: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // 1. Project Kickoff Prompt
  {
    name: 'project-kickoff',
    description: 'Initialize a new project with standard structure and initial tasks',
    category: 'project-management',
    tags: ['project', 'initialization', 'setup'],
    arguments: [
      {
        name: 'projectType',
        description: 'Type of project (web-app, api, library, cli, mobile-app, etc.)',
        required: true,
      },
      {
        name: 'projectName',
        description: 'Name of the project',
        required: true,
      },
      {
        name: 'techStack',
        description: 'Primary technologies to use (e.g., "React, TypeScript, Node.js")',
        required: false,
        default: '',
      },
      {
        name: 'description',
        description: 'Brief description of the project',
        required: false,
        default: '',
      },
    ],
    template: `I need to set up a new {{projectType}} project called "{{projectName}}".

Project Details:
- Type: {{projectType}}
- Name: {{projectName}}
{{#if techStack}}- Tech Stack: {{techStack}}{{/if}}
{{#if description}}- Description: {{description}}{{/if}}

Please help me:
1. Create the project with appropriate initial structure
2. Set up standard configuration files  
3. Generate initial tasks for development
4. Create memory entries for key project decisions

Focus on best practices for {{projectType}} projects{{#if techStack}} using {{techStack}}{{/if}}.`,
  },

  // 2. Daily Standup Prompt
  {
    name: 'daily-standup',
    description: 'Generate daily standup report with progress and blockers',
    category: 'project-management',
    tags: ['standup', 'daily', 'progress', 'agile'],
    arguments: [
      {
        name: 'projectId',
        description: 'Project to report on (optional, defaults to all)',
        required: false,
      },
      {
        name: 'lookbackDays',
        description: 'Number of days to look back for progress',
        required: false,
        default: 1,
      },
    ],
    template: `Generate a daily standup report {{#if projectId}}for project {{projectId}}{{else}}for all active projects{{/if}}.

Analyze work from the last {{lookbackDays}} day(s) and provide:
1. Tasks completed yesterday
2. Tasks in progress today
3. Any blockers or issues
4. Next priorities

Format as a concise standup update suitable for team communication.`,
  },

  // 3. Sprint Planning Prompt  
  {
    name: 'sprint-planning',
    description: 'Plan the next sprint based on priorities and capacity',
    category: 'project-management',
    tags: ['sprint', 'planning', 'agile', 'scrum'],
    arguments: [
      {
        name: 'sprintDuration',
        description: 'Sprint duration in days',
        required: true,
      },
      {
        name: 'teamCapacity',
        description: 'Available hours for the sprint',
        required: true,
      },
      {
        name: 'projectId',
        description: 'Project ID to plan sprint for',
        required: false,
      },
      {
        name: 'focusAreas',
        description: 'Specific areas to focus on (optional)',
        required: false,
      },
    ],
    template: `Plan a {{sprintDuration}}-day sprint with {{teamCapacity}} hours of capacity{{#if projectId}} for project {{projectId}}{{/if}}.

{{#if focusAreas}}Focus areas: {{focusAreas}}{{/if}}

Please:
1. Analyze pending tasks by priority and complexity
2. Check task dependencies
3. Recommend tasks that fit within capacity
4. Create a balanced sprint plan
5. Identify potential risks or bottlenecks

Consider task complexity, dependencies, and team velocity in your recommendations.`,
  },

  // 4. Code Review Checklist Prompt
  {
    name: 'code-review-checklist', 
    description: 'Generate code review checklist based on task implementation',
    category: 'development',
    tags: ['code-review', 'quality', 'checklist'],
    arguments: [
      {
        name: 'taskId',
        description: 'Task that was implemented',
        required: true,
      },
      {
        name: 'files',
        description: 'List of files changed (optional)',
        required: false,
      },
      {
        name: 'prNumber',
        description: 'Pull request number (optional)',
        required: false,
      },
    ],
    template: `Generate a code review checklist for task {{taskId}}{{#if prNumber}} (PR #{{prNumber}}){{/if}}.

{{#if files}}Files changed: {{files}}{{/if}}

Create a comprehensive checklist covering:
1. Functionality and requirements
2. Code quality and standards
3. Performance considerations
4. Security implications
5. Testing coverage
6. Documentation needs

Base the checklist on the task details and any coding standards stored in memories.`,
  },

  // 5. Technical Decision Record Prompt
  {
    name: 'technical-decision',
    description: 'Document a technical decision with context and rationale',
    category: 'documentation',
    tags: ['adr', 'decision', 'architecture', 'documentation'],
    arguments: [
      {
        name: 'decision',
        description: 'The decision being made',
        required: true,
      },
      {
        name: 'context',
        description: 'Context and background for the decision',
        required: true,
      },
      {
        name: 'alternatives',
        description: 'Alternatives considered (comma-separated)',
        required: false,
      },
      {
        name: 'consequences',
        description: 'Expected consequences of the decision',
        required: false,
      },
    ],
    template: `Document the following technical decision:

**Decision**: {{decision}}

**Context**: {{context}}

{{#if alternatives}}**Alternatives Considered**: {{alternatives}}{{/if}}

{{#if consequences}}**Expected Consequences**: {{consequences}}{{/if}}

Please:
1. Create a structured decision record
2. Analyze pros and cons
3. Document the rationale
4. Link to related tasks if applicable
5. Save as a memory for future reference

Format as an Architecture Decision Record (ADR).`,
  },

  // 6. Task Breakdown Assistant Prompt
  {
    name: 'breakdown-complex-task',
    description: 'Intelligently break down a complex task into subtasks',
    category: 'task-management',
    tags: ['tasks', 'breakdown', 'planning', 'subtasks'],
    arguments: [
      {
        name: 'taskId',
        description: 'ID of the complex task to break down',
        required: true,
      },
      {
        name: 'targetComplexity',
        description: 'Target complexity for subtasks (1-5)',
        required: false,
        default: 3,
      },
      {
        name: 'maxSubtasks',
        description: 'Maximum number of subtasks to create',
        required: false,
        default: 10,
      },
    ],
    template: `Break down task {{taskId}} into manageable subtasks.

Target complexity: {{targetComplexity}}/5
Maximum subtasks: {{maxSubtasks}}

Please:
1. Analyze the task's requirements and complexity
2. Identify logical divisions of work
3. Create subtasks with clear boundaries
4. Set up proper dependencies
5. Estimate time for each subtask

Ensure each subtask is:
- Self-contained and testable
- At or below target complexity
- Properly sequenced with dependencies`,
  },

  // 7. Knowledge Base Search Prompt
  {
    name: 'find-solution',
    description: 'Search memories and research for solutions to a problem',
    category: 'problem-solving',
    tags: ['search', 'solution', 'knowledge', 'debug'],
    arguments: [
      {
        name: 'problem',
        description: 'Problem or error to solve',
        required: true,
      },
      {
        name: 'context',
        description: 'Additional context (task ID, tech stack, error details, etc.)',
        required: false,
      },
      {
        name: 'searchExternal',
        description: 'Whether to search external sources',
        required: false,
        default: false,
      },
    ],
    template: `Help me find a solution to: {{problem}}

{{#if context}}Context: {{context}}{{/if}}

Steps:
1. Search existing memories for similar problems/solutions
2. Analyze the problem and identify root causes
{{#if searchExternal}}3. Research external sources if needed{{/if}}
4. Synthesize findings into actionable solutions
5. Save new insights to memory for future reference

Provide practical, implementable solutions with clear steps.`,
  },

  // 8. Progress Report Prompt
  {
    name: 'progress-report',
    description: 'Generate comprehensive project progress report',
    category: 'reporting',
    tags: ['report', 'progress', 'metrics', 'status'],
    arguments: [
      {
        name: 'reportType',
        description: 'Type of report (weekly, milestone, executive)',
        required: true,
      },
      {
        name: 'projectId',
        description: 'Project to report on (optional, defaults to all)',
        required: false,
      },
      {
        name: 'includeMetrics',
        description: 'Include velocity and estimation metrics',
        required: false,
        default: true,
      },
      {
        name: 'period',
        description: 'Reporting period (e.g., "last week", "last month")',
        required: false,
        default: 'last week',
      },
    ],
    template: `Generate a {{reportType}} progress report{{#if projectId}} for project {{projectId}}{{/if}} covering {{period}}.

Report Requirements:
- Type: {{reportType}}
- Include Metrics: {{includeMetrics}}

Please generate a report that includes:
1. Executive summary
2. Tasks completed
3. Tasks in progress
4. Upcoming milestones
{{#if includeMetrics}}5. Velocity and estimation accuracy metrics{{/if}}
6. Risks and blockers
7. Recommendations

Format appropriately for {{reportType}} audience.`,
  },
];