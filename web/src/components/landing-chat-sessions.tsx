"use client";

import { useEffect, useState } from "react";
import { ChatSessions } from "@/components/chat-sessions";
import { getOrGenerateUserEntity } from "@/lib/local-storage";

export const LandingChatSessions = () => {
  const [userEntity, setUserEntity] = useState<string | null>(null);

  // Initialize user entity on client side only to avoid hydration mismatch
  useEffect(() => {
    const entity = getOrGenerateUserEntity();
    if (entity) setUserEntity(entity);
  }, []);

  return (
    <div className="w-full">
      <ChatSessions userId={userEntity} />
    </div>
  );
};

export default LandingChatSessions;
