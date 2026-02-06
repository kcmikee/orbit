const SEED_KEY = "elizaHowSeed";
const USER_ENTITY_KEY = "norbitEntity";
const LEGACY_USER_ENTITY_KEYS = ["elizaHowUserEntity"];

/**
 * Retrieves the persistent random seed from Local Storage.
 * If no seed exists, generates a new one using crypto.randomUUID() and saves it.
 * Handles potential exceptions during Local Storage access (e.g., in private browsing).
 * @returns {string | null} The seed string or null if Local Storage is unavailable.
 */
export function getOrGenerateSeed(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    console.warn("Local Storage not available. Cannot get or generate seed.");
    return null;
  }

  try {
    let seed = localStorage.getItem(SEED_KEY);
    if (!seed) {
      console.log("Generating new persistence seed.");
      // Use crypto.randomUUID() for a strong random ID
      seed = crypto.randomUUID();
      localStorage.setItem(SEED_KEY, seed);
    }
    return seed;
  } catch (error) {
    console.error("Error accessing Local Storage for seed:", error);
    return null;
  }
}

/**
 * Retrieves a stable user entity id from Local Storage.
 * Also migrates from legacy keys (e.g. "elizaHowUserEntity") to "norbitEntity".
 */
export function getOrGenerateUserEntity(): string | null {
  if (typeof window === "undefined" || !window.localStorage) {
    console.warn(
      "Local Storage not available. Cannot get or generate user entity id.",
    );
    return null;
  }

  try {
    const existing = localStorage.getItem(USER_ENTITY_KEY);
    if (existing) return existing;

    for (const legacyKey of LEGACY_USER_ENTITY_KEYS) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue) {
        localStorage.setItem(USER_ENTITY_KEY, legacyValue);
        return legacyValue;
      }
    }

    const newId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    localStorage.setItem(USER_ENTITY_KEY, newId);
    return newId;
  } catch (error) {
    console.error("Error accessing Local Storage for user entity id:", error);
    return null;
  }
}
