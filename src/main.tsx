import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "./lib/api-client";

setBaseUrl(import.meta.env.VITE_API_BASE_URL ?? null);

createRoot(document.getElementById("root")!).render(<App />);
