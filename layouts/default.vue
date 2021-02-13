<template>
  <v-app class="theme--light">
    <div class="nav-btn">
      <v-list class="rounded">
        <v-list-item>
          <v-btn to="#home"><v-icon>mdi-home</v-icon></v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn to="#about"><v-icon>mdi-account</v-icon></v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn to="#resume"><v-icon>mdi-file-account</v-icon></v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn to="#project"><v-icon>mdi-briefcase</v-icon></v-btn>
        </v-list-item>
        <v-list-item>
          <v-btn to="#contact"><v-icon>mdi-card-account-phone</v-icon></v-btn>
        </v-list-item>
      </v-list>
    </div>
    
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
.nav-btn {
  position: fixed;
  top: 20%;
  left: 2rem;
  z-index: 24;
}
.v-list {
  background-color: none;
}
</style>
