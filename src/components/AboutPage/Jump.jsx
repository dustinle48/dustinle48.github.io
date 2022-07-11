import { Grid } from "@mui/material";

const jump = new URL('/images/jump.png', import.meta.url).href;

export default function Jump() {
  return (
    <Grid>
      <img height="100%" width="100%" src={jump} alt="jump" />
    </Grid>
  )
}
