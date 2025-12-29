import React from 'react'
import '../../landingPage.css'
import { Button } from '@mui/material'
import { useNavigate } from "react-router-dom";
function InputForm() {
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
        <main style={{paddingLeft:'2rem', paddingRight:'2rem'}}>
            <div className='FormMain'>
                <div>
                <h1>InputMain</h1>
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

export default InputForm