import { Box, Grid, Typography } from '@mui/material';

import { Project } from "./index";

const karaoke = new URL('/images/karaoke.jpg', import.meta.url).href;
const hunt = new URL('/images/hunt.png', import.meta.url).href;
const weather = new URL('/images/weather.png', import.meta.url).href;

const styles = {
  root: {

  },
  grid: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  }
};

export default function ProjectPage() {
  const projects = [
    {
      name: "Meo No Karaoke",
      image: karaoke,
      type: "Karaoke web app",
      description: "I made this website during Covid-19 pandemic for me and my friends to sing together in leisure time!",
      technologies: ["React","MUI","Socket.IO","NodeJS","ExpressJS","MongoDB"],
      link: "https://meonokaraoke.netlify.app/",
    },
    {
      name: "City Hunt",
      image: hunt,
      type: "Scavenger theme mobile game app",
      description: "This is my COMP3097 - Mobile App Development II final project which is also the first time I actually develop a game!",
      technologies: ["Vue","Ionic","NodeJS","ExpressJS","MongoDB"],
      link: "https://github.com/dustinle48/city-hunt",
    },
    {
      name: "Weatherman",
      image: weather,
      type: "Weather mobile app",
      description: "This is my COMP3074 - Mobile App Development I final project. The app consumes OpenWeather APIs to display weather forecast.",
      technologies: ["React","React Native","Expo","OpenWeather APIs"],
      link: "https://github.com/dustinle48/COMP3074-Weatherman",
    },
  ];

  return (
    <Grid container spacing={0} sx={styles.root}>
      <Grid item lg={2} md={2} sm={0} xs={0}></Grid>
      <Grid sx={styles.grid} item container lg={8} md={8} sm={12} xs={12}>
      { projects.map((project,index) => (
        <Grid key={index} item lg={4} md={4} sm={12} xs={12}>
          <Project project={project} />
        </Grid>
      ))}
        <Grid item lg={4} md={4} sm={12} xs={12} container justifyContent="center">
          <Box>
            <Typography>{`const async newProject = () => {`}</Typography>
            <Typography marginLeft="15px">{`await fetch(moreProjects)`}</Typography>
            <Typography marginLeft="15px">{`return moreWillCome`}</Typography>
            <Typography>{`};`}</Typography>
          </Box>
        </Grid>
      </Grid>
      <Grid item lg={2} md={2} sm={0} xs={0}></Grid>
    </Grid>
  )
}
