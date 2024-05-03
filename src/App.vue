<script setup lang="ts">
import { ref, type Ref } from "vue";
import { RouterView } from "vue-router";
import { bzr } from "./bzr";
import type { User } from "@bzr/bazaar";

const loggedIn = ref(false);

const user: Ref<User> = ref({
  id: "",
  handle: "",
  name: "",
  email: "",
});

async function onLogin() {
  if (!bzr.isLoggedIn()) return;
  loggedIn.value = true;
  user.value = await bzr.social.getUser();
}
onLogin();

bzr.onLogin(onLogin);

function signOut(): void {
  bzr.logOut();
}

function login(): void {
  bzr.login();
}
</script>

<template>
  <div class="app">
    <div class="header">
      <div class="header-brand">
        <router-link :to="{ name: 'home' }">Rethink Chat</router-link>
      </div>
      <div>
        <ul class="header-menu">
          <template v-if="loggedIn">
            <li class="user-info">
              {{ user.email }}<br />
              User ID: {{ user.id }}
            </li>
            <li><button class="button" @click="signOut">Sign out</button></li>
          </template>
          <template v-else>
            <li>
              <button class="button button-primary u-full-width" @click="login">Log in</button>
            </li>
            <li>
              <button class="button u-full-width" @click="login">Sign up</button>
            </li>
          </template>
        </ul>
      </div>
    </div>
    <router-view v-if="loggedIn" :user="user" />
    <p v-else>Log in or Sign up to get started.</p>
  </div>
</template>

<style></style>
