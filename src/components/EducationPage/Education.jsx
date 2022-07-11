import { Divider, Grid, Typography } from '@mui/material';

const styles = {
    root: {
        paddingLeft: "1rem",
    },
};

export default function Education(props) {
    const { education } = props;

    return (
        <Grid sx={styles.root}>
            <Typography>{`>`} {education.from} - {education.to}</Typography>
            <Divider variant='string'/>
            <Typography variant='h5' color="secondary">{education.school}</Typography>
            <Typography>{education.major}</Typography>
        </Grid>
    )
}
