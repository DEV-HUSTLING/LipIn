import React from 'react'
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import '../../landingPage.css'
function PostPreview({content}) {
  return (
    <div style={{width:'100%', display:'flex', flexDirection:'column', backgroundColor:'white'}}>
        <header style={{display:'flex', justifyContent:'space-between', padding:'10px', padding:'none !important'}}>
            <div style={{width:'40%', display:'flex', alignItems:'center'}}>
                <img></img>
                <span style={{display:'flex', flexDirection:'column'}}>
                    <h3 style={{margin:'0 !important'}}>User Name</h3>
                    <p style={{margin:'0 !important'}}><i>Preview</i></p>
                </span>
            </div>
            <div>
                <button style={{border:'none', background:'transparent', cursor:'pointer'}}>
                    <HighlightOffIcon fontSize='large' />
                </button>
            </div>
        </header>
        <main style={{padding:'1rem', backgroundColor:'rgb(252, 249, 249)', minHeight:'30vh'}}>
            <p style={{fontFamily:'-apple-system,system-ui,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Fira Sans,Ubuntu,Oxygen,Oxygen Sans,Cantarell,Droid Sans,Apple Color Emoji,Segoe UI Emoji,Segoe UI Emoji,Segoe UI Symbol,Lucida Grande,Helvetica,Arial,sans-serif'}}>{content}</p>
        </main>
        <footer style={{borderTop:'1px solid rgb(222 222 222)', width:'100%', display:'flex', justifyContent:'flex-end', paddingTop:'0.5rem'}}>
            <div style={{width:'80px', padding:'12px',fontSize:'medium',backgroundColor:'#71b7fb', borderRadius:'2rem', textAlign:'center'}}>
               <p>post</p>
            </div>
        </footer>
        
    </div>
  )
}

export default PostPreview