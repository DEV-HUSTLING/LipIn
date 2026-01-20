import { useState, useEffect } from 'react'
import './App.css'
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
// import { getPostDescription } from './content/utils.jsx';
import {
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import CommentTracker from './commentTracker';
function App({ host }) {
  const [expand, setExpand] = useState(false)
  // const [theme, setTheme] = useState(true)
  const [persona, setPersona] = useState('')
  const [personaStatus, setPersonaStatus] = useState(false)
  const [newpersonaChck, setNewPersonaChck] = useState('')
  const [newlanguageChck, setNewLanguageChck] = useState('')
  const [accentSelected, setAccentSelected] = useState('Use American English with plain, conversational language. Short sentences, common vocabulary, American spelling (color, organize), friendly and easy to understand.')
  const handleChange = (event) => {
    setAccentSelected(event.target.value);

  }
  const accents = [
    {
      name: 'British English Simple', value: 'Use British English with simple, clear wording. Short sentences, everyday vocabulary, British spelling (colour, organise), neutral and friendly tone.'
    },
    {
      name: 'British English Professional', value: 'Use British English in a professional, polished tone. Formal but approachable language, British spelling, structured sentences, suitable for business or academic contexts.'
    },
    {
      name: 'American English Simple', value: 'Use American English with plain, conversational language. Short sentences, common vocabulary, American spelling (color, organize), friendly and easy to understand.'
    },
    {
      name: 'American English Professional', value: 'Use American English in a professional tone. Clear, confident, and concise language, American spelling, suitable for corporate, startup, or executive communication.'
    },
    {
      name: 'Australian English Simple', value: 'Use Australian English with a relaxed, straightforward tone. Simple wording, informal but clear, Australian spelling, natural and friendly style.'
    },
    {
      name: 'Australian English Professional', value: 'Use Australian English in a professional yet approachable tone. Clear structure, Australian spelling, business-appropriate language without excessive formality.'
    },
    {
      name: 'Indian English Simple', value: 'Use Indian English with simple, polite, and clear language. Neutral tone, commonly used Indian English phrasing, easy-to-follow sentence structure.'
    },
    {
      name: 'Indian English Professional', value: 'Use Indian English in a professional and respectful tone. Clear, structured sentences, formal phrasing commonly used in corporate or technical Indian contexts.'
    }];
  const hostName = window.location.hostname;
  console.log("persona", persona);
  useEffect(() => {

    const defaultAccent = 'Use American English with plain, conversational language. Short sentences, common vocabulary, American spelling (color, organize), friendly and easy to understand.';

    // Check if chrome APIs are available
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.warn('Chrome storage API not available');
      setAccentSelected(defaultAccent);
      return;
    }

    try {
      chrome.storage.local.get(['persona'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting persona:', chrome.runtime.lastError);
          return;
        }
        if (result.persona) {
          setPersona(result.persona);
          setNewPersonaChck(result.persona);
        }
      });

      chrome.storage.local.get(['language'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting language:', chrome.runtime.lastError);
          setAccentSelected(defaultAccent);
          return;
        }
        if (result.language) {
          setAccentSelected(result.language);
          setNewLanguageChck(result.language);
        } else {
          setAccentSelected(defaultAccent);
        }
      });
    } catch (error) {
      console.error('Error accessing chrome storage:', error);
      setAccentSelected(defaultAccent);
    }
    console.log("hostName");
        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
      console.log('Popup opened, triggering getProfileURL...');
      chrome.runtime.sendMessage({ action: 'triggerGetProfileURL' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error triggering getProfileURL:', chrome.runtime.lastError);
        } else {
          console.log('GetProfileURL triggered successfully:', response);
        }
      });
    }
  }, []);


  return (
    <div className='popup-container' style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px' }}>
          <h3 style={{margin:'0'}} ><span style={{ color: 'black' }}>Lip</span><span style={{ color: '#F4287B', fontWeight: 'bold' }}>In</span></h3>
        <button onClick={() => { setExpand(!expand) }} style={{ backgroundColor: 'transparent', width: 'fit-content', outline: 'none', border: 'none', cursor: 'pointer' }}>
          <InfoOutlineIcon color='white' />
        </button>
      </div>
      <div className='footer' style={{ float: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '100%' }}>
        {expand && <div className="ext-title-card">
          <p>
            The Content Creator AI Agent is an intelligent, fully-automated assistant designed to help creators produce high-quality content faster and with less effort.
            Whether you’re a marketer, influencer, streamer, blogger, or brand, this AI agent handles ideation, scripting, writing, editing, and publishing workflows with exceptional precision.
          </p>

        </div>}

      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center'}}>
        <CommentTracker />
        <hr style={{ borderColor: 'black' }} />
        <div className='main-content' style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }} >
          <div>
          {personaStatus && <div> {newpersonaChck === persona ? <p style={{ color: 'red' }}> No changes made</p> : <p style={{ color: 'green' }}>Persona saved successfully!</p>}
            {newlanguageChck === accentSelected ? <p style={{ color: 'red' }}> No changes made</p> : <p style={{ color: 'green' }}>Language preference saved successfully!</p>}
          </div>}
          <textarea
            onChange={(e) => {
              setPersona(e.target.value);
            }}
            value={persona}
            placeholder={persona || "About Me: Write your detailed perosnality here to generate the content in your style."}
            style={{
              width: '100%',
              height: '250px',
              borderRadius: '5px',
              resize: 'vertical'
            }}
          />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap:'1rem',justifyContent:'center' }}>
            <InputLabel id="demo-simple-select-standard-label">Dialect</InputLabel>
            <Select
            variant="standard" 
               labelId="demo-simple-select-standard-label"
              id="demo-simple-select-standard"
              value={accentSelected || 'Use American English with plain, conversational language. Short sentences, common vocabulary, American spelling (color, organize), friendly and easy to understand.'}
              onChange={handleChange}
              placeholder={"Select Language Preference"}
              sx={{
                fontSize:'14px',
              }}
              
            >
              {accents.map((accent) => (
                <MenuItem key={accent.name} value={accent.value} 
                >
                  {accent.name}
                </MenuItem>
              ))}
            </Select>
          </div>


          <Button onClick={() => {
            setPersonaStatus(true);
            setTimeout(() => {
              setPersonaStatus(false);
            }, 3000);
            if (newpersonaChck === persona) {
              return
            }
            else {
              // Check if chrome APIs are available
              if (typeof chrome === 'undefined' || !chrome.storage) {
                console.error('Chrome storage API not available');
                return;
              }

              try {
                chrome.storage.local.set({ persona: persona, language: accentSelected }, () => {
                  if (chrome.runtime.lastError) {
                    console.error('Error saving persona:', chrome.runtime.lastError);
                    return;
                  }
                  console.log('Persona saved:', persona);
                });
              } catch (error) {
                console.error('Error saving to chrome storage:', error);
              }
            }

          }}>Save</Button>
          <Button onClick={() => {
            if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
              chrome.runtime.sendMessage({ action: 'openDashboard' }, (response) => {
                console.log('Dashboard tab opened');
              });
            }
          }}>Dashboard</Button>
          {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <p>Total Tokens: 3000</p>

            <Link
              component="button"
              variant="body2"
              onClick={() => {
                console.info("I'm a button.");
              }}
              style={{ outline: 'none', border: 'none' }}
            >
              Recharge
            </Link>
          </div>
          <hr style={{ borderColor: 'black' }} />
          <div style={{ textAlign: 'left' }}>
            <p>Comment Tokens: 1500 Spent</p>
            <p>Post Tokens: 1500 Spent </p>
          </div> */}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <p className="read-the-docs">
          Developed by Anushka G
        </p>

        {/* <div className='theme-switch'>
          <Switch
            checked={theme}
            onChange={() => setTheme(!theme)}
            color="primary"
          />
          <span >{theme ? 'Dark' : 'White'} Theme</span>

        </div> */}
      </div>

    </div>
  )
}

export default App
