import React, { useEffect, useState } from 'react'
import { Button } from '@mui/material'
import '../landingPage.css'
import { Routes, Route } from "react-router-dom"
import { useNavigate } from "react-router-dom";
import InputForm from './components/InputForm';
import {authAPI} from '../../auth/authAPI';

function Home() {
    const navigate = useNavigate();
    const [profileId, setProfileId] = useState('')
    
    useEffect(() => {
        chrome.storage.local.get('profileURl', (result) => {
            if (result.profileURl) {
                const extractedUrl = result.profileURl;
                setProfileId(extractedUrl)
            }
        });
    }, []);
    const handleGoogleSignIN =async()=>{
        try {
            const response = await authAPI.googleSignIn(profileId.split("/in/")[1]?.split("/")[0])
            if(response.message === "existing_user"){
                navigate(`/dashboard/${profileId.split("/in/")[1]?.split("/")[0]}`)

            }
            else{
                navigate(`/form/${profileId.split("/in/")[1]?.split("/")[0]}`)

            }
            
        } catch (error) {
            console.error('Sign-in error:', error);
    }
    }
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
            <main >
                <div className='dashboardMain'>
                    <div>
                        <h1>Start your LinkedIn content journey from smarter commenting to consistent content creation</h1>
                        <p>AI assistance to engage better, write faster, and build a stronger presence.</p>
                        <span style={{
                            width: '100%', display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}><h4>{profileId}</h4></span>
                    </div>
                    <Button variant="contained" sx={{
                        backgroundColor: '#0B68A6',
                        border: 'none',
                        borderRadius: '3rem',
                        color: 'white',
                    }} onClick={handleGoogleSignIN}>Let's Begin</Button>
                </div>
            </main>
        </div>
    )
}

export default Home