<script setup lang="ts">
import type { Chat } from "@/types";
import type { User } from "@bzr/bazaar";
import { computed } from "vue";

const props = defineProps<{ chat: Chat; users: Map<string, User> }>();

const user = computed(() => {
  return props.users.get(props.chat.userId);
});
</script>

<template>
  <li>
    <span class="timestamp">
      {{ new Date(chat.ts).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) }}
      <span class="chat-user-id">Handle: {{ user?.handle }}</span>
    </span>
    <span class="msg">
      {{ chat.message }}
    </span>
  </li>
</template>

<style scoped></style>
