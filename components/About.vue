<template>
    <v-container>
        <v-row>
            <v-col class="col-lg-4 col-md-4 col-sm-4">
                <v-img src="/Portrait.jpg" alt="Thinh"></v-img>
            </v-col>
            <v-col class="text-left col-lg-8 col-md-8 col-sm-8">
                <div class="align-center">
                <v-row no-gutters>
                    <v-col>
                        <h1>Le Duc Thinh</h1>
                        <p class="text--disabled">Junior Full-stack web developer</p>
                    </v-col>
                </v-row>

                <v-row no-gutters>
                    <v-col>
                        <v-icon>mdi-cake-variant</v-icon>
                        August 4th 1994
                    </v-col>
                </v-row>

                <v-row no-gutters>
                    <v-col>
                        <v-icon>mdi-map-marker</v-icon>
                        Toronto Canada
                    </v-col>
                </v-row>

                <v-row no-gutters>
                    <v-col>
                        <v-icon>mdi-email</v-icon>
                        ducthinh481994@gmail.com
                    </v-col>
                </v-row>

                <v-row no-gutters>
                    <v-col>
                        <v-icon>mdi-card-account-details-outline</v-icon>
                        <v-chip class="mx-1" v-for="item in p" :key="item.index">{{ item }}</v-chip>
                    </v-col>
                </v-row>

                <v-row no-gutters>
                    <v-col>
                        <v-icon>mdi-soccer</v-icon>
                        <v-chip class="mx-1" v-for="item in h" :key="item.index">{{ item }}</v-chip>
                    </v-col>
                </v-row>
                </div>
            </v-col>
        </v-row>

        <v-row>
            <v-col>
                <div class="content">
                    <nuxt-content :document="about" />
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    props: ['about'],
    data() {
        return {
            p: ['Extrovert','Optimistic','Talkative','Friendly'],
            h: ['Soccer','Traveling','Games','Singing'],
        }
    }
}
</script>

<style scoped>
.container {
    background-color: yellow;
}
img {
    width: 100%;
}
.content {
    text-align: justify;
}
</style>