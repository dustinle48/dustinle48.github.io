import { Box, Button, Divider, Grid, Link, Typography } from '@mui/material';

import { Tech, Image } from "./index";

const styles = {
    root: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
    },
    box: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "240px",
        height: "150px",
        margin: "10px 0",
    },
    descriptionBox: {
        width: "80%",
    }
}
export default function Project(props) {
    const { project } = props;

    return (
        <Grid sx={styles.root}>
            <Typography variant='h5' color="secondary">{project.name}</Typography>
            <Box sx={styles.box}>
                <Image image={project.image} height="100%"/>
            </Box>
            <Typography>{project.type}</Typography>
            <Box sx={styles.descriptionBox}>
                <Typography variant="subtitle2">{project.description}</Typography>
            </Box>
            <Tech techs={project.technologies} />
            <Link href={project.link} target="_blank">
                <Button>View</Button>
            </Link>
        </Grid>
    )
}
