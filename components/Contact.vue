<template>
    <v-container>
        <v-row class="mb-12 upper">
            <v-col>
                <v-row>
                    <v-col>
                        <h1>CONTACT</h1>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col></v-col>
                    <v-col class="my-lg-4 my-md-3 my-0 col-lg-8 col-md-12 col-sm-12 col-12">
                        <v-row>
                            <v-col class="col-lg-6 col-md-6 col-sm-6 col-12">
                                <v-icon color="white">mdi-email</v-icon> ducthinh481994@gmail.com
                            </v-col>
                            <v-col class="col-lg-6 col-md-6 col-sm-6 col-12">
                                <v-icon color="white">mdi-phone</v-icon> (+1) 647 819 4868
                            </v-col>
                            <v-col class="col-lg-4 col-md-4 col-sm-6 col-6">
                                <v-icon color="white">mdi-github</v-icon> dustinle48
                            </v-col>
                            <v-col class="col-lg-4 col-md-4 col-sm-6 col-6">
                                <v-icon color="white">mdi-discord</v-icon> Dustin #7061
                            </v-col>
                            <v-col class="col-lg-4 col-md-4 col-sm-6 col-6">
                                <v-icon color="white">mdi-facebook</v-icon> leducthinh
                            </v-col>
                        </v-row>
                    </v-col>
                    <v-col></v-col>
                </v-row>

                <v-row>
                    <v-col></v-col>
                    <v-col class="mail pa-lg-6 pa-md-6 pa-sm-6 pa-2 rounded-tl-xl rounded-br-xl elevation-10 col-lg-8 col-md-12 col-sm-12 col-12">
                        
                        <div class="text-center" v-if="status=='loading'">
                            <v-progress-circular
                                indeterminate
                                color="primary"
                            ></v-progress-circular>
                        </div>

                        <validation-observer
                            ref="observer"
                            v-slot="{ invalid }"
                        >
                        <v-form @submit.prevent="sendMail" v-if="status=='normal'">
                            <v-row>
                                <v-col>
                                    <validation-provider
                                        v-slot="{ errors }"
                                        name="Name"
                                        rules="required"
                                    >
                                        <v-text-field
                                            v-model="name"
                                            label="Your name"
                                            :error-messages="errors"
                                            required
                                            clearable
                                        >
                                        </v-text-field>
                                    </validation-provider>
                                </v-col>
                                <v-col>
                                    <validation-provider
                                        v-slot="{ errors }"
                                        name="Email"
                                        rules="required|email"
                                    >
                                        <v-text-field
                                            v-model="email"
                                            label="Your email"
                                            :error-messages="errors"
                                            required
                                            clearable
                                        >
                                        </v-text-field>
                                    </validation-provider>
                                </v-col>
                            </v-row>

                            <v-row>
                                <v-col>
                                    <validation-provider
                                        v-slot="{ errors }"
                                        name="Subject"
                                        rules="required"
                                    >
                                        <v-text-field
                                            v-model="subject"
                                            label="Subject"
                                            :error-messages="errors"
                                            required
                                            clearable
                                        >
                                        </v-text-field>
                                    </validation-provider>
                                </v-col>
                            </v-row>
                        
                            <v-row>
                                <v-col>
                                    <validation-provider
                                        v-slot="{ errors }"
                                        name="Content"
                                        rules="required"
                                    >
                                        <v-textarea
                                            label="Write me some love!"
                                            outlined
                                            v-model="content"
                                            :error-messages="errors"
                                        >
                                        </v-textarea>
                                    </validation-provider>
                                </v-col>
                            </v-row>

                            <v-row>
                                <v-col>
                                    <v-btn type="submit" :disabled="invalid" color="blue">Send</v-btn>
                                    <v-btn @click="deleteMail" color="red">Delete</v-btn>
                                </v-col>
                            </v-row>
                        </v-form>
                        </validation-observer>

                        <div v-if="status=='success'">
                            <h2>Thanks for reaching out to me!</h2>
                            <h2>I will reply as soon as possible.</h2>
                        </div>
                    </v-col>
                    <v-col></v-col>
                </v-row>
            </v-col>
        </v-row>

        <v-footer class="text-center" absolute>
            <h3 class="footer-text">© 2021 - LE DUC THINH</h3>
        </v-footer>
    </v-container>
</template>

<script>
import swal from 'sweetalert'
import { required, email } from 'vee-validate/dist/rules'
import { extend, ValidationObserver, ValidationProvider, setInteractionMode } from 'vee-validate'

setInteractionMode('eager')

extend('required', {
    ...required,
    message: 'Invalid {_field_}!',
})

extend('email', {
    ...email,
    message: 'Invalid Email!',
})

export default {
    components: {
        ValidationProvider,
        ValidationObserver,
    },
    data() {
        return {
            name: '',
            email: '',
            subject: '',
            content: '',
            status: 'normal',
        }
    },
    methods: {
        isRequired(value) {
            return value ? true : 'This field is required';
        },
        async sendMail() {
            this.status='loading'
            try {
                await this.$axios.$post('/portfolios/sendmail', {
                    name: this.name,
                    email: this.email,
                    subject: this.subject,
                    content: this.content
                })
                .then(response => {
                    swal({
                        title: "Success!",
                        text: "Your mail has been sent!",
                        icon: "success",
                    });
                    console.log(response)
                })
                this.status='success'
            } catch(e) {
                swal({
                    title: "Error!",
                    text: "An error has occurred!",
                    icon: "error",
                });
                this.status='normal'
            }
        },
        deleteMail() {
            this.name = ''
            this.email = ''
            this.subject = ''
            this.content = ''
        }
    }
}
</script>

<style>
.upper {
    color: white;
}
.container {
    height: 100%;
}
.mail {
    color: black;
    width: 100%;
    background: white;
}
.buffer {
    height: 3rem;
}
.v-footer {
    min-height: 5rem;
    background-color: red;
}
.footer-text {
    margin: auto;
    color: cadetblue;
}
</style>