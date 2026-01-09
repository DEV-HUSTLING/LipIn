import React, { useEffect, useState } from 'react'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import axios from 'axios';

const MainProfile = () => {
    const [profileId, setProfileId] = useState('')
    const [ssidata, setSsidata] = useState([])
    function createData(name, value) {
        return { name, value };
    }

    const rows = ssidata.data?.ssi_data?.Components ?
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
                axios.get(`http://127.0.0.1:8000/personalInfo`, {
                    params: {
                        profile_url: extractedUrl.split("/in/")[1]?.split("/")[0]
                    }
                }).then((res) => {
                    console.log(res.data)
                    setSsidata(res.data)
                }).catch((err) => {
                    console.log(err)
                })
            }
        });
    }, [])

    return (
        <div className='Container'>
            <div className="ssi_section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
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
            <div className='ssi_recommendation'>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between',width:'100%', gap:'10px'}}>
                    <h4>SSI Suggestions</h4>
                    <hr style={{width:'90%'}} />
                </div>
                <div style={{height:'50vh', width:'100%'}}>
                    <div>
                        {
                            ssidata.data?.recommendations?.map((item, index) => (
                                <div key={index}>
                                    <h4>{item.component}</h4>
                                    <div style={{display:'grid', gridTemplateColumns:'repeat( auto-fit, minmax(250px, 1fr) )',gridAutoRows:'auto', gap:'1rem'}}>
                                    {item.recommendations?.map((it)=><div style={{backgroundColor:'#f66ea521', padding:'1rem', borderRadius:'1rem', overflowY:'auto'}}>
                                    <p>{it}</p>
                                    </div>)}
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                </div>
            </div>                    
        </div>
    )
}

export default MainProfile