<script setup>
import Grid from "./components/Grid.vue";
import Auth from "./components/AuthScreen/Auth.vue";
import Tree from "./components/App/Left/Tree.vue";
import GraphTree from "./components/App/Center/GraphTree.vue";
</script>

<template>
  <Grid/>
  <!-- <Auth/> -->
  <GraphTree/>
  <Tree/>
</template>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
