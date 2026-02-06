/**
 * Runtime re-exports from @elizaos/core. The package's published .d.ts use
 * broken internal paths, so TypeScript cannot resolve its exports. We require
 * the package at runtime and re-export with explicit types.
 */
import type { UUID } from "@/elizaos-core-types";

interface CoreModule {
  asUUID: (id: string) => UUID;
  addHeader: (header: string, content: string) => string;
  ChannelType: Record<string, unknown>;
  composePromptFromState: (state: Record<string, unknown>) => string;
  createUniqueUuid: (runtime: unknown, id: string) => UUID;
  EventType: { RUN_STARTED: string; RUN_ENDED: string; [key: string]: string };
  formatMessages: (messages: unknown[]) => string;
  formatPosts: (posts: unknown[]) => string;
  getEntityDetails: (entity: unknown) => string;
  KnowledgeItem: unknown;
  logger: {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
  };
  MemoryType: Record<string, string>;
  ModelType: Record<string, string>;
}

const core = require("@elizaos/core") as CoreModule;

export const addHeader = core.addHeader;
export const asUUID = core.asUUID;
export const ChannelType = core.ChannelType;
export const composePromptFromState = core.composePromptFromState;
export const createUniqueUuid = core.createUniqueUuid;
export const EventType = core.EventType;
export const formatMessages = core.formatMessages;
export const formatPosts = core.formatPosts;
export const getEntityDetails = core.getEntityDetails;
export const KnowledgeItem = core.KnowledgeItem;
export const logger = core.logger;
export const MemoryType = core.MemoryType;
export const ModelType = core.ModelType;
