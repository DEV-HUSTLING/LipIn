import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoadingScreen() {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            flexDirection: 'column' 
        }}>
            <div style={{ textAlign: 'center' }}>
                <h2>Loading Your Profile Analysis...</h2>
                <div style={{ 
                    width: '50px', 
                    height: '50px', 
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid #E45A92',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '20px auto'
                }}></div>
                <p>Please wait while we analyze your profile data...</p>
            </div>
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    )
}

export default LoadingScreen