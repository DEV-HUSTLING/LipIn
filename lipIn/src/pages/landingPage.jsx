// src/pages/landingPage.jsx  ✅ entry file
import React from "react"
import { createRoot } from "react-dom/client"
import Home from "./dashboard/Home.jsx";
import Dashboard from "./dashboard/dashboard.jsx";
import { HashRouter, Routes, Route } from "react-router-dom";
import InputForm from "./dashboard/components/InputForm.jsx";
import SSIBoost from "./dashboard/SSIBoost.jsx";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
     <Routes>
        <Route path='/' element={<Home />} />
        <Route path="/form/:profileId" element={<InputForm />} />
        <Route path="/dashboard/:profileId/*" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)