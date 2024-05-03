import { BazaarApp, type BazaarOptions } from "@bzr/bazaar";
import type { Room } from "./types";

const options: BazaarOptions = {
  appId: import.meta.env.VITE_BAZAAR_APP_ID || "test",
  loginRedirectUri: import.meta.env.VITE_BAZAAR_REDIRECT_URL || window.location.origin,
  onApiConnectError: async (bzr, message) => {
    if (message.includes("invalid_token")) {
      bzr.logOut();
    }
  },
};

export const bzr = new BazaarApp(options);

export const ROOMS_COLLECTION_NAME = "rooms";

export const roomsCollection = bzr.collection<Room>(ROOMS_COLLECTION_NAME);

export function getChatsCollectionName(roomId: string): string {
  return `chats_${roomId}`;
}
