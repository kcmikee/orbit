"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { ChatMessages } from "@/components/chat-messages";
import { TextareaWithActions } from "@/components/textarea-with-actions";
import { ChatSessions } from "@/components/chat-sessions";
import { Button } from "@/components/button";
import { ConnectWalletModal } from "@/components/connect-wallet-modal";
import { USER_NAME, CHAT_SOURCE } from "@/constants";
import {
  useWalletConnection,
  WALLET_CONNECTED_EVENT,
} from "@/hooks/use-wallet-connection";
import SocketIOManager, {
  ControlMessageData,
  MessageBroadcastData,
} from "@/lib/socketio-manager";
import type { ChatMessage } from "@/types/chat-message";
import { getOrGenerateUserEntity } from "@/lib/local-storage";
// import {
//   executeDepositFromChat,
//   type TransactionIntent,
// } from "@/lib/wallet-transaction";
import {
  getChannelMessages,
  getRoomMemories,
  pingServer,
} from "@/lib/api-client";

// Simple spinner component
const LoadingSpinner = () => (
  <svg
    className="w-4 h-4 animate-spin text-zinc-600 dark:text-zinc-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

interface ChatProps {
  sessionId?: string;
}

export const Chat = ({ sessionId: propSessionId }: ChatProps = {}) => {
  const router = useRouter();

  // --- Environment Configuration ---
  const agentId = process.env.NEXT_PUBLIC_AGENT_ID;
  const serverId = "00000000-0000-0000-0000-000000000000"; // Default server ID from ElizaOS

  // --- User Entity ---
  const [userEntity, setUserEntity] = useState<string | null>(null);

  // --- State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [inputDisabled, setInputDisabled] = useState<boolean>(false);
  const [sessionId] = useState<string | null>(propSessionId || null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [isAgentThinking, setIsAgentThinking] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "error"
  >("connecting");
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [agentStatus, setAgentStatus] = useState<
    "checking" | "ready" | "error"
  >("checking");
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [confirmingMessageId, setConfirmingMessageId] = useState<string | null>(
    null,
  );
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const isWalletConnected = useWalletConnection();

  // --- Refs ---
  const initStartedRef = useRef(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketIOManager = SocketIOManager.getInstance();

  // Format time ago utility
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Auto-scroll messages to bottom when new message or thinking state changes
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    // Use requestAnimationFrame so DOM has updated (new message/thinking UI)
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [messages, isAgentThinking]);

  // Initialize user entity on client side only to avoid hydration mismatch
  useEffect(() => {
    const entity = getOrGenerateUserEntity();
    if (entity) setUserEntity(entity);
  }, []);

  // --- Check Server Status ---
  useEffect(() => {
    if (!agentId) return; // Guard against missing config

    const checkServer = async () => {
      try {
        console.log("[Chat] Checking server status...");
        const isOnline = await pingServer();
        console.log("[Chat] Server ping result:", isOnline);
        setServerStatus(isOnline ? "online" : "offline");
        if (!isOnline) {
          setConnectionStatus("error");
        }
      } catch (error) {
        console.error("[Chat] Server check failed:", error);
        setServerStatus("offline");
        setConnectionStatus("error");
      }
    };

    checkServer();
  }, [agentId]);

  // Function to create a new chat session
  const createNewSession = useCallback(
    async (initialMessage?: string) => {
      if (!userEntity || !agentId) return null;

      try {
        console.log(
          `[Chat] Creating new session with initial message: "${initialMessage}"`,
        );

        const response = await fetch("/api/chat-session/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userEntity,
            initialMessage: initialMessage,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create session");
        }

        const result = await response.json();
        const newSessionId = result.data.sessionId;
        const newChannelId = result.data.channelId;

        console.log(
          `[Chat] Created new session: ${newSessionId} with channel: ${newChannelId}`,
        );

        // Navigate to the new session
        router.push(`/chat/${newSessionId}`);

        return { sessionId: newSessionId, channelId: newChannelId };
      } catch (error) {
        console.error("[Chat] Failed to create new session:", error);
        return null;
      }
    },
    [userEntity, agentId, router],
  );

  // --- Load Session Data ---
  useEffect(() => {
    if (!sessionId || !userEntity || !agentId) return;

    // Reset session state for new session
    initStartedRef.current = false;
    setMessages([]);
    setIsLoadingHistory(true);
    setIsAgentThinking(false);

    const loadSession = async () => {
      try {
        console.log(`[Chat] Loading session: ${sessionId}`);

        const response = await fetch(
          `/api/chat-session/${sessionId}?userId=${encodeURIComponent(userEntity)}`,
        );

        if (!response.ok) {
          if (response.status === 404) {
            console.error(`[Chat] Session ${sessionId} not found`);
            // Redirect to home page for invalid sessions
            router.push("/");
            return;
          }
          throw new Error("Failed to load session");
        }

        const result = await response.json();
        const session = result.data;

        setSessionData(session);
        setChannelId(session.channelId);

        console.log(
          `[Chat] Loaded session: ${session.title} (${session.messageCount} messages)`,
        );
      } catch (error) {
        console.error("[Chat] Failed to load session:", error);
        setIsLoadingHistory(false);
      }
    };

    loadSession();
  }, [sessionId, userEntity, agentId, router]);

  // --- Initialize Socket Connection ---
  useEffect(() => {
    if (!userEntity || !agentId || serverStatus !== "online") {
      return;
    }

    const initializeConnection = async () => {
      console.log("[Chat] Initializing connection...");
      setConnectionStatus("connecting");

      try {
        // Step 1: Add agent to centralized channel
        const centralChannelId = "00000000-0000-0000-0000-000000000000";

        console.log("[Chat] Adding agent to centralized channel...");
        setAgentStatus("checking");

        try {
          const addAgentResponse = await fetch(
            `/api/eliza/messaging/channels/${centralChannelId}/agents`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                agentId: agentId,
              }),
            },
          );

          if (addAgentResponse.ok) {
            console.log(
              "[Chat] ✅ Agent successfully added to centralized channel",
            );
            setAgentStatus("ready");
          } else {
            const errorText = await addAgentResponse.text();
            console.warn(
              "[Chat] ⚠️ Failed to add agent to channel:",
              errorText,
            );
            // Agent might already be in channel, treat as success
            setAgentStatus("ready");
          }
        } catch (error) {
          console.warn("[Chat] ⚠️ Error adding agent to channel:", error);
          // Continue anyway but mark as potential issue
          setAgentStatus("error");
        }

        // Step 2: Initialize socket connection
        console.log("[Chat] Initializing socket connection...");
        socketIOManager.initialize(userEntity, serverId);

        // Step 3: Check connection status
        const checkConnection = () => {
          if (socketIOManager.isSocketConnected()) {
            console.log("[Chat] ✅ Socket connected successfully");
            setConnectionStatus("connected");
          } else {
            setTimeout(checkConnection, 1000); // Check again in 1 second
          }
        };

        checkConnection();
      } catch (error) {
        console.error("[Chat] ❌ Failed to initialize connection:", error);
        setConnectionStatus("error");
      }
    };

    initializeConnection();
  }, [userEntity, agentId, serverStatus, socketIOManager]);

  // --- Set up Socket Event Listeners ---
  useEffect(() => {
    if (connectionStatus !== "connected" || !channelId || !sessionId) {
      return;
    }

    console.log("[Chat] Setting up socket event listeners...");

    // Message broadcast handler
    const handleMessageBroadcast = (data: MessageBroadcastData) => {
      console.log("[Chat] Received message broadcast:", data);

      // Skip our own messages to avoid duplicates
      if (data.senderId === userEntity) {
        console.log("[Chat] Skipping our own message broadcast");
        return;
      }

      // Check if this is an agent message by sender ID
      const isAgentMessage = data.senderId === agentId;

      const message: ChatMessage = {
        id: data.id || uuidv4(),
        name: data.senderName || (isAgentMessage ? "Agent" : "User"),
        text: data.text,
        senderId: data.senderId,
        roomId: data.roomId || data.channelId || channelId,
        createdAt: data.createdAt || Date.now(),
        source: data.source,
        thought: data.thought,
        actions: data.actions,
        isLoading: false,
      };

      console.log("[Chat] Adding message:", { isAgentMessage, message });
      setMessages((prev) => [...prev, message]);

      // If this was an agent response, stop the thinking indicator
      if (isAgentMessage) {
        setIsAgentThinking(false);
      }
    };

    // Control message handler
    const handleControlMessage = (data: ControlMessageData) => {
      console.log("[Chat] Received control message:", data);

      if (data.action === "disable_input") {
        setInputDisabled(true);
      } else if (data.action === "enable_input") {
        setInputDisabled(false);
      }
    };

    // Message complete handler
    const handleMessageComplete = () => {
      console.log("[Chat] Message complete");
      setIsAgentThinking(false);
      setInputDisabled(false);
    };

    // Attach event listeners
    socketIOManager.on("messageBroadcast", handleMessageBroadcast);
    socketIOManager.on("controlMessage", handleControlMessage);
    socketIOManager.on("messageComplete", handleMessageComplete);

    // Join the session channel
    socketIOManager.joinChannel(channelId, serverId);

    // Set the active session channel ID for message filtering
    socketIOManager.setActiveSessionChannelId(channelId);
    console.log("[Chat] Set active session channel ID:", channelId);

    // For DM sessions, we don't need to join the central channel
    // The agent should respond directly to the session channel

    // Cleanup function
    return () => {
      socketIOManager.off("messageBroadcast", handleMessageBroadcast);
      socketIOManager.off("controlMessage", handleControlMessage);
      socketIOManager.off("messageComplete", handleMessageComplete);
      socketIOManager.leaveChannel(channelId);
      socketIOManager.clearActiveSessionChannelId();
    };
  }, [
    connectionStatus,
    channelId,
    sessionId,
    agentId,
    userEntity,
    socketIOManager,
  ]);

  // --- Send Message Logic ---
  const sendMessage = useCallback(
    (messageText: string) => {
      if (
        !messageText.trim() ||
        !userEntity ||
        !channelId ||
        inputDisabled ||
        connectionStatus !== "connected"
      ) {
        console.warn("[Chat] Cannot send message:", {
          hasText: !!messageText.trim(),
          hasUserEntity: !!userEntity,
          hasChannelId: !!channelId,
          inputDisabled,
          connectionStatus,
        });
        return;
      }

      const userMessage: ChatMessage = {
        id: uuidv4(),
        name: USER_NAME,
        text: messageText,
        senderId: userEntity,
        roomId: channelId,
        createdAt: Date.now(),
        source: CHAT_SOURCE,
        isLoading: false,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsAgentThinking(true);
      setInputDisabled(true);

      // Send message directly to the session's channel
      console.log("[Chat] Sending message to session channel:", {
        messageText,
        channelId,
        source: CHAT_SOURCE,
      });

      // Send to the session's specific channel
      socketIOManager.sendChannelMessage(messageText, channelId, CHAT_SOURCE);

      // Add a timeout to re-enable input if no response comes (safety measure)
      setTimeout(() => {
        console.log("[Chat] Timeout reached, re-enabling input");
        setInputDisabled(false);
        setIsAgentThinking(false);
      }, 30000); // 30 seconds timeout
    },
    [userEntity, channelId, inputDisabled, connectionStatus, socketIOManager],
  );

  // --- Load Message History and Send Initial Query ---
  useEffect(() => {
    if (
      !channelId ||
      !agentId ||
      !userEntity ||
      connectionStatus !== "connected" ||
      initStartedRef.current
    ) {
      return;
    }

    initStartedRef.current = true;
    setIsLoadingHistory(true);

    console.log(`[Chat] Loading message history for channel: ${channelId}`);

    // Load from both channel messages and room memories, then merge and dedupe
    // so we don't miss messages when one API is capped or incomplete
    const MESSAGE_HISTORY_LIMIT = 500;
    const loadMessageHistory = async () => {
      try {
        const [channelMessages, roomMessages] = await Promise.all([
          getChannelMessages(channelId, MESSAGE_HISTORY_LIMIT),
          getRoomMemories(agentId, channelId, MESSAGE_HISTORY_LIMIT),
        ]);

        console.log(
          `[Chat] Loaded ${channelMessages.length} channel messages, ${roomMessages.length} room memories`,
        );

        // Merge and dedupe: prefer channel messages (same id or same createdAt+sender+text)
        const byId = new Map<string, ChatMessage>();
        const byKey = new Map<string, ChatMessage>();

        const key = (m: ChatMessage) =>
          `${m.createdAt}-${m.senderId}-${(m.text || "").slice(0, 80)}`;

        for (const m of channelMessages) {
          byId.set(m.id, m);
          byKey.set(key(m), m);
        }
        for (const m of roomMessages) {
          if (!byId.has(m.id) && !byKey.has(key(m))) {
            byId.set(m.id, m);
            byKey.set(key(m), m);
          }
        }

        const merged = Array.from(byId.values()).sort(
          (a, b) => a.createdAt - b.createdAt,
        );
        return merged;
      } catch (error) {
        console.error("[Chat] Error loading message history:", error);
        return [];
      }
    };

    loadMessageHistory()
      .then((loadedMessages) => {
        console.log(
          `[Chat] Loaded ${loadedMessages.length} messages from history`,
        );
        setMessages(loadedMessages);

        // If there's an initial message from session creation and no existing messages, send it
        if (
          sessionData?.metadata?.initialMessage &&
          loadedMessages.length === 0
        ) {
          console.log(
            `[Chat] New session detected - sending initial message: ${sessionData.metadata.initialMessage}`,
          );
          setTimeout(() => {
            sendMessage(sessionData.metadata.initialMessage);
          }, 500); // Small delay to ensure everything is ready
        }
      })
      .catch((error) => {
        console.error("[Chat] Failed to load message history:", error);

        // Even if history loading fails, send initial message if present
        if (sessionData?.metadata?.initialMessage) {
          console.log(
            `[Chat] Sending initial message despite history loading failure: ${sessionData.metadata.initialMessage}`,
          );
          setTimeout(() => {
            sendMessage(sessionData.metadata.initialMessage);
          }, 1000);
        }
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [
    channelId,
    agentId,
    userEntity,
    connectionStatus,
    sessionData,
    sendMessage,
  ]);

  // --- Handle Form Submit ---
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const messageText = input.trim();
      if (!messageText) return;

      if (!isWalletConnected) {
        setPendingMessage(messageText);
        setWalletModalOpen(true);
        return;
      }

      sendMessage(messageText);
      setInput("");
    },
    [input, isWalletConnected, sendMessage],
  );

  const handleWalletConnect = useCallback(() => {
    setWalletModalOpen(false);
    window.dispatchEvent(new CustomEvent(WALLET_CONNECTED_EVENT));
    if (pendingMessage) {
      sendMessage(pendingMessage);
      setPendingMessage(null);
      setInput("");
    }
  }, [pendingMessage, sendMessage]);

  // const handleConfirmTransaction = useCallback(
  //   async (intent: TransactionIntent, messageId: string) => {
  //     setTransactionError(null);
  //     setConfirmingMessageId(messageId);
  //     try {
  //       if (intent.type === "deposit") {
  //         await executeDepositFromChat(intent.amount);
  //       }
  //     } catch (err) {
  //       const msg = err instanceof Error ? err.message : "Transaction failed";
  //       setTransactionError(msg);
  //     } finally {
  //       setConfirmingMessageId(null);
  //     }
  //   },
  //   [],
  // );

  // --- Render Connection Status ---
  const renderConnectionStatus = () => {
    if (serverStatus === "checking") {
      return (
        <div className="flex gap-2 items-center text-sm text-gray-500">
          <LoadingSpinner />
          Checking server connection...
        </div>
      );
    }

    if (serverStatus === "offline") {
      return (
        <div className="p-3 mt-2 bg-red-50 rounded-lg border border-red-200 shadow-sm dark:bg-red-900/20 dark:border-red-800">
          <div>
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              Connection Failed
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-red-700 dark:text-red-300">
              Unable to establish connection to Orbit server at{" "}
              <code className="bg-red-100 dark:bg-red-800/50 px-1.5 py-0.5 rounded text-xs font-mono">
                {process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}
              </code>
            </p>
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Please ensure the server is running and accessible.
            </p>
          </div>
        </div>
      );
    }

    if (connectionStatus === "connecting") {
      const statusText =
        agentStatus === "checking"
          ? "Setting up agent participation..."
          : agentStatus === "ready"
            ? "Connecting to agent..."
            : "Connecting (agent setup failed)...";

      return (
        <div className="flex gap-2 items-center text-sm text-blue-600">
          <LoadingSpinner />
          {statusText}
        </div>
      );
    }

    if (connectionStatus === "error") {
      return (
        <div className="p-3 mt-2 bg-red-50 rounded-lg border border-red-200">
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-700">Connection Error</span>
          </div>
          <p className="mt-1 text-sm text-red-600">
            Failed to connect to the agent. Please try refreshing the page.
          </p>
        </div>
      );
    }

    if (connectionStatus === "connected") {
      return (
        <div className="flex gap-2 items-center text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Connected to Agent
        </div>
      );
    }

    return null;
  };

  // Check if environment is properly configured
  if (!agentId) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="p-6 text-center">
          <h2 className="mb-2 text-xl font-semibold">Configuration Error</h2>
          <p className="mb-4 text-gray-600">
            NEXT_PUBLIC_AGENT_ID is not configured in environment variables.
          </p>
          <p className="text-sm text-gray-500">
            Please check your .env file and ensure NEXT_PUBLIC_AGENT_ID is set.
          </p>
        </div>
      </div>
    );
  }

  // Restrict chat to connected wallet only
  if (!isWalletConnected) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] mt-16 w-full min-h-0">
        <div className="p-8 max-w-md text-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            Connect your wallet to chat
          </h2>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            You need to connect a wallet to use the chat with the Orbit agent.
          </p>
          <Button
            onClick={() => setWalletModalOpen(true)}
            color="blue"
            className="justify-center w-full"
          >
            Connect wallet
          </Button>
        </div>
        <ConnectWalletModal
          open={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          onConnect={handleWalletConnect}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden h-[calc(100vh-4rem)] mt-16 w-full min-h-0">
      <div className="flex overflow-hidden flex-1 w-full min-h-0">
        {/* Left Sidebar */}
        <aside className="flex overflow-hidden flex-col w-64 border-r shrink-0 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="p-3 border-b shrink-0 border-zinc-200 dark:border-zinc-800">
            <Button
              onClick={() => createNewSession()}
              color="blue"
              className="justify-center w-full"
            >
              New Chat
            </Button>
          </div>
          <div className="overflow-y-auto flex-1 p-3 min-h-0">
            {userEntity && (
              <ChatSessions
                userId={userEntity}
                currentSessionId={sessionId ?? undefined}
                showSwitcher={false}
                compact
              />
            )}
          </div>
        </aside>

        {/* Right: Messages + Input */}
        <div className="flex overflow-hidden flex-col flex-1 min-w-0 min-h-0 bg-white dark:bg-black">
          {/* Session header + Connection Status */}
          <div className="px-4 py-3 border-b shrink-0 border-zinc-200 dark:border-zinc-800">
            <h1 className="text-lg font-bold truncate">
              {sessionData?.title || "Chat with Orbit Agent"}
            </h1>
            {sessionData && (
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {sessionData.messageCount} messages •{" "}
                {formatTimeAgo(sessionData.lastActivity)}
              </div>
            )}
            <div className="mt-2">{renderConnectionStatus()}</div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Need testnet tokens?{" "}
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Get testnet USDC/EURC from Circle Faucet
              </a>
            </p>
          </div>

          {/* Messages - scrollable */}
          <div
            ref={messagesContainerRef}
            className="overflow-y-auto flex-1 px-4 min-h-0"
          >
            {connectionStatus === "connected" && isLoadingHistory ? (
              <div className="flex justify-center items-center h-32">
                <div className="flex gap-2 items-center">
                  <LoadingSpinner />
                  <span className="text-gray-600">
                    Loading conversation history...
                  </span>
                </div>
              </div>
            ) : (
              <>
                <ChatMessages
                  messages={messages}
                  citationsMap={{}}
                  followUpPromptsMap={{}}
                  onFollowUpClick={(prompt) => {
                    setInput(prompt);
                  }}
                  // onConfirmTransaction={handleConfirmTransaction}
                  // confirmingMessageId={confirmingMessageId}
                />
                {transactionError && (
                  <div className="px-4 py-2 mt-2 text-sm text-red-600 bg-red-50 rounded-lg dark:text-red-400 dark:bg-red-950/30">
                    {transactionError}
                  </div>
                )}
                {isAgentThinking && (
                  <div className="flex gap-2 items-center py-4 text-gray-600">
                    <LoadingSpinner />
                    <span>Agent is thinking...</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Textbox - fixed at bottom, not scrollable */}
          <div className="p-4 bg-white border-t shrink-0 border-zinc-200 dark:border-zinc-800 dark:bg-black">
            <TextareaWithActions
              input={input}
              onInputChange={(e) => setInput(e.target.value)}
              onSubmit={handleSubmit}
              isLoading={
                isAgentThinking ||
                inputDisabled ||
                connectionStatus !== "connected"
              }
              placeholder={
                connectionStatus === "connected"
                  ? "Type your message..."
                  : "Connecting..."
              }
            />
          </div>
        </div>

        <ConnectWalletModal
          open={walletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          onConnect={handleWalletConnect}
        />
      </div>

      {/* Debug Info (Only when NEXT_PUBLIC_DEBUG is enabled) */}
      {process.env.NEXT_PUBLIC_DEBUG === "true" && (
        <div className="p-2 mt-4 text-xs text-gray-600 bg-gray-100 rounded">
          <div>Agent ID: {agentId}</div>
          <div>Session ID: {sessionId}</div>
          <div>Channel ID: {channelId}</div>
          <div>User Entity: {userEntity}</div>
          <div>Connection: {connectionStatus}</div>
          <div>Server: {serverStatus}</div>
          <div>Agent Status: {agentStatus}</div>
          <div>Input Disabled: {inputDisabled ? "true" : "false"}</div>
          <div>Agent Thinking: {isAgentThinking ? "true" : "false"}</div>
        </div>
      )}
    </div>
  );
};

export default Chat;
