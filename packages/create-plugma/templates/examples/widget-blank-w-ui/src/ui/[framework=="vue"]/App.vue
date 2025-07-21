<script setup lang="ts">
import vueLogo from "./assets/vue.svg";
import Icon from "./components/Icon.vue";
import Button from "./components/Button.vue";
</script>

<template>
  <div class="container">
    <div class="banner">
      <Icon svg="plugma" :size="38" />
      <Icon svg="plus" :size="24" />
      <img :src="vueLogo" width="44" height="44" alt="Vue logo" />
    </div>
    <div class="docs-button">
      <Button
        href="https://plugma.dev/docs"
        target="_blank"
      >
        Read the docs
      </Button>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  flex-direction: column;
}

.banner {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 16px;
}

.docs-button {
  position: absolute;
  right: 16px;
  bottom: 16px;
}
</style>
