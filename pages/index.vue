<template>
  <v-container fluid class="text-center">
    <v-row id="home" class="component home" justify="center" align="center">
      <v-col class="col-lg-2 hidden-md-and-down"></v-col>
      <v-col>
        <h1 class="text-white">Hi, I'm Thinh!</h1>
        <h1>I'm a full-stack web developer.</h1>
      </v-col>
      <v-col class="col-lg-2 hidden-md-and-down"></v-col>
    </v-row>

    <v-row id="about" class="component about">
      <v-col class="col-lg-3 hidden-md-and-down"></v-col>
      <v-col class="col-lg-6 col-md-12">
        <About :about="about" />
      </v-col>
      <v-col class="col-lg-3 hidden-md-and-down"></v-col>
    </v-row>

    <v-row id="resume" class="component resume">
      <v-col class="col-lg-2 hidden-md-and-down"></v-col>
      <v-col>
        <Resume />
      </v-col>
      <v-col class="col-lg-2 hidden-md-and-down"></v-col>
    </v-row>

    <v-row id="project" class="component project">
      <v-col class="col-lg-2 hidden-md-and-down"></v-col>
      <v-col>
        <Project />
      </v-col>
      <v-col class="col-lg-2 hidden-md-and-down"></v-col>
    </v-row>

    <v-row id="contact" class="component contact">
      <v-col class="col-lg-2 hidden-md-and-down"></v-col>
      <v-col>
        <Contact />
      </v-col>
      <v-col class="col-lg-2 hidden-md-and-down"></v-col>
    </v-row>
  </v-container>
</template>

<script>
  export default {
    async asyncData({ $content }) {
      const about = await $content("about").fetch()
      
      return { about }
    },
  }
</script>

<style scoped>
.component {
  min-height: 100vh;
}
.home {
  background-image: url("/thinh.jpg");
  background-size: cover;
}
.home h1 {
  -webkit-text-stroke: 0.1rem black;
  color: white;
  font-size: 4rem;
  font-weight: 800;
}
.about {
  background-color: red;
  align-content: center;
}
.resume {
  background-color: blue;
  align-content: center;
}
.project {
  background-color: orange;
  align-content: center;
}
.contact {
  background-color: cadetblue;
  align-content: center;
}
</style>
