import { Button, Divider, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

const styles = {
    root: {
        position: "absolute",
        top: "4%",
        justifyContent: "center",
    }
};

export default function Map() {
  return (
    <Grid container spacing={0} sx={styles.root}>
        <Divider>
            <Link to="/">
                <Button>Home</Button>
            </Link>
        </Divider>
        <Divider>
            <Link to="/about">
                <Button>About</Button>
            </Link>
        </Divider>
        <Divider>
            <Link to="/education">
                <Button>Education</Button>
            </Link>
        </Divider>
        <Divider>
            <Link to="/project">
                <Button>Project</Button>
            </Link>
        </Divider>
    </Grid>
  )
}
