import React from "react";
import { createRoot } from "react-dom/client";
import {
    ColorSchemeScript,
    MantineProvider,
    createTheme,
    localStorageColorSchemeManager,
} from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";
import "./index.css";
import "../wailsjs/runtime/runtime";
import App from "./App";
import { AppProvider, ThemeProvider, ModalProvider } from "./context";

const container = document.getElementById("root");
if (!container) throw new Error("Root container missing");

const theme = createTheme({
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
});

const colorSchemeManager = localStorageColorSchemeManager({ key: "azusa-color-scheme" });

createRoot(container).render(
    <React.StrictMode>
        <ColorSchemeScript defaultColorScheme="auto" />
        <MantineProvider
            theme={theme}
            defaultColorScheme="auto"
            colorSchemeManager={colorSchemeManager}
        >
            <Notifications position="top-right" zIndex={2000} />
            <AppProvider>
                <ThemeProvider>
                    <ModalProvider>
                        <App />
                    </ModalProvider>
                </ThemeProvider>
            </AppProvider>
        </MantineProvider>
    </React.StrictMode>
);
