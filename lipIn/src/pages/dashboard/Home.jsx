import React from 'react'
import { Button } from '@mui/material'
import '../landingPage.css'
import { Routes, Route } from "react-router-dom"
import InputForm from './components/InputForm';
import Dashboard from './dashboard';
import MainProfile from './mainProfile';

export default function Home() {
  return (
    <div className='Container'>
      <header>
        <div className='Header'>
          <h3><span style={{ color: 'black' }}>Lip</span><span style={{ color: '#F4287B', fontWeight: 'bold' }}>In</span></h3>
          <Button variant="contained" sx={{
            backgroundColor: '#F4287B',
            color: 'white',
          }}
          >
            SignIn
          </Button>
        </div>
      </header>
      <Routes>
        <Route path='/' element={<Dashboard />} />
        <Route path="/form/:profileId" element={<InputForm />} />
        <Route path='/profile/:profileId' element={<MainProfile />} />
      </Routes>
    </div>

  )
}

