<template>
    <v-container>
        <v-row>
            <v-col><h1>PROJECT</h1></v-col>
        </v-row>
        <v-row>
            <!-- Bookstore -->
            <v-col cols="4">
                <v-row>
                    <v-col>
                        <img src="/bookstore.jpg" alt="bookstore">
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <p>An ecommerce bookstore webapp for me and my sister to sell English books.</p>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-chip class="ma-1" v-for="item in book" :key="item.index">{{ item }}</v-chip>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-btn href="https://flamboyant-lamarr-0f64a4.netlify.app/" target="_blank">Check it</v-btn>
                    </v-col>
                </v-row>
            </v-col>

            <!-- Xóm du học blog -->
            <v-col cols="4">
                <v-row>
                    <v-col>
                        <img src="/blog.png" alt="blog">
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <p>A social blog for students to share their good memories and experience.</p>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-chip class="ma-1" v-for="item in book" :key="item.index">{{ item }}</v-chip>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-btn href="https://flamboyant-lamarr-0f64a4.netlify.app/" target="_blank">Check it</v-btn>
                    </v-col>
                </v-row>
            </v-col>

            <!-- Chuẩn bị làm -->
            <v-col cols="4">
                <v-row>
                    <v-col>
                        <img src="/ecommerce-canada.jpg" alt="blog">
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <p>Future project: Me and my friends are planning to have a small startup and I will make another ecommerce webapp haha!</p>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col>
                        <v-chip class="ma-1" v-for="item in future" :key="item.index">{{ item }}</v-chip>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>

        <v-row>
            <v-col>
                <p>I mainly work on Web Development but I also have some other side projects like:</p>
                <v-chip class="ma-1" v-for="item in project" :key="item.index">{{ item }}</v-chip>
            </v-col>
        </v-row>

        <v-row>
            <v-col>
                Please be my guest on my  <v-btn href="https://github.com/dustinle48" target="_blank">Github</v-btn>  to check these projects !
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {
    data() {
        return {
            book: ['VueJS','NuxtJS','Strapi','MongoDB'],
            future: ['VueJS','NuxtJS','ExpressJS','MongoDB'],
            project: ['Discord Bot','Virtual Personal Assistant',]
        }
    }
}
</script>

<style scoped>
img {
    width: 100%;
    height: 12rem;
    object-fit: cover;
}
.container {
    background-color: orange;
}
</style>