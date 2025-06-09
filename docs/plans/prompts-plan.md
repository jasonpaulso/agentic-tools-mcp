I'll review the MCP server file and the documentation about prompts to suggest some useful prompts for the agentic-tools-mcp server.Now let me fetch the MCP prompts documentation:Based on my review of the agentic-tools-mcp server and the MCP prompts documentation, I can see this is a comprehensive task management and memory system. Here are some useful prompts that would be handy to add to this server:

## Suggested Prompts for agentic-tools-mcp

### 1. **Project Kickoff Prompt**
```typescript
{
  name: "project-kickoff",
  description: "Initialize a new project with standard structure and initial tasks",
  arguments: [
    {
      name: "projectType",
      description: "Type of project (web-app, api, library, etc.)",
      required: true
    },
    {
      name: "techStack",
      description: "Primary technologies to use",
      required: false
    }
  ]
}
```
This would create a project, parse a standard PRD template, generate initial tasks based on project type, and create relevant memory entries for project decisions.

### 2. **Daily Standup Prompt**
```typescript
{
  name: "daily-standup",
  description: "Generate daily standup report with progress and blockers",
  arguments: [
    {
      name: "projectId",
      description: "Project to report on (optional, defaults to all)",
      required: false
    }
  ]
}
```
This would analyze task progress, identify completed work since last standup, highlight blocked tasks, and recommend next priorities.

### 3. **Sprint Planning Prompt**
```typescript
{
  name: "sprint-planning",
  description: "Plan the next sprint based on priorities and capacity",
  arguments: [
    {
      name: "sprintDuration",
      description: "Sprint duration in days",
      required: true
    },
    {
      name: "teamCapacity",
      description: "Available hours for the sprint",
      required: true
    }
  ]
}
```
This would analyze task complexity and estimates, check dependencies, recommend tasks for the sprint, and create a sprint memory entry.

### 4. **Code Review Checklist Prompt**
```typescript
{
  name: "code-review-checklist",
  description: "Generate code review checklist based on task implementation",
  arguments: [
    {
      name: "taskId",
      description: "Task that was implemented",
      required: true
    }
  ]
}
```
This would analyze the task details, search memories for coding standards, generate a context-specific checklist, and optionally research best practices.

### 5. **Technical Decision Record Prompt**
```typescript
{
  name: "technical-decision",
  description: "Document a technical decision with context and rationale",
  arguments: [
    {
      name: "decision",
      description: "The decision being made",
      required: true
    },
    {
      name: "alternatives",
      description: "Alternatives considered",
      required: false
    }
  ]
}
```
This would create a structured memory entry, link to related tasks, research pros/cons if needed, and update relevant task details.

### 6. **Task Breakdown Assistant Prompt**
```typescript
{
  name: "breakdown-complex-task",
  description: "Intelligently break down a complex task into subtasks",
  arguments: [
    {
      name: "taskId",
      description: "ID of the complex task to break down",
      required: true
    },
    {
      name: "targetComplexity",
      description: "Target complexity for subtasks (1-5)",
      required: false
    }
  ]
}
```
This would analyze task complexity, suggest logical subtask divisions, create subtasks with dependencies, and update the parent task.

### 7. **Knowledge Base Search Prompt**
```typescript
{
  name: "find-solution",
  description: "Search memories and research for solutions to a problem",
  arguments: [
    {
      name: "problem",
      description: "Problem or error to solve",
      required: true
    },
    {
      name: "context",
      description: "Additional context (task ID, tech stack, etc.)",
      required: false
    }
  ]
}
```
This would search existing memories, optionally research online, synthesize findings, and save new insights to memory.

### 8. **Progress Report Prompt**
```typescript
{
  name: "progress-report",
  description: "Generate comprehensive project progress report",
  arguments: [
    {
      name: "reportType",
      description: "Type of report (weekly, milestone, executive)",
      required: true
    },
    {
      name: "includeMetrics",
      description: "Include velocity and estimation metrics",
      required: false
    }
  ]
}
```
This would analyze completion rates, identify trends and blockers, calculate metrics, and format appropriate report.

### Implementation Example

Here's how you might implement one of these prompts in the server:

```typescript
// In the server initialization
server.prompt(
  'daily-standup',
  'Generate daily standup report with progress and blockers',
  [
    {
      name: 'projectId',
      description: 'Project to report on (optional, defaults to all)',
      required: false
    }
  ],
  async ({ projectId }) => {
    const storage = await createStorage(workingDirectory, config);
    const memoryStorage = await createMemoryStorage(workingDirectory, config);
    
    // Get tasks updated in last 24 hours
    const tasks = await storage.listTasks(projectId);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentTasks = tasks.filter(task => 
      new Date(task.updatedAt) > yesterday
    );
    
    // Build standup template
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Generate a standup report for ${projectId || 'all projects'}`
          }
        },
        {
          role: "assistant", 
          content: {
            type: "text",
            text: `## Daily Standup Report

### Yesterday's Progress:
${recentTasks.filter(t => t.status === 'done').map(t => `- Completed: ${t.name}`).join('\n')}

### Today's Focus:
${recentTasks.filter(t => t.status === 'in-progress').map(t => `- Working on: ${t.name}`).join('\n')}

### Blockers:
${recentTasks.filter(t => t.status === 'blocked').map(t => `- Blocked: ${t.name}`).join('\n')}

Use get_next_task_recommendation to see prioritized tasks for today.`
          }
        }
      ]
    };
  }
);
```

These prompts would significantly enhance the developer experience by providing quick access to common workflows and intelligent task management operations. Would you like me to elaborate on any of these suggestions or provide more implementation details?