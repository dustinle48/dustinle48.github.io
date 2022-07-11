import { Chip, Grid, Typography } from '@mui/material'
import React from 'react'

const styles = {
    root: {
        paddingLeft: "1rem",
    },
    chip: {
        margin: "0.5rem",
    }
};

export default function Language(props) {
    const { lang } = props;
        
    return (
        <Grid sx={styles.root}>
            <Typography color="primary">language.{`${lang.name}: [`}</Typography>
            { lang.langs.map((l,index) => (
                <Chip key={index} sx={styles.chip} label={l} />
            ))}
            <Typography color="primary">{`];`}</Typography>
        </Grid>
    )
}
