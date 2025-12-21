import { useState } from 'react'
import './App.css'
import Link from '@mui/material/Link';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import InfoOutlineIcon from '@mui/icons-material/InfoOutline';
function App({ host }) {
  const [expand, setExpand] = useState(false)
  const [theme, setTheme] = useState(true)
  const hostName = window.location.hostname;
  console.log("Hostname:", hostName);
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline' }}>
        <h1>
          LipIn
        </h1>
        <button onClick={() => { setExpand(!expand) }} style={{ backgroundColor: 'transparent', width: 'fit-content', outline: 'none', border: 'none', cursor: 'pointer' }}>
          <InfoOutlineIcon color='white' />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '90vw' }}>
        <hr style={{ borderColor: 'black' }} />
        <div className='main-content' style={{ width: '100%' }} >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
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
          </div>
        </div>
        <div className='footer' style={{ float: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', width: '100%' }}>
          {expand && <div className="ext-title-card">
            <p>
              The Content Creator AI Agent is an intelligent, fully-automated assistant designed to help creators produce high-quality content faster and with less effort.
              Whether you’re a marketer, influencer, streamer, blogger, or brand, this AI agent handles ideation, scripting, writing, editing, and publishing workflows with exceptional precision.
            </p>

          </div>}

        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <p className="read-the-docs">
          Developed by Anushka G
        </p>

        <div className='theme-switch'>
          <Switch
            checked={theme}
            onChange={() => setTheme(!theme)}
            color="primary"
          />
          <span >{theme ? 'Dark' : 'White'} Theme</span>

        </div>
      </div>

    </>
  )
}

export default App
