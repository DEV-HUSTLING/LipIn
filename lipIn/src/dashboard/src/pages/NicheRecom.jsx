import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../../landingPage.css'
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
function NicheRecom() {
        const navigate = useNavigate()
        const location = useLocation()
        const [selectNiche, setSelectNiche] = useState(null)
        const NicheRecomdata = location.state.data || "No data available"
        const profileId = location.state.profileId || null;
        if (NicheRecomdata) {
            console.log("NicheRecom data:", NicheRecomdata);
        }
        return (
            <div style={{ width: "100%", maxWidth: '1200px', margin: '0 auto' }}>
                <header>
                    <div className='Header'>
                        <h3><span style={{ color: 'black' }}>Lip</span><span style={{ color: '#F4287B', fontWeight: 'bold' }}>In</span></h3>
                        {/* <Button variant="contained" sx={{
            backgroundColor: '#F4287B',
            color: 'white',
          }}
          >
            SignIn
          </Button> */}
                    </div>
                </header>

                <div >
                    <h3>
                        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et
                    </h3>
                    <div>
                        <button onClick={() => {
                                setSelectNiche(it.nicheTitle)
                                console.log("Selected Niche:", it.nicheTitle);
                                const response = axios.post(`${API_URL}/SelectedNiche`,
                                    {
                                        profile_url: profileId,
                                        niche: 'General'
                                    }, {
                                    headers: { 'Content-Type': 'application/json' }
                                }).then((res) => {
                                    console.log('Niche selection response:', res.data);
                                    if (res.data.success) {
                                         navigate(`/dashboard/${profileId}/ProfileBuilder`,{
                                            state: { niche: "General" }
                                        })
                                    }
                                }).catch((error) => {
                                    console.error('Error selecting niche:', error);
                                });
                            }}
                                style={{ padding: '1rem', border: 'none', backgroundColor: "#d8d8d8", color: 'black', borderRadius: '8px' }}
                            >
                                Skip for now
                            </button>
                    </div>
                    {NicheRecomdata?.data?.niche_recommendations?.niches?.map((it, index) => (
                        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '1rem' }}>
                            <h3>{it.nicheTitle}</h3>
                            <p>
                                {it.justification}<br />
                                {it.evolutionPath}<br />
                                Target Audience:{it.targetAudience}<br />
                            </p>
                            <button onClick={() => {
                                setSelectNiche(it.nicheTitle)
                                console.log("Selected Niche:", it.nicheTitle);
                                const response = axios.post(`${API_URL}/SelectedNiche`,
                                    {
                                        profile_url: profileId,
                                        niche: it.nicheTitle
                                    }, {
                                    headers: { 'Content-Type': 'application/json' }
                                }).then((res) => {
                                    console.log('Niche selection response:', res.data);
                                    if (res.data.success) {
                                         navigate(`/dashboard/${profileId}/ProfileBuilder`,{
                                            state: { niche: it.nicheTitle }
                                        })
                                    }
                                }).catch((error) => {
                                    console.error('Error selecting niche:', error);
                                });
                            }}
                                style={{ padding: '1rem', border: 'none', backgroundColor: "#F4287B", color: 'white', borderRadius: '8px' }}
                            >
                                Choose{it.nicheTitle}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

export default NicheRecom