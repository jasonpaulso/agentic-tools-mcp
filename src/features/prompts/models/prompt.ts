/**
 * Prompt model for the prompts system
 */

export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
  default?: any;
}

export interface PromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  };
}

export interface Prompt {
  id: string;
  name: string;
  description: string;
  arguments: PromptArgument[];
  category?: string;
  tags?: string[];
  template?: string;
  messages?: PromptMessage[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PromptExecution {
  promptId: string;
  argumentValues: Record<string, any>;
  messages: PromptMessage[];
  metadata?: Record<string, any>;
}

export interface PromptExecutionResult {
  messages: PromptMessage[];
  metadata?: Record<string, any>;
}