import { Routes, Route } from "react-router-dom";

import { Grid } from '@mui/material';
import { Map } from "./index";
import { LandingPage } from './LandingPage';
import { AboutPage } from './AboutPage';
import { EducationPage } from "./EducationPage";
import { ProjectPage } from "./ProjectPage";

const styles = {
    root: {
        height: "100vh",
    }
}

export default function Home() {
  return (
    <Grid container sx={styles.root}>
        <Map />
        <Routes>
            <Route path="/" element={ <LandingPage /> } />
            <Route path="/about" element={ <AboutPage /> } />
            <Route path="/education" element={ <EducationPage /> } />
            <Route path="/project" element={ <ProjectPage /> } />
        </Routes> 
    </Grid>
  )
}
