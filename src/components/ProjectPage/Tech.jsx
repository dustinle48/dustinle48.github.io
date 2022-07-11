import { Chip, Grid } from '@mui/material';

const styles = {
    root: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    }
};

export default function Tech(props) {
    const { techs } = props;
    return (
        <Grid sx={styles.root}>
            <Grid container justifyContent="center">
            { techs.map((tech,index) => (
                <Grid key={index} item>
                    <Chip size='small' label={tech} />
                </Grid>
            ))}
            </Grid>
        </Grid>
    )
}
