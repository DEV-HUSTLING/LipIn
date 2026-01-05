import React from 'react'
import { Button } from '@mui/material'
import '../landingPage.css'
import { Routes, Route } from "react-router-dom"
import InputForm from './components/InputForm';
import Dashboard from './dashboard';

export default function Home() {
  return (
    <Routes>
        <Route path='/' element={<Dashboard />} />
      <Route path="/form" element={<InputForm />} />
    </Routes>
  )
}

