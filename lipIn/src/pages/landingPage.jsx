// src/pages/landingPage.jsx  ✅ entry file
import React from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter, HashRouter } from 'react-router-dom';
import ReactDOM from 'react-dom/client';
import Dashboard from "./dashboard/dashboard.jsx"
import Home from "./dashboard/Home.jsx";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
    <Home />
    </HashRouter>
  </React.StrictMode>
)