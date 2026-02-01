import React, { useEffect, useState } from 'react'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import axios from 'axios';
import AskAi from '../components/AskAi';
import LoadingScreen from '../components/LoadingScreen';

const SSIBoost = () => {
    const [profileId, setProfileId] = useState('')
    const [ssidata, setSsidata] = useState(null)
    const [aiValue, setAiValue] = useState('')
    const [askAI, setAskAI] = useState(false)
    const [niche, setNiche] = useState('')
    const [nicheRecom, setNicheRecom] = useState([])
    const [loading, setLoading] = useState(true)

    // Callback function to handle when data is loaded from LoadingScreen
    const handleDataLoaded = (data, profileIdFromLoader) => {
        setSsidata(data)
        setProfileId(profileIdFromLoader)
        setLoading(false)
    }
    function createData(name, value) {
        return { name, value };
    }
    useEffect(()=>{
        console.log("AI Value changed:", aiValue);
    },[aiValue])
    const rows = ssidata?.data?.ssi_data?.Components ?
        Object.entries(ssidata.data.ssi_data.Components).map(([key, value]) => {
            console.log(key, value)
            return createData(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), value)
        }
        )
        : []
  useEffect(() => {
        chrome.storage.local.get('profileURl', (result) => {
            if (result.profileURl) {
                const extractedUrl = result.profileURl;
                const extractedProfileId = extractedUrl.split("/in/")[1]?.split("/")[0]
                setProfileId(extractedProfileId)
                
                axios.get(`https://lipin.onrender.com/profileAnalysis`, {
                    params: {
                        profile_url: extractedProfileId
                    }
                }).then((res) => {
                    setSsidata(res.data)
                    setLoading(false)
                }).catch((err) => {
                    console.log('Error loading profile analysis:', err)

                })
            } else {
                setLoading(false)
            }
        });
    }, [])
    // Remove the useEffect that was loading data, since LoadingScreen will handle it
    const handleNicheSelection = (e) => {
        const selectedNiche = e.currentTarget.querySelector('h4').innerText;
        setNiche(selectedNiche);
        setLoading(true);
        console.log("Selected Niche:", selectedNiche);
        axios.post(`https://lipin.onrender.com/nicheRecommendations`, {
                profile_url: profileId,
                niche: selectedNiche
        }, {
            headers: {'Content-Type': 'application/json'}
        })
        .then((res) => {
            console.log("Niche Recommendations:", res.data);
            setNicheRecom(res.data);
            setLoading(false);
        }).catch((err) => {
            console.log("Error fetching niche recommendations:", err);
        });
    }
    return (
        <div>
        {loading ? 
            <LoadingScreen />
            :
            ssidata?.data?.ssi_data ?
            <div>
            <div className="ssi_section" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {ssidata.data?.ssi_data?.SSI_Score ? <div style={{
                    width: '23%',
                    borderRadius: '20px',
                    backgroundColor: '#f66ea521',
                    /* gap: 2rem; */
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-evenly'

                }}>
                    <h1 style={{ fontSize: '5.5rem' }}>{ssidata.data.ssi_data.SSI_Score}</h1>
                    <h2>SSI Score</h2>
                </div> : <p>loading</p>}
                <div style={{ width: '75%' }}>
                    <TableContainer component={Paper} sx={{ borderRadius: '1rem' }}>
                        <Table sx={{ minWidth: 650 }} aria-label="caption table">
                            <TableHead sx={{ backgroundColor: '#fcf2f6d3' }}>
                                <TableRow>
                                    <TableCell>SSI Pillars</TableCell>
                                    <TableCell align="right">Value</TableCell>
                                </TableRow>
                            </TableHead>
                            {ssidata.data?.ssi_data?.Components && <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.name}>
                                        <TableCell component="th" scope="row">
                                            {row.name}
                                        </TableCell>
                                        <TableCell align="right">{row.value}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>}
                        </Table>
                    </TableContainer>
                </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-around',width:'100%'}}>
                {niche.length!==0?
                 <div className='ssi_recommendation' style={{width:'65%', height:'58vh'}}>
                <div style={{ height: '100%', width: '100%',overflow:'scroll',scrollbarWidth:'none' }}>
                    <div style={{paddingBottom:'2rem'}}>
                        {!loading?
                            nicheRecom.data?.map((item, index) => (
                                <div key={index}>
                                    <h4>{item.component}</h4>
                                    <div style={{ display: 'grid', flexDirection:'column', backgroundColor:'white', borderRadius: '1rem',padding:'1rem' }}>
                                        {item.recommendations?.map((it,index) => 
                                        <div key={index} style={{display:'flex',alignItems:'center',width:'100%', justifyContent:'space-between'}}>
                                            <p>{it}</p>
                                            <button style={{width:'10%',border:'none',background:'transparent', color:'#E45A92',}} onClick={()=>{
                                                setAiValue(it)
                                                setAskAI(!askAI)
                                            }}>
                                                Ask AI
                                            </button>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            ))
                       :
                       <p>Loading Niche Specific Recommendations...</p>}
                    </div>

                </div>
                </div>
                :
                <div className='ssi_recommendation' style={{width:'65%', height:'58vh'}}>
                <div style={{ height: '100%', width: '100%',overflow:'scroll',scrollbarWidth:'none' }}>
                    <div style={{paddingBottom:'2rem'}}>
                        {
                            ssidata.data?.ssi_recommendations?.map((item, index) => (
                                <div key={index}>
                                    <h4>{item.component}</h4>
                                    <div style={{ display: 'grid', flexDirection:'column', backgroundColor:'white', borderRadius: '1rem',padding:'1rem' }}>
                                        {item.recommendations?.map((it,index) => 
                                        <div key={index} style={{display:'flex',alignItems:'center',width:'100%', justifyContent:'space-between'}}>
                                            <p>{it}</p>
                                            <button style={{width:'10%',border:'none',background:'transparent', color:'#E45A92',}} onClick={()=>{
                                                setAiValue(it)
                                                setAskAI(!askAI)
                                            }}>
                                                Ask AI
                                            </button>
                                        </div>
                                    )}
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                </div>
                </div>
                }
                <div className='niche_recommendation' style={{width:'30%'}}>
                <div>
                    <h4>Niche Suggestions</h4>
                </div>
                    <div  style={{ width: '100%', display: 'flex', flexDirection:'column', gap: '1rem', height:'58vh', overflow:'scroll',scrollbarWidth:'none' }}>
                        {
                            ssidata.data?.niche_recommendations?.recommendedNiches?.map((item, index) => (
                                    <button onClick={handleNicheSelection} key={index} style={{ backgroundColor: '#ffffffff', padding: '1rem', borderRadius: '1rem', border:'none', textAlign:'left',boxShadow: '0 4px 8px 0 rgba(rgba(246, 110, 165, 0.2), 0 6px 20px 0 rgba(rgba(246, 110, 165, 0.19)' }}>
                                        <h4 style={{color:'#E45A92', }}>{item.niche}</h4>
                                        <p>{item.oneLinePitch}</p>
                                    </button>
                            ))
                        }
                    </div>
                </div> 
            </div>
            {askAI&&<AskAi setAskAI={setAskAI} aiValue={aiValue} profileId={profileId}/>}      
             </div>
            :
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <h3>No profile data available</h3>
                </div>
            }                 
        </div>
    )
}

export default SSIBoost