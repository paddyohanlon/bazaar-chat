<script setup lang="ts">
import { ref, type Ref } from "vue";
import { useRouter } from "vue-router";
import type { User } from "@bzr/bazaar";
import { bzr, getChatsCollectionName, ROOMS_COLLECTION_NAME, roomsCollection } from "@/bzr";
import { useUsers } from "@/composables/users";
import type { Room, GuestRoom } from "@/types";

const props = defineProps<{ user: User }>();

const router = useRouter();

const { users, fetchAndCacheUser } = useUsers();

const roomName = ref("");
const rooms: Ref<Room[]> = ref([]);
const guestRooms: Ref<GuestRoom[]> = ref([]);

(async () => {
  if (!bzr.isLoggedIn()) return;
  const fetchedRooms = await roomsCollection.getAll();
  rooms.value = fetchedRooms;

  const fetchedGrantedPermissions = await bzr.permissions.granted.list({ collectionName: ROOMS_COLLECTION_NAME });

  for (const p of fetchedGrantedPermissions) {
    const roomId = p.permission.filter?.id as string;
    if (!roomId) continue;
    const room = await bzr.collection<Room>(ROOMS_COLLECTION_NAME, { userId: p.ownerId }).getOne(roomId);
    guestRooms.value.push({
      ...room,
      ownerId: p.ownerId,
    });
    fetchAndCacheUser(p.ownerId);
  }
})();

async function createAndGoToRoom() {
  try {
    const roomId = await roomsCollection.insertOne({ name: roomName.value });
    await bzr.collections.create(getChatsCollectionName(roomId));
    router.push({ name: "room", params: { userId: props.user.id, roomId } });
  } catch (e) {
    console.error("tablesCreate error:", e);
  }
}
</script>

<template>
  <div class="main">
    <h1>Dashboard</h1>
    <div class="dashboard-grid">
      <div class="card">
        <form v-on:submit.prevent="createAndGoToRoom">
          <h2>Create Room</h2>
          <div>
            <label for="room-name">Room name</label>
            <input id="room-name" class="u-full-width" v-model="roomName" type="text" required />
          </div>
          <button type="submit" class="button button-primary">Create and Join Room</button>
        </form>
      </div>
      <div v-if="rooms.length > 0" class="card">
        <h2>My Rooms</h2>
        <ul class="rooms-list">
          <li v-for="(room, index) of rooms" :key="index">
            <router-link :to="{ name: 'room', params: { userId: user.id, roomId: room.id } }">{{
              room.name
            }}</router-link>
          </li>
        </ul>
      </div>
      <div v-if="guestRooms.length > 0" class="card">
        <h2>My Guest Rooms</h2>
        <ul class="rooms-list">
          <li v-for="room of guestRooms" :key="room.id">
            <router-link :to="{ name: 'room', params: { userId: room.ownerId, roomId: room.id } }">
              {{ room.name }} (@{{ users.get(room.ownerId)?.handle }})</router-link
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
