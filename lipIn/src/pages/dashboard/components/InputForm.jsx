import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../../landingPage.css'
import { Button } from '@mui/material'
import { useNavigate } from "react-router-dom";
import { FormControl, InputLabel, FormHelperText, Input, TextareaAutosize } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { collection, getDocs, query, orderBy, limit, getFirestore, where } from "firebase/firestore";

function InputForm() {
    const [url, setUrl] = useState('')
    const [inputForm, setInputForm] = useState({
        url: url,
        email: '',
        name: '',
        userDescription: '',
        purpose: '',
        careerVision: '',
        SSIscore: '',
        profileFileAnalytics: [],
        profileFile: [],
        resume: [],
        currentExp: '',
        additionalInfo: ''
    })
    useEffect(() => {
        chrome.storage.local.get('profileURl', (result) => {
            if (result.profileURl) {
                const extractedUrl = result.profileURl.split("/in/")[1]?.split("/")[0];
                setUrl(extractedUrl);
            }
        });
    }, []);
    const handleChange = (e) => {

        const { name, type, value, files } = e.target;
        setInputForm(prev => ({
            ...prev,
            [name]: type === 'file' ? [...prev[name], ...Array.from(files)] || null : value,
        }))
    }
    const submitForm = () => {
        axios.post('http://127.0.0.1:8000/personalInfo',inputForm).then(function (response) {
            console.log(response.data); // Access the data returned by the server
        })
            .catch(function (error) {
                console.error(error); // Handle any errors
            })
    }
    return (
        <div className='Container'>
            <header>
                <div className='Header'>
                    <h3><span style={{ color: 'black' }}>Lip</span><span style={{ color: '#F4287B', fontWeight: 'bold' }}>In</span></h3>
                    <Button variant="contained" sx={{
                        backgroundColor: '#F4287B',
                        color: 'white',
                    }}>
                        SignIn
                    </Button>
                </div>
            </header>
            <main style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                <div className='FormMain'>
                    <div>
                        <h1>Help me know you,</h1>
                        <p>Your inputs for this form will help the agent understand your persona and your goals which will help it to built a plan for your linkediIn presence.</p>
                        <div className='Inputform'>
                            <div>
                                <InputLabel htmlFor="my-input-1">Email address</InputLabel>
                                <Input type='text' name='email' value={inputForm.email} onChange={handleChange} id="my-input-1" aria-describedby="my-helper-text" fullWidth='true' />
                                <FormHelperText id="my-helper-text">We'll never share your email.</FormHelperText>
                            </div>
                            {/* Name */}
                            <div>
                                <InputLabel htmlFor="my-input-2">Your full name</InputLabel>
                                <Input type='text' name="name" value={inputForm.name} onChange={handleChange} id="my-input-2" aria-describedby="my-helper-text" fullWidth='true' />
                            </div>
                            {/* About Me */}
                            <div>
                                <InputLabel htmlFor="my-input-3">How would you describe yourself?</InputLabel>
                                <TextareaAutosize
                                    type='textarea'
                                    name='userDescription'
                                    value={inputForm.userDescription}
                                    onChange={handleChange}
                                    maxRows={8}
                                    aria-label="maximum height"
                                    placeholder="Include your education, work experience, currently located, hobbies, passion, etc.."
                                    id='DescriptionInput'
                                    defaultValue=""
                                    style={{ width: '100%', height: 200, border: '1px solid rgba(169 169 169 / 29%)', borderRadius: '6px', backgroundColor: 'rgba(255 255 255 / 24%)' }}

                                />
                            </div>
                            {/* Goal */}
                            <div>
                                <InputLabel htmlFor="my-input-4">Why do you use LinkedIn?</InputLabel>
                                <Input name='purpose' type='text' value={inputForm.purpose} onChange={handleChange} fullWidth='true' id="my-input-4" placeholder='Building Network/Finding Job/Promoting Company/Hiring' aria-describedby="my-helper-text" />
                            </div>
                            {/* Vision */}
                            <div>
                                <InputLabel htmlFor="my-input-5">Describe where do your ideal career trajectory in next 5 years.</InputLabel>
                                <Input name='careerVision' type='text' value={inputForm.careerVision} onChange={handleChange} fullWidth='true' id="my-input-5" placeholder='Building Network/Finding Job/Promoting Company/Hiring' aria-describedby="my-helper-text" />
                            </div>
                            {/* SSI Score */}
                            <div>
                                <InputLabel htmlFor="my-input-6">Provide your profile SSI Score</InputLabel>
                                <Input name='SSIscore' type='text' value={inputForm.SSIscore} onChange={handleChange} fullWidth='true' id="my-input-6" placeholder='Building Network/Finding Job/Promoting Company/Hiring' aria-describedby="my-helper-text" />
                                <FormHelperText id="my-helper-text"><a href="https://business.linkedin.com/sales-solutions/social-selling/the-social-selling-index-ssi">{`You can get your SSI score here(click on Get your SSI score after going into the page)`}</a>
                                </FormHelperText>
                            </div>
                            {/* Analytics Documents */}
                            <div className='UploadSection'>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', overflow: 'scroll', scrollbarWidth: 'none', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {inputForm.profileFileAnalytics && inputForm.profileFileAnalytics.map((it) =>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: 'max-content', padding: '5px', textAlign: 'center', borderRadius: '10rem', backgroundColor: '#d5d5d5ff', border: 'none', outline: 'none' }}>
                                            {it.name}
                                            <button style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}>
                                                <HighlightOffIcon fontSize="small" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <InputLabel style={{
                                    background: 'rgb(82 168 255 / 9%',
                                    color: '#888',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    height: '5vh'
                                }} htmlFor="my-input-7">Attach your LinkedIn profile analytics <AttachFileIcon />
                                    <Input multiple name="profileFileAnalytics" onChange={handleChange} type='file' fullWidth='true' id="my-input-7" placeholder='Add profile analytics' aria-describedby="my-helper-text" /></InputLabel>
                                <FormHelperText id="my-helper-text">{`You can find it in your profile page scroll to Analytics tab and take a screen shot`}
                                </FormHelperText>

                            </div>
                            {/* Profile Link */}
                            <div className='UploadSection'>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', overflow: 'scroll', scrollbarWidth: 'none', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {inputForm.profileFile && inputForm.profileFile.map((it) =>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: 'max-content', padding: '5px', textAlign: 'center', borderRadius: '10rem', backgroundColor: '#d5d5d5ff', border: 'none', outline: 'none' }}>
                                            {it.name}
                                            <button style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}>
                                                <HighlightOffIcon fontSize="small" />
                                            </button>
                                        </div>)}
                                </div>
                                <InputLabel
                                    style={{
                                        background: 'rgb(82 168 255 / 9%',
                                        color: '#888',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        height: '5vh'
                                    }}
                                    htmlFor="my-input-8">Attach your LinkedIn profile pdf <AttachFileIcon />
                                    <Input multiple name="profileFile" onChange={handleChange} type='file' fullWidth='true' id="my-input-8" placeholder='Building Network/Finding Job/Promoting Company/Hiring' aria-describedby="my-helper-text" />
                                </InputLabel>
                                <FormHelperText id="my-helper-text">{`you can dowload by selecting Resources button in your LinkedIn profile page.`}
                                </FormHelperText>
                            </div>
                            {/* Resume Link */}
                            <div className='UploadSection'>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', overflow: 'scroll', scrollbarWidth: 'none', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {inputForm.resume && inputForm.resume.map((it) =>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: 'max-content', padding: '5px', textAlign: 'center', borderRadius: '10rem', backgroundColor: '#d5d5d5ff', border: 'none', outline: 'none' }}>
                                            {it.name}
                                            <button style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}>
                                                <HighlightOffIcon fontSize="small" />
                                            </button>
                                        </div>)}
                                </div>
                                <InputLabel
                                    style={{
                                        background: 'rgb(82 168 255 / 9%',
                                        color: '#888',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        height: '5vh'
                                    }}
                                    htmlFor="my-input-9">Attach your resume <AttachFileIcon />
                                    <Input multiple type='file' name='resume' onChange={handleChange} fullWidth='true' id="my-input-9" placeholder='Building Network/Finding Job/Promoting Company/Hiring' aria-describedby="my-helper-text" />
                                </InputLabel>
                            </div>
                            {/*Current Expereince */}
                            <div>
                                <InputLabel htmlFor="my-input-10">Current Experience</InputLabel>
                                <TextareaAutosize
                                    type='textarea'
                                    value={inputForm.currentExp}
                                    name='currentExp'
                                    onChange={handleChange}
                                    maxRows={8}
                                    aria-label="maximum height"
                                    defaultValue=""
                                    placeholder='Describe your current experience'
                                    style={{ width: '100%', height: 200, border: '1px solid rgba(169 169 169 / 29%)', borderRadius: '6px', backgroundColor: 'rgba(255 255 255 / 24%)' }} fullWidth='true' id="my-input-10" aria-describedby="my-helper-text" />
                            </div>
                            {/*Additional Information */}
                            <div>
                                <InputLabel htmlFor="my-input-11">Additional Information</InputLabel>
                                <TextareaAutosize
                                    type='textarea'
                                    value={inputForm.additionalInfo}
                                    name='additionalInfo'
                                    onChange={handleChange}
                                    maxRows={8}
                                    aria-label="maximum height"
                                    defaultValue=""
                                    style={{ width: '100%', height: 200, border: '1px solid rgba(169 169 169 / 29%)', borderRadius: '6px', backgroundColor: 'rgba(255 255 255 / 24%)' }}
                                    fullWidth='true' id="my-input-11" placeholder='Add any more information you would like to add to describe yourself and your work. You can add links too.' aria-describedby="my-helper-text" />
                            </div>
                            <Button variant="contained" sx={{
                                backgroundColor: '#0B68A6',
                                border: 'none',
                                borderRadius: '1rem',
                                padding: '1rem',
                                color: 'white',
                                width: '300px'
                            }} onClick={submitForm}>Submit</Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default InputForm