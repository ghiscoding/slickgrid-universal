<script setup lang="ts">
import VueLogo from './assets/vue.svg?url';
import { routes } from './router';
</script>

<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
    <a class="navbar-brand ms-2" href="https://github.com/ghiscoding/slickgrid-vue">
      <i class="mdi mdi-github"></i>
      <span class="ms-2">Slickgrid-Vue</span>
    </a>
    <img :src="VueLogo" height="28" />
    <button
      class="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-target="#navbarContent"
      aria-controls="navbarContent"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="github-button-container">
      <a href="https://github.com/ghiscoding/slickgrid-vue">
        <img src="https://img.shields.io/github/stars/ghiscoding/slickgrid-vue?style=social" />
      </a>
    </div>

    <div id="navbarContent" class="navbar-collapse collapse justify-content-end me-2">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item">
          <a class="nav-link" href="/#/home">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="https://ghiscoding.gitbook.io/slickgrid-vue/" target="_blank"> Documentation </a>
        </li>
      </ul>
    </div>
  </nav>

  <div class="panel-wm">
    <section id="panel-left" class="panel-wm-left">
      <ul class="well nav nav-pills nav-stacked">
        <li class="nav-item fw-bold nav-docs">
          <a class="nav-link" href="https://ghiscoding.gitbook.io/slickgrid-vue/" target="_blank"> 📘 Documentation </a>
        </li>
        <li v-for="(route, index) in routes" :key="index" class="nav-item">
          <RouterLink v-if="route.name !== 'root' && route.name !== 'home'" class="nav-link" active-class="active" :to="route.path">{{
            route.name
          }}</RouterLink>
        </li>
      </ul>
    </section>
    <section class="panel-wm-content">
      <div id="demo-container">
        <RouterView />
      </div>
    </section>
  </div>
</template>
