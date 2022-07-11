import { Grid, Link } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import EmailIcon from '@mui/icons-material/Email';

const styles = {
    root: {

    },
    icon: {
        marginLeft: "1rem",
        marginRight: "1rem",
    }
}

export default function Contact() {
    const email = "ducthinh481994@gmail.com";

    return (
        <Grid>
            <Link href="https://www.linkedin.com/in/ducthinhle/" target="_blank">
                <LinkedInIcon fontSize='large' sx={[styles.icon , {color:"#0A66C2"}]}/>
            </Link>
            <Link href="https://github.com/dustinle48/" target="_blank">
                <GitHubIcon fontSize='large' sx={[styles.icon, {color:"#000000"}]}/>
            </Link>
            <Link href={`mailto:${email}`} target="_blank">
                <EmailIcon fontSize='large' sx={[styles.icon, {color:"#f04235"}]}/>
            </Link>
        </Grid>
    )
}
