<template>
  <v-app>
    <div class="nav-div">
      <v-menu>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            rounded
            class="hidden-lg-and-up"
            v-bind="attrs"
            v-on="on"
          >
            <v-icon>mdi-post</v-icon>
          </v-btn>
        </template>

        <v-sheet>
          <Navlist />
        </v-sheet>
      </v-menu>
    </div>


    <Navlist class="nav-list hidden-md-and-down" />
    
    <Nuxt />

  </v-app>
</template>

<script>
export default {
  data () {
    return {
      clipped: false,
      drawer: false,
      fixed: false,
      items: [
        {
          icon: 'mdi-apps',
          title: 'Welcome',
          to: '/'
        },
        {
          icon: 'mdi-chart-bubble',
          title: 'Inspire',
          to: '/inspire'
        }
      ],
      miniVariant: false,
      right: true,
      rightDrawer: false,
      title: 'Vuetify.js'
    }
  }
}
</script>

<style>
* {
 font-family: 'Montserrat', sans-serif;
}
html {
  scroll-behavior: smooth
}
.nav-div {
  z-index: 24;
  position: fixed;
  top: 1rem;
  left: 1rem;
}
.nav-list {
  position: fixed;
  top: 30%;
  left: 2rem;
}
</style>
