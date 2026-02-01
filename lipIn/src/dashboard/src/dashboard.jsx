import React, { useEffect, useState } from 'react'
import '../landingPage.css'
import { Routes, Route, Link, useParams, useLocation } from "react-router-dom"
import SSIBoost from './pages/SSIBoost';
import homeImg from '../../../public/customAssets/home.png';
import SSIboost from '../../../public/customAssets/SSIBoost.png';
import PostGen from './pages/PostGen';
import ProfileBuilder from './pages/ProfileBuilder.jsx';
import LoadingScreen from './components/LoadingScreen';
import axios from 'axios';
export default function Dashboard() {
  const { profileId } = useParams();
  const location = useLocation();
  const [currentProfileId, setCurrentProfileId] = useState('');
  const [nicheData, setNicheData] = useState(null)
  const [isLoadingNiche, setIsLoadingNiche] = useState(true)
  const niche = useState(location.state?.niche)

  useEffect(() => {
    console.log(location.pathname);
    // Set profileId from URL params if available
    if (profileId) {
      setCurrentProfileId(profileId);
    }

    // Also try to get from Chrome storage as backup
    if (typeof chrome !== 'undefined' && chrome.storage) {
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
    if (!nicheData) {
      console.log("niche",niche)
      axios.get('http://127.0.0.1:8000/profileBuilder', {
        params: {
          profile_url: profileId,
          niche: niche[0]
        }
      })
        .then(function (nicheResponse) {
          console.log('Niche recommendation success:', nicheResponse.data);
          if (nicheResponse.data.success) {
            setIsLoadingNiche(false);
          }
          setNicheData(nicheResponse.data);
        })
        .catch(function (nicheError) {
          console.error('Niche recommendation error:', nicheError.response?.data || nicheError);
          setIsLoadingNiche(false);
        });
    }

  }, [profileId]);
  if (isLoadingNiche) {
    return <LoadingScreen message="Generating your personalized niche recommendations..." />;
  }
  return (
    <div className='dashboard_container'
      style={{
        display: 'flex',
        width:'100%',
        gap: '1rem',
      }}
    >
      {/* Dashboard Navigation */}
      <nav style={{
        width: '14rem',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        backgroundColor: 'white',
        borderTopRightRadius: '10px',
        borderBottomRightRadius: '10px',
        paddingInline: '1rem',
        boxSizing: 'border-box',
        gap: '1rem',
        position: 'fixed',
      }}>
        <h3 style={{ fontSize: '3rem !important' }}><span style={{ color: 'black', fontWeight: 'normal' }}>Lip</span><span style={{ color: '#F4287B', fontWeight: 'bold' }}>In</span></h3>

        <Link to={`/dashboard/${currentProfileId}`} className={location.pathname === `/dashboard/${currentProfileId}` ? 'dashboard_link_active' : ''} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img src={homeImg} width={"30px"} height={'30px'} />
          <p>Home</p>
        </Link>
        {currentProfileId && (
          <>
            <Link to={`/dashboard/${currentProfileId}/analytics`} className={location.pathname === `/dashboard/${currentProfileId}/analytics` ? 'dashboard_link_active' : ''} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={SSIboost} width={"30px"} height={'30px'} />
              <p>Analytics</p>
            </Link>
            <Link to={`/dashboard/${currentProfileId}/ProfileBuilder`} className={location.pathname === `/dashboard/${currentProfileId}/ProfileBuilder` ? 'dashboard_link_active' : ''} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={SSIboost} width={"30px"} height={'30px'} />
              <p>Profile Builder</p>
            </Link>
            <Link to={`/dashboard/${currentProfileId}/postGen`} className={location.pathname === `/dashboard/${currentProfileId}/postGen` ? 'dashboard_link_active' : ''} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              <img src={SSIboost} width={"30px"} height={'30px'} />
              <p>Post Generation</p>
            </Link>
          </>
        )}

      </nav>
      <div style={{width:'75%', marginLeft:'20%'}}>
        <div>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="/ProfileBuilder" element={<ProfileBuilder data={nicheData} />} />
            <Route path="/analytics" element={<SSIBoost />} />
            <Route path="/postGen" element={<PostGen />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

