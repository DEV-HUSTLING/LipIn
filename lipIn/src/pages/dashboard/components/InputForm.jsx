import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../../landingPage.css'
import { Button } from '@mui/material'
import { useParams } from "react-router-dom";
import { FormControl, InputLabel, FormHelperText, Input, TextareaAutosize } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { collection, getDocs, query, orderBy, limit, getFirestore, where } from "firebase/firestore";

function InputForm() {
    const { profileId } = useParams()
    const [inputForm, setInputForm] = useState({
        url: '',
        email: '',
        name: '',
        userDescription: '',
        purpose: '',
        careerVision: '',
        headline: '',
        ssiScore: [],
        profileFile: [],
        resume: [],
        currentExp: '',
        topics:[],
        skills:[],
        pastExperience: ''
    })
    useEffect(() => {
        console.log(profileId)
    if (profileId) {
        setInputForm(prev => ({
            ...prev,
            url: profileId
        }));
    }
}, [profileId]);

    const handleChange = (e) => {
        const  { name, type, value, files } = e.target;
        setInputForm(prev => ({
            ...prev,
            [name]: type === 'file' ? [...prev[name], ...Array.from(files)] || null : value,
        }))
    }
const submitForm = () => {
    const formData = new FormData();
    
    // Add text fields
    formData.append('url', inputForm.url || '');
    formData.append('email', inputForm.email || '');
    formData.append('name', inputForm.name || '');
    formData.append('userDescription', inputForm.userDescription || '');
    formData.append('purpose', inputForm.purpose || '');
    formData.append('careerVision', inputForm.careerVision || '');
    formData.append('headline', inputForm.headline || '');
    formData.append('currentExp', inputForm.currentExp || '');
    formData.append('pastExperience', inputForm.pastExperience || '');
    
    // Add profileFileAnalytics files
    if (Array.isArray(inputForm.ssiScore)) {
        inputForm.ssiScore.forEach((file) => {
            if (file instanceof File) {
                formData.append('ssiScore', file);
            }
        });
    }
    // Add skills array
     if(inputForm.topics){
    inputForm.topics.forEach(ele => {
        formData.append('topics',ele)
    });
   }
   if(inputForm.skills){
    inputForm.skills.forEach(ele => {
        formData.append('skills',ele)
    });
   } 
    // Add profileFile files
    if (Array.isArray(inputForm.profileFile)) {
        inputForm.profileFile.forEach((file) => {
            if (file instanceof File) {
                formData.append('profileFile', file);
            }
        });
    }
    
    // Add resume files
    if (Array.isArray(inputForm.resume)) {
        inputForm.resume.forEach((file) => {
            if (file instanceof File) {
                formData.append('resume', file);
            }
        });
    }

    
    axios.post('http://127.0.0.1:8000/personalInfo', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    .then(function (response) {
        console.log('Success:', response.data);
    })
    .catch(function (error) {
        console.error('Error:', error.response?.data || error);
    });
};
const removeFile = (fileName, fileIndex)=>{
    console.log('removing file:', fileName, fileIndex);
 setInputForm(prev => ({
        ...prev, 
        [fileName]: prev[fileName].filter((_, index) => index !== fileIndex)
    }));
}
const handleArrChange=(e)=>{
    const {name,value} = e.target;
    if(e.key === 'Enter'){
        e.preventDefault();
        const valuesArr = value.split(',').map(item=> item.trim()).filter(item=>item!=='');
        setInputForm(prev=>({
            ...prev,
            [name]: [...prev[name],...valuesArr]
        }))
    }
}
if(inputForm){
    console.log(inputForm)
}
 
    return (
        <div className='Container'>
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
                                <InputLabel htmlFor="my-input-6">LinkedIn Headline</InputLabel>
                                <Input name='headline' type='text' value={inputForm.headline} onChange={handleChange} fullWidth='true' id="my-input-6" placeholder='Building Network/Finding Job/Promoting Company/Hiring' aria-describedby="my-helper-text" />
                                <FormHelperText id="my-helper-text"><a href="https://business.linkedin.com/sales-solutions/social-selling/the-social-selling-index-ssi">{`You can get your SSI score here(click on Get your SSI score after going into the page)`}</a>
                                </FormHelperText>
                            </div>
                            {/* Analytics Documents */}
                            <div className='UploadSection'>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', overflow: 'scroll', scrollbarWidth: 'none', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {inputForm.ssiScore && inputForm.ssiScore.map((it, index) =>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: 'max-content', padding: '5px', textAlign: 'center', borderRadius: '10rem', backgroundColor: '#d5d5d5ff', border: 'none', outline: 'none' }}>
                                            {it.name}
                                            <button onClick={()=>removeFile('ssiScore', index)}  style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}>
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
                                }} htmlFor="my-input-7">Attach your SSI Analytics Complete Screenshot <AttachFileIcon />
                                    <Input multiple name="ssiScore" onChange={handleChange} type='file' fullWidth='true' id="my-input-7" placeholder='Add profile analytics' aria-describedby="my-helper-text" /></InputLabel>
                                <FormHelperText id="my-helper-text">{`You can find it in your profile page scroll to Analytics tab and take a screen shot`}
                                </FormHelperText>

                            </div>
                            {/* Profile Link */}
                            <div className='UploadSection'>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', overflow: 'scroll', scrollbarWidth: 'none', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {inputForm.profileFile && inputForm.profileFile.map((it,index) =>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: 'max-content', padding: '5px', textAlign: 'center', borderRadius: '10rem', backgroundColor: '#d5d5d5ff', border: 'none', outline: 'none' }}>
                                            {it.name}
                                            <button onClick={()=>removeFile('profileFile', index)}  style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}>
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
                                    htmlFor="my-input-8">Attach your all LinkedIn profile related analytics files <AttachFileIcon />
                                    <Input multiple name="profileFile" onChange={handleChange} type='file' fullWidth='true' id="my-input-8" placeholder='Building Network/Finding Job/Promoting Company/Hiring' aria-describedby="my-helper-text" />
                                </InputLabel>
                                <FormHelperText id="my-helper-text">{`you can dowload by selecting Resources button in your LinkedIn profile page. if you premium account you can download more analytics data.`}
                                </FormHelperText>
                            </div>
                            {/* Resume Link */}
                            <div className='UploadSection'>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', overflow: 'scroll', scrollbarWidth: 'none', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {inputForm.resume && inputForm.resume.map((it,index) =>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: 'max-content', padding: '5px', textAlign: 'center', borderRadius: '10rem', backgroundColor: '#d5d5d5ff', border: 'none', outline: 'none' }}>
                                            {it.name}
                                            <button onClick={()=>removeFile('resume', index)} style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}>
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
                              {/*Skills*/}
                            <div>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', overflow: 'scroll', scrollbarWidth: 'none', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {inputForm.skills && inputForm.skills.map((it, index) =>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: 'max-content', padding: '5px', textAlign: 'center', borderRadius: '10rem', backgroundColor: '#d5d5d5ff', border: 'none', outline: 'none' }}>
                                            {it}
                                            <button onClick={()=>removeFile('skills', index)}  style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}>
                                                <HighlightOffIcon fontSize="small" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <InputLabel htmlFor="my-input-11">Skills</InputLabel>
                                <Input type='text' name='skills' onKeyDown={handleArrChange} fullWidth='true' id="my-input-11" placeholder='Enter you intersted topics sepatated by topic. At the end click enter to add it in the form.' aria-describedby="my-helper-text" />

                            </div>

                            {/*Topics of interest */}
                            <div>
                                <div style={{ display: 'flex', gap: '1rem', width: '100%', overflow: 'scroll', scrollbarWidth: 'none', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {inputForm.topics && inputForm.topics.map((it, index) =>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', width: 'max-content', padding: '5px', textAlign: 'center', borderRadius: '10rem', backgroundColor: '#d5d5d5ff', border: 'none', outline: 'none' }}>
                                            {it}
                                            <button onClick={()=>removeFile('topics', index)}  style={{ backgroundColor: 'transparent', border: 'none', outline: 'none' }}>
                                                <HighlightOffIcon fontSize="small" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <InputLabel htmlFor="my-input-12">Topics of interest</InputLabel>
                                <Input type='text' name='topics' onKeyDown={handleArrChange} fullWidth='true' id="my-input-12" placeholder='Enter you intersted topics sepatated by topic. At the end click enter to add it in the form.' aria-describedby="my-helper-text" />

                            </div>

                            {/*Additional Information */}
                            <div>
                                <InputLabel htmlFor="my-input-13">Past Professional Experiences</InputLabel>
                                <TextareaAutosize
                                    type='textarea'
                                    value={inputForm.pastExperience}
                                    name='pastExperience'
                                    onChange={handleChange}
                                    maxRows={8}
                                    aria-label="maximum height"
                                    defaultValue=""
                                    style={{ width: '100%', height: 200, border: '1px solid rgba(169 169 169 / 29%)', borderRadius: '6px', backgroundColor: 'rgba(255 255 255 / 24%)' }}
                                    fullWidth='true' id="my-input-13" placeholder='This include your work history, certifications, college or personal projects. Elaborate as thoroughly as you can.' aria-describedby="my-helper-text" />
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