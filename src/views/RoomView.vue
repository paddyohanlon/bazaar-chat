<script setup lang="ts">
import { computed, onUnmounted, ref, type Ref } from "vue";
import type { Chat, Room } from "@/types";
import {
  OrderByType,
  PermissionType,
  SendNotification,
  type NewPermission,
  type Permission,
  type SharingNotification,
  type User,
} from "@bzr/bazaar";
import { useRoute, useRouter } from "vue-router";
import ChatItem from "@/components/ChatItem.vue";
import { bzr, getChatsCollectionName, ROOMS_COLLECTION_NAME } from "@/bzr";
import type { CollectionOptions, SubscribeListener } from "node_modules/@bzr/bazaar/dist/types";
import { useUsers } from "@/composables/users";

const route = useRoute();
const router = useRouter();

const { users, fetchAndCacheUser } = useUsers();

const props = defineProps<{ user: User }>();

const roomName = ref("");

const chats: Ref<Chat[]> = ref([]);
const roomUserId = ref(route.params.userId as string);
const roomId = ref(route.params.roomId as string);
const hasAccess = ref(true);
const message = ref("");
const selectedUser: Ref<User | null> = ref(null);
const permissions: Ref<Permission[]> = ref([]);
const unsubscribe = ref(() => {});

const collectionOptions: CollectionOptions = { userId: roomUserId.value };

const roomsCollection = bzr.collection<Room>(ROOMS_COLLECTION_NAME, collectionOptions);

const isOwner = computed(() => props.user.id === route.params.userId);

(async () => {
  try {
    const fetchedRoom = await roomsCollection.getOne(roomId.value);
    roomName.value = fetchedRoom.name;

    const fetchedChats = await bzr
      .collection<Chat>(getChatsCollectionName(roomId.value), collectionOptions)
      .getAll({}, { orderBy: { ts: OrderByType.DESC } });
    chats.value = fetchedChats;

    for (const chat of fetchedChats) {
      fetchAndCacheUser(chat.userId);
    }

    const chatsListener: SubscribeListener<Chat> = ({ newDoc }) => {
      if (newDoc) {
        chats.value.unshift(newDoc);
      }
    };
    unsubscribe.value = await bzr
      .collection<Chat>(getChatsCollectionName(roomId.value), collectionOptions)
      .subscribeAll({}, chatsListener);
  } catch (e) {
    hasAccess.value = false;
    console.log("e", e);
  }

  const fetchedPermissions = await bzr.permissions.list({ collectionName: ROOMS_COLLECTION_NAME });

  const permissionsForRoom = fetchedPermissions.filter((p) => p.filter?.id === roomId.value);

  for (const permission of permissionsForRoom) {
    fetchAndCacheUser(permission.userId);
  }

  permissions.value = permissionsForRoom;
})();

async function deleteRoom(): Promise<void> {
  bzr.collections.drop(getChatsCollectionName(roomId.value));
  await roomsCollection.deleteOne(roomId.value);
  router.push({ name: "home" });
}

async function sendMessage(): Promise<void> {
  const userId = props.user.id;
  const newChat = { message: message.value, ts: Date.now(), userId };
  bzr.collection(getChatsCollectionName(roomId.value), collectionOptions).insertOne(newChat);
  fetchAndCacheUser(userId);
  message.value = "";
}

function openSocialModal() {
  bzr.social.openModal(async (userId) => {
    const fetchedUser = await bzr.social.getUser({ userId });
    selectedUser.value = fetchedUser;
  });
}

function inviteUser() {
  const selectedUserId = selectedUser.value?.id;

  if (!selectedUserId) return;

  const types = [PermissionType.READ, PermissionType.INSERT];

  const newPermissionRoomsDoc: NewPermission = {
    userId: selectedUserId,
    collectionName: ROOMS_COLLECTION_NAME,
    types,
    filter: {
      id: roomId.value,
    },
  };

  const newPermissionChatsCollection: NewPermission = {
    userId: selectedUserId,
    collectionName: getChatsCollectionName(roomId.value),
    types,
  };

  const notification: SharingNotification = {
    createNotification: true,
    // @ts-ignore
    sendMessage: SendNotification.ALWAYS,
    message: "You were invited to a chat room",
  };

  bzr.permissions.create(newPermissionRoomsDoc, notification);
  bzr.permissions.create(newPermissionChatsCollection);
}

onUnmounted(() => {
  unsubscribe.value();
});
</script>

<template>
  <div class="chat-room">
    <div class="chat-ui">
      <ul id="chat-log">
        <ChatItem v-for="chat in chats" :key="chat.id" :chat="chat" :users="users"></ChatItem>
      </ul>
      <form class="message-form" v-on:submit.prevent="sendMessage">
        <input type="text" v-model="message" autocomplete="off" />
        <button>Send</button>
      </form>
    </div>
    <div class="chat-room-info">
      <div class="space-between">
        <h3>{{ roomName }}</h3>
        <button v-if="isOwner" class="button-small" type="button" @click="deleteRoom">Delete room</button>
      </div>
      <template v-if="isOwner">
        <button class="button-small" @click="openSocialModal">Open Social Modal</button>
        <div v-if="selectedUser">
          <p>
            Invite <strong>{{ selectedUser.handle }}</strong> to chat.
          </p>
          <button @click="inviteUser" class="button">Invite User</button>
        </div>
        <ul>
          <li v-for="permission of permissions" :key="permission.id">
            {{ users.get(permission.userId)?.handle }}
          </li>
        </ul>
      </template>
      <template v-else>
        <p>You are a guest in this room.</p>
        <p v-if="!hasAccess">You do not have access to this room.</p>
      </template>
    </div>
  </div>
</template>

<style scoped></style>
