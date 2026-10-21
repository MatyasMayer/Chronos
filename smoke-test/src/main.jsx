import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import App from "./App.jsx";
import "./styles.css";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
}

createRoot(document.getElementById("root")).render(
  <MantineProvider>
    <App />
  </MantineProvider>,
);
