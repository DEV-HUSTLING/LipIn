import React from 'react'
import { Button } from '@mui/material'
import '../landingPage.css'
import { Routes, Route } from "react-router-dom"
import { useNavigate } from "react-router-dom";
import InputForm from './components/InputForm';

function Dashboard() {
      const navigate = useNavigate();

  return (
    <div className='Container'>

        <header>
            <div className='Header'>
                <h3><span style={{color:'black'}}>Lip</span><span style={{color:'#F4287B', fontWeight:'bold'}}>In</span></h3>
                <Button variant="contained" sx={{
                    backgroundColor:'#F4287B',
                    color:'white',
                }}>
                    SignIn
                </Button>
            </div>
        </header>
        <main >
            <div className='dashboardMain'>
                <div>
                <h1>Start your LinkedIn content journey from smarter commenting to consistent content creation</h1>
                <p>AI assistance to engage better, write faster, and build a stronger presence.</p>
                </div>
                <Button variant="contained" sx={{
                    backgroundColor:'#0B68A6',
                    border:'2px solid #F4287B',
                    borderRadius:'3rem',
                    color:'white',
                }} onClick={()=>{
                    navigate("/form")
                }}>Let's Begin</Button>
            </div>
        </main>
    </div>
  )
}

export default Dashboard