import { bzr } from "@/bzr";
import type { User } from "@bzr/bazaar";
import { ref, type Ref } from "vue";

export function useUsers() {
  const users: Ref<Map<string, User>> = ref(new Map());

  async function fetchAndCacheUser(userId: string): Promise<void> {
    if (users.value.has(userId)) return;
    const user = await bzr.social.getUser({ userId });
    users.value.set(userId, user);
  }

  return { users, fetchAndCacheUser };
}
