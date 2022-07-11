import { useEffect, useState } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, Chip, Divider, Grid, Typography } from "@mui/material";

import { Jump } from "./index";

const about = new URL('/markdowns/about.md', import.meta.url).href;

const styles = {
    grid: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    imageBox: {
        marginTop: "5rem",
        width: "40%",
    },
    box: {
        display: "flex",
        marginTop: "1rem",
        marginBottom: "1rem",
        alignItems: "center",
        justifyContent: "center",
    },
    chip: {
        marginLeft: "0.5rem",
        marginRight: "0.5rem",
    }
}

export default function AboutPage() {
    const [markdown, setMarkdown] = useState("");

    const personalities = ["sociable","sporty","optimistic","tenacious"];
    const hobbies = ["soccer","traveling","games","singing"];

    useEffect(() => {
        fetch(about)
            .then(res => res.text())
            .then(data => setMarkdown(data))
            .catch(err => console.error(err))
    },[])

    return (
        <Grid container spacing={0}>
            <Grid item sx={styles.grid} lg={4} md={6} sm={12} xs={12}>
                <Typography variant="h2" color="secondary" marginBottom="3rem">About me</Typography>
                <Box>
                    <Typography variant='h5' textAlign="center">{`<Personalities \\>`}</Typography>
                    <Box sx={styles.box}>
                    { personalities.map((p,index) => (
                        <Chip key={index} sx={styles.chip} color="primary" label={p.toUpperCase()} />
                    ))}
                    </Box>
                </Box>

                <Box>
                    <Typography variant='h5' textAlign="center">{`<Hobbies \\>`}</Typography>
                    <Box sx={styles.box}>
                    { hobbies.map((h,index) => (
                        <Chip key={index} sx={styles.chip} color="secondary" label={h.toUpperCase()} />
                    ))}
                    </Box>
                </Box>

                <Box sx={styles.imageBox}>
                    <Jump />
                </Box>
            </Grid>
            <Grid item sx={styles.grid} lg={4} md={6} sm={12} xs={12}>
                <ReactMarkdown children={markdown} remarkPlugins={[remarkGfm]} />
            </Grid>
        </Grid>
    )
}
