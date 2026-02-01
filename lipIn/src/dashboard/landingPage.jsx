// src/pages/landingPage.jsx  ✅ entry file
import React from "react"
import { createRoot } from "react-dom/client"
import Home from "./src/Home.jsx";
import Dashboard from "./src/dashboard.jsx";
import { HashRouter, Routes, Route } from "react-router-dom";
import InputForm from "./src/components/InputForm.jsx";
import ProfileBuilder from "./src/pages/ProfileBuilder.jsx";
import NicheRecom from "./src/pages/NicheRecom.jsx";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
     <Routes>
        <Route path='/' element={<Home />} />
        <Route path="/NicheRecom" element={<NicheRecom />} />
        <Route path="/form/:profileId" element={<InputForm />} />
        <Route path="/dashboard/:profileId/*" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
)