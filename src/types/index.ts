export interface Agent {
  id: string;
  name: string;
  description: string;
  overview: string;
  instructions: string;
  author: string;
  authorEmail: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  category: string;
  topics: Topic[];
  tools: AgentTool[];
  powerAutomateFlows: PowerAutomateFlow[];
  additionalSections: AdditionalSection[];
  solutionFileName?: string;
  screenshotUrls: string[];
  qualityScore?: number;
  githubUrl?: string;
  forkedFromId?: string;
  forkedFromName?: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  description: string;
  author: string;
  authorEmail: string;
  tags: string[];
  category: string;
  qualityScore?: number;
  createdAt: string;
  solutionFileName?: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  yamlContent: string;
  triggerPhrases: string[];
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  type: string;
}

export interface PowerAutomateFlow {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  purpose: string;
}

export interface AdditionalSection {
  id: string;
  title: string;
  content: string;
}

export interface AgentFormData {
  name: string;
  description: string;
  overview: string;
  instructions: string;
  tags: string[];
  category: string;
  githubUrl?: string;
  topics: Omit<Topic, 'id'>[];
  tools: Omit<AgentTool, 'id'>[];
  powerAutomateFlows: Omit<PowerAutomateFlow, 'id'>[];
  additionalSections: Omit<AdditionalSection, 'id'>[];
}

export interface AgentIndex {
  agents: AgentSummary[];
  tags: string[];
  categories: string[];
  generatedAt: string;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}
