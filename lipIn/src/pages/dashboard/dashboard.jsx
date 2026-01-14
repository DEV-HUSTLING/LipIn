import React, {useEffect, useState} from 'react'
import { Button } from '@mui/material'
import '../landingPage.css'
import { Routes, Route, Link, useParams, useLocation } from "react-router-dom"
import InputForm from './components/InputForm';
import SSIBoost from './SSIBoost';
import Home from './Home';
import {authAPI} from '../../auth/authAPI';
import homeImg from '../../../public/customAssets/home.png';
import SSIboost from '../../../public/customAssets/SSIBoost.png';

export default function Dashboard() {
  const { profileId } = useParams();
  const location = useLocation();
  const [currentProfileId, setCurrentProfileId] = useState('');
  
  useEffect(() => {
    console.log(location.pathname);
    // Set profileId from URL params if available
    if (profileId) {
      setCurrentProfileId(profileId);
    }
    
    // Also try to get from Chrome storage as backup
    if(typeof chrome !== 'undefined' && chrome.storage){
      chrome.storage.local.get('profileURl', (result) => {
        if (result.profileURl) {
          const extractedUrl = result.profileURl;
          const extractedId = extractedUrl.split("/in/")[1]?.split("/")[0];
          if (extractedId && !profileId) {
            setCurrentProfileId(extractedId);
          }
        }
      });
    }
  }, [profileId]);
  
  return (
    <div className='dashboard_container'
    style={{
    display:'flex',
    flexDirection:'row',
    gap:'2rem',
    }}
    >
      {/* Dashboard Navigation */}
      <nav style={{ 
         width:'20%',
      height:'100vh',
      display:'flex',
      flexDirection:'column',
      alignItems:'flex-start',
      backgroundColor:'white',
      borderTopRightRadius:'20px',
      borderBottomRightRadius:'20px',
      padding:'1rem',
      boxSizing:'border-box',
      gap:'2rem'
      }}>
        <h3 style={{ fontSize:'3rem !important'}}><span style={{ color: 'black' }}>Lip</span><span style={{ color: '#F4287B', fontWeight: 'bold' }}>In</span></h3>
        
        <Link to={`/dashboard/${currentProfileId}`} className={location.pathname===`/dashboard/${currentProfileId}`?'dashboard_link_active':''} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
         <img src={homeImg} width={"30px"} height={'30px'}/>
         <p>Home</p>
        </Link>
        <Link to={`ssi-boost`} className={location.pathname===`/dashboard/${currentProfileId}/ssi-boost`?'dashboard_link_active':''} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
        <img src={SSIboost} width={"30px"} height={'30px'}/>
         <p>SSI Boost</p>
        </Link>

      </nav>
      <div className='Container'>
      <div>
        <Routes>
          <Route index element={<SSIBoost />} />
        </Routes>
      </div>
    </div>
    </div>
  )
}

