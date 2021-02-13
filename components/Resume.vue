<template>
    <v-container>
        <v-row>
            <v-col>Education</v-col>
            <v-col>Experience</v-col>
        </v-row>

        <v-row>
            <!-- Edu -->
            <v-col>
                <v-timeline
                    align-top
                    dense
                    reverse
                >
                    <v-timeline-item icon="mdi-laptop">
                        <v-row>
                            <v-col>
                                T127 - COMPUTER PROGRAMMER ANALYST
                                <p class="text--secondary">George Browns College</p>
                            </v-col>
                            <v-col>
                                2018 - Present
                            </v-col>
                        </v-row>
                    </v-timeline-item>

                    <v-timeline-item icon="mdi-cash">
                        <v-row>
                            <v-col>
                                404 - FINANCE AND BANKING
                                <p class="text--secondary">University of Economics and Law - Vietnam National University Ho Chi Minh City</p>
                            </v-col>
                            <v-col>
                                2012 - 2016
                            </v-col>
                        </v-row>
                    </v-timeline-item>
                </v-timeline>
            </v-col>

            <!-- Kinh nghiệm -->
            <v-col>
                <v-timeline
                    align-top
                    dense
                >
                    <v-timeline-item icon="mdi-coffee">
                        <v-row>
                            <v-col>
                                2020 - Present
                            </v-col>
                            <v-col>
                                FREE LANCER
                            </v-col>
                        </v-row>
                    </v-timeline-item>

                    <v-timeline-item icon="mdi-pencil">
                        <v-row>
                            <v-col>
                                2018 - 2020
                            </v-col>
                            <v-col>
                                HEAD OF MARKETING, DESIGNER
                                <p class="text--secondary">Canada Way - Overseas Students Consulting Company</p>
                            </v-col>
                        </v-row>
                    </v-timeline-item>

                    <v-timeline-item icon="mdi-point-of-sale">
                        <v-row>
                            <v-col>
                                2017 - 2018
                            </v-col>
                            <v-col>
                                SALEMAN
                                <p class="text--secondary">Sao Mai - Printing Company </p>
                            </v-col>
                        </v-row>
                    </v-timeline-item>

                    <v-timeline-item icon="mdi-account-tie">
                        <v-row>
                            <v-col>
                                2014 - 2017
                            </v-col>
                            <v-col>
                                BROKER
                                <p class="text--secondary">HSC - HCMC Securities Corporation </p>
                            </v-col>
                        </v-row>
                    </v-timeline-item>
                </v-timeline>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
export default {

}
</script>

<style scoped>
.container {
    background-color: white;
}
</style>