/**
 * Local type definitions for @elizaos/core types that are not properly
 * exported from the package (due to broken .d.ts paths in the published build).
 * Use these in place of importing types from "@elizaos/core" when type errors occur.
 */

export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export interface Content {
  thought?: string;
  text?: string;
  actions?: string[];
  providers?: string[];
  source?: string;
  target?: string;
  url?: string;
  inReplyTo?: UUID;
  attachments?: Media[];
  channelType?: number | string;
  [key: string]: unknown;
}

export interface Media {
  id: string;
  url: string;
  title?: string;
  source?: string;
  description?: string;
  text?: string;
  contentType?: string;
}

export interface Memory {
  id?: UUID;
  entityId: UUID;
  agentId?: UUID;
  roomId?: UUID;
  createdAt?: number;
  content: Content;
  metadata?: Record<string, unknown>;
}

/** Metadata on messages (e.g. entityName). */
export interface CustomMetadata {
  entityName?: string;
  [key: string]: unknown;
}

export interface Entity {
  id?: UUID;
  names: string[];
  metadata: Record<string, unknown>;
  agentId: UUID;
  components?: unknown[];
}

export interface ActionExample {
  name: string;
  content: Content;
}

export type HandlerCallback = (response: Content) => Promise<Memory[]>;
export type Handler = (
  runtime: IAgentRuntime,
  message: Memory,
  state?: Record<string, unknown>,
  options?: unknown,
  callback?: HandlerCallback,
  responses?: Memory[],
) => Promise<ActionResult | void | undefined>;
export type Validator = (
  runtime: IAgentRuntime,
  message: Memory,
  state?: Record<string, unknown>,
) => Promise<boolean>;

export interface Action {
  name: string;
  description: string;
  validate: Validator;
  handler: Handler;
  similes?: string[];
  examples?: ActionExample[][];
  [key: string]: unknown;
}

export interface Evaluator {
  name: string;
  description: string;
  validate: Validator;
  handler: Handler;
  examples: Array<{
    prompt: string;
    messages: ActionExample[];
    outcome: string;
  }>;
  similes?: string[];
  alwaysRun?: boolean;
}

export interface ProviderResult {
  text?: string;
  values?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface Provider {
  name: string;
  description?: string;
  dynamic?: boolean;
  position?: number;
  private?: boolean;
  get: (
    runtime: IAgentRuntime,
    message: Memory,
    state: Record<string, unknown>,
  ) => Promise<ProviderResult>;
}

export interface ActionResult {
  success: boolean;
  text?: string;
  values?: Record<string, unknown>;
  data?: Record<string, unknown>;
  error?: string | Error;
}

export interface IAgentRuntime {
  agentId: UUID;
  character: {
    name?: string;
    templates?: { messageHandlerTemplate?: string };
    [key: string]: unknown;
  };
  registerAction(action: Action): void;
  registerProvider(provider: Provider): void;
  registerEvaluator(evaluator: Evaluator): void;
  createMemory(memory: Memory, type: string): Promise<void>;
  addEmbeddingToMemory(memory: Memory): Promise<void>;
  updateEntity(entity: Entity): Promise<void>;
  emitEvent(eventType: string, payload: unknown): Promise<void>;
  composeState(
    message: Memory,
    providerNames: string[],
  ): Promise<Record<string, unknown>>;
  useModel(
    modelType: string,
    params: Record<string, unknown>,
  ): Promise<{ text?: string }>;
  getEntityById(entityId: UUID): Promise<Entity | null>;
  ensureConnection(args: Record<string, unknown>): Promise<void>;
  ensureWorldExists(args: Record<string, unknown>): Promise<void>;
  ensureRoomExists(args: Record<string, unknown>): Promise<void>;
  getAllServices(): Map<string, unknown>;
  getService(serviceName: string): unknown;
  getRoomsForParticipants(entityIds: UUID[]): Promise<UUID[]>;
  getMemoriesByRoomIds(args: {
    tableName: string;
    roomIds: UUID[];
    limit?: number;
  }): Promise<Memory[]>;
  getConversationLength(): number;
  getRoom(roomId: UUID): Promise<unknown>;
  getMemories(args: Record<string, unknown>): Promise<Memory[]>;
  [key: string]: unknown;
}

export interface EventPayload {
  runtime: IAgentRuntime;
  source: string;
  onComplete?: () => void;
}

export interface ActionEventPayload extends EventPayload {
  roomId: UUID;
  world: UUID;
  content: Content;
  messageId?: UUID;
}

export interface EntityPayload extends EventPayload {
  entityId: UUID;
  worldId?: UUID;
  roomId?: UUID;
  metadata?: Record<string, unknown>;
}

export interface WorldPayload extends EventPayload {
  world: { id: UUID; [key: string]: unknown };
  rooms: unknown[];
  entities: Entity[];
}

export interface MessagePayload extends EventPayload {
  message: Memory;
  callback?: HandlerCallback;
}

export interface MessageReceivedHandlerParams {
  runtime: IAgentRuntime;
  message: Memory;
  callback?: HandlerCallback;
}

/** Channel type for rooms/channels (matches @elizaos/core ChannelType enum values). */
export type ChannelType = string | number;

export interface Plugin {
  name: string;
  description: string;
  init?: (
    config: Record<string, string>,
    runtime: IAgentRuntime,
  ) => Promise<void>;
  config?: Record<string, string | number | boolean | null | undefined>;
  actions?: Action[];
  providers?: Provider[];
  evaluators?: Evaluator[];
  events?: Record<string, ((params: unknown) => Promise<void>)[]>;
  [key: string]: unknown;
}
