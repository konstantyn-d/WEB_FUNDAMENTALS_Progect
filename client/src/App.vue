<script setup>

import { RouterView } from 'vue-router'

</script>


<template>
  <div id="app">
    
    <RouterView />
  </div>
</template>


<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>