// src/pages/landingPage.jsx  ✅ entry file
import React from "react"
import { createRoot } from "react-dom/client"
import Home from "./dashboard/Home.jsx";
import { HashRouter } from "react-router-dom";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
    <Home />
    </HashRouter>
  </React.StrictMode>
)