import { Grid } from '@mui/material'
import React from 'react'

export default function Image(props) {
    const { image } = props;
    return (
        <Grid>
            <img style={{objectFit:"contain"}} src={image} width="100%" height="100%" />
        </Grid>
    )
}
