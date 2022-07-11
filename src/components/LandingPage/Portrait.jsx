import { Grid } from "@mui/material";

const portrait = new URL('/images/portrait-green-circle.png', import.meta.url).href;

export default function Portrait() {
  return (
    <Grid>
      <img height="100%" width="100%" src={portrait} alt="portrait" />
    </Grid>
  )
}
