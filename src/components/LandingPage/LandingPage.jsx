import { Box, Grid, Typography } from "@mui/material";
import { Contact, Portrait } from "./index";

const styles = {
    root: {
    },
    leftGrid: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    rightGrid: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    greetingBox: {
        marginTop: "20%",
    },
    portraitBox: {
        width: "80%",
    },
}

export default function LandingPage() {
  return (
    <Grid container spacing={0} sx={styles.root}>
        <Grid item sx={styles.leftGrid} lg={6} md={6} sm={12} xs={12}>
            <Box sx={styles.greetingBox}>
                <Typography variant="h2" color="primary">Hi, I'm Thinh!</Typography>
                <Typography variant="h4" color="secondary">I'm a FULL-STACK DEVELOPER.</Typography>
            </Box>
            <Box sx={{marginTop:"4rem"}}>
                <Contact />
            </Box>
        </Grid>
        <Grid item sx={styles.rightGrid} lg={6} md={6} sm={12} xs={12}>
            <Box sx={styles.portraitBox}>
                <Portrait />
            </Box>
        </Grid>
    </Grid>
  )
}
