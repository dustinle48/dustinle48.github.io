import { ThemeProvider } from "@emotion/react";
import { theme } from "./themes/theme";
import { CssBaseline } from "@mui/material";

import Home from "./components/Home";

import './App.css'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Home />
    </ThemeProvider>
  )
}

export default App
