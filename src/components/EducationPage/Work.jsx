import { Grid, Typography } from '@mui/material';

export default function Work(props) {
    const { job } = props;

    return (
        <Grid>
            <Typography variant='h6' color="secondary">{job.job} @ {job.company}</Typography>
            <Typography>{`> `}{job.to} - {job.from}</Typography>
        </Grid>
    )
}
