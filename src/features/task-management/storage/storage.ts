import { Project } from '../models/project.js';
import { Task } from '../models/task.js';
import { Subtask } from '../models/subtask.js';

/**
 * Storage interface for the task management system
 */
export interface Storage {
  // Project operations
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(project: Project): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;

  // Task operations
  getTasks(projectId?: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  createTask(task: Task): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;
  deleteTasksByProject(projectId: string): Promise<number>;

  // Subtask operations
  getSubtasks(taskId?: string, projectId?: string): Promise<Subtask[]>;
  getSubtask(id: string): Promise<Subtask | null>;
  createSubtask(subtask: Subtask): Promise<Subtask>;
  updateSubtask(id: string, updates: Partial<Subtask>): Promise<Subtask | null>;
  deleteSubtask(id: string): Promise<boolean>;
  deleteSubtasksByTask(taskId: string): Promise<number>;
  deleteSubtasksByProject(projectId: string): Promise<number>;
}

/**
 * Data structure for the storage file
 */
export interface StorageData {
  projects: Project[];
  tasks: Task[];
  subtasks: Subtask[];
}

// Type alias for clarity in other parts of the codebase
export type TaskStorage = Storage;
