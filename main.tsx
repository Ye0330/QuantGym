import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import QuantGym from "./components/quantgym";
import "./app/globals.css";

createRoot(document.getElementById("root")!).render(<StrictMode><QuantGym /></StrictMode>);
