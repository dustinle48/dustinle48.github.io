import { Education, Language, Work } from "./index";
import { Box, Grid, Typography } from "@mui/material";

const styles = {
  root: {

  },
  grid: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    marginTop: "1rem",
    marginBottom: "1rem",
  }
};

export default function EducationPage() {
  const stack = [
    {
      name: "programming",
      langs: ["JavaScript","Python","HTML","CSS"]
    },
    {
      name: "frontend",
      langs: ["React","Vue"]
    },
    {
      name: "backend",
      langs: ["NodeJS","ExpressJS","Django"]
    },
    {
      name: "database",
      langs: ["NoSQL","PostgreSQL"]
    }
  ];

  const education = [
    {
      from: "2018",
      to: "2022",
      school: "George Brown College",
      major: "Computer Programming Analyst"
    },
    {
      from: "2012",
      to: "2016",
      school: "University of Economics and Law - Vietnam National University HCMC",
      major: "Finance and Banking"
    }
  ];

  const work = [
    {
      from: "2018",
      to: "2021",
      company: "Canada Way",
      job: "Designer"
    },
    {
      from: "2017",
      to: "2018",
      company: "Sao Mai",
      job: "Saleman"
    },
    {
      from: "2014",
      to: "2027",
      company: "HCMC Securities Corporation",
      job: "Broker"
    },
  ];

  return (
    <Grid container spacing={0}>
      <Grid sx={styles.grid} item lg={4} md={6} sm={12} xs={12}>
        <Box>
          <Typography variant="h5" color="secondary">MyStack.map{`\(language => {`}</Typography>

          { stack.map((lang,index) => (
            <Box key={index} sx={styles.box}>
              <Language lang={lang}/>
            </Box>
          ))}

          <Typography variant="h5">{`});`}</Typography>
        </Box>
      </Grid>

      <Grid sx={styles.grid} item lg={4} md={6} sm={12} xs={12}>
        <Box>
          <Typography variant="h5" color="secondary">{`for (let edu of education) {`}</Typography>
          { education.map((edu,index) => (
            <Box key={index} sx={styles.box}>
              <Education education={edu} />
            </Box>
          ))}
          <Typography variant="h5" color="secondary">{`};`}</Typography>
        </Box>
      </Grid>

      <Grid sx={styles.grid} item lg={4} md={6} sm={12} xs={12}>
        <Box>
          { work.map((w,index) => (
            <Box key={index} sx={styles.box}>
              <Work job={w} />
            </Box>
          ))}
        </Box>
      </Grid>
    </Grid>
  )
}
