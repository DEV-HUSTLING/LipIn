import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DoneIcon from '@mui/icons-material/Done';
function ProfileBuilder(props) {
  const location = useLocation()
  const { profileId } = useParams()
  const [nicheData, setNicheData] = useState(props.data.data)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [bestFor, setBestFor] = useState(null)
  const [bestForAbout, setBestForAbout] = useState(null)
  const [copiedaboutIndex, setCopiedAboutIndex] = useState(null)
  const [expSuggestedIndex, setExpSuggestedIndex] = useState(null)
  const [copyskillIndex, setCopySkillIndex] = useState(null)
  console.log(props.data.data)
  return (
    <div>
      {/* Headline Section */}
      <div>
        <div>
          <h3>Improve the headline to boost your personal brand</h3>
        </div>
        <div style={{ backgroundColor: "white", borderRadius: '8px',padding: '10px', overflow: 'scroll', scrollbarWidth: 'none' }}>
          <p><i>current headline: {nicheData && nicheData.data?.headline?.current}</i></p>
          {nicheData && nicheData.data?.headline?.suggestions.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', position: 'relative', gap: '10px', alignItems: 'center' }}>
                <p>{item.recommendation}</p>
                <p><i>{item.confidenceScore}</i></p>
                <button
                  onClick={() => {
                    setBestFor(bestFor === index ? null : index)
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <InfoOutlineIcon style={{ fontSize: '20px' }} />
                </button>
                {bestFor === index && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#333',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    marginTop: '5px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    {item.bestFor}
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '50%',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#333',
                      transform: 'translateX(-50%) rotate(45deg)'
                    }}></div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(item.recommendation)
                  setCopiedIndex(index)
                  setTimeout(() => setCopiedIndex(null), 2000);
                }}
              >
                {copiedIndex === index ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))}

        </div>
      </div>
      {/* About Section */}
      <div>
        <div>
          <h3>Improve the About Section to boost your personal brand</h3>
        </div>
        <div style={{ backgroundColor: "white", borderRadius: '8px', height: "35vh", padding: '10px', overflow: 'scroll', scrollbarWidth: 'none' }}>
          <p><i>current About Section: {nicheData && nicheData.data?.about?.current}</i></p>
          {nicheData && nicheData.data?.about?.suggestions.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', position: 'relative', gap: '10px', alignItems: 'center' }}>
                <p>{item.recommendation}</p>
                <p><i>{item.confidenceScore}</i></p>
                <button
                  onClick={() => {
                    setBestForAbout(bestFor === index ? null : index)
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                >
                  <InfoOutlineIcon style={{ fontSize: '20px' }} />
                </button>
                {bestForAbout === index && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#333',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    marginTop: '5px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    {item.bestFor}
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '50%',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#333',
                      transform: 'translateX(-50%) rotate(45deg)'
                    }}></div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(item.recommendation)
                  setCopiedAboutIndex(index)
                  setTimeout(() => setCopiedAboutIndex(null), 2000);
                }}
              >
                {copiedaboutIndex === index ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ))}

        </div>
      </div>
      {/* Experience */}
      <div>
        <div>
          <h3>Improve the Position wise expereince description and key words to boost your personal brand</h3>
        </div>
        <div style={{ backgroundColor: "white", borderRadius: '8px', padding: '10px', overflow: 'scroll', scrollbarWidth: 'none' }}>
          {nicheData && nicheData.data?.experience?.positions?.map((position,index)=>(
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              <Typography component="span">{position.role}</Typography>
            </AccordionSummary>
            <AccordionDetails>
             {position.company&& <p><b>Company Name :</b>{position.company}</p>}
             {position.Description&& <p><i><b>Current Description :</b>{position.current}</i></p>}
              {position.keywords&&<p><b>Key words to have in the description :</b>{position.keywords?.join(', ') }</p>}
              {position.suggestions.map((it,j)=>(<div id={`suggestion-${index}-${j}`} style={{marginBottom:'1rem', padding:'1rem', backgroundColor:'#f9f9f9', borderRadius:'8px'}}>
                <p><b>Profile Headline :</b> {it.profileHeadline}</p>
                <p>
                  <b>Company Overview :</b>
                  {it.companyOverview}
                </p>
                 <b>Suggestions for description</b>
               <ul
               style={{
                padding:'1rem',
                borderRadius:'10px',
                lineHeight:'25px'
               }}
               >
                   {it.bulletPoints.map((rec,k)=><li key={k}>{rec}</li>)}
                </ul>
                <button
                style={{
                  background:'transparent',
                  border:'none'
                }}
                  onClick={async ()=>{
                    setExpSuggestedIndex(`${index}-${j}`)
                    const element = document.getElementById(`suggestion-${index}-${j}`);
                    const clipboardItem = new ClipboardItem({
                      'text/html': new Blob([element.outerHTML], { type: 'text/html' }),
                      'text/plain': new Blob([element.innerText], { type: 'text/plain' })
                    });
                    await navigator.clipboard.write([clipboardItem]);
                    setTimeout(() => setExpSuggestedIndex(null), 2000);
                  }}
                  >{expSuggestedIndex===`${index}-${j}`?<DoneIcon color='secondary'/>:<ContentCopyIcon color='secondary' fontSize='medium'/> }</button>
              </div>))}
            </AccordionDetails>
          </Accordion>))}
        </div>
      </div>
      {/* Skills */}
      <div>
        <div>
          <h3>Improve the skills to boost your personal brand</h3>
        </div>
        <div style={{ backgroundColor: "white", borderRadius: '8px',padding: '10px', overflow: 'scroll', scrollbarWidth: 'none' }}>
          <p><i>current headline: {nicheData && nicheData.data?.skills?.current?.join(", ")}</i></p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', position: 'relative', gap: '10px', alignItems: 'center' }}>
                <p>{nicheData && nicheData.data?.skills?.skillsToPrioritize?.join(', ')}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(nicheData.data?.skills?.skillsToPrioritize?.join(', '))
                  setTimeout(() => setCopySkillIndex(null), 2000);
                }}
              >
                { <ContentCopyIcon color='secondary' />}
              </button>
            </div>
        </div>

      </div>
    </div>
  )
}

export default ProfileBuilder