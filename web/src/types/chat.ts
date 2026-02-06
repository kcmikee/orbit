import { UIMessage } from "ai";

export interface Citation {
  url: string;
  content: string;
  title: string;
}

export interface ChatStreamData {
  citations?: Citation[];
}

export interface ChatRequest {
  messages: UIMessage[];
}

export interface ChatResponse extends ChatStreamData {
  id: string;
  messages: UIMessage[];
  followUpPrompts?: string[];
}
