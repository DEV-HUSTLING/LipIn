import React, { useEffect, useState } from 'react'
import {app}from './firebase.jsx';
import { collection, getDocs, query, orderBy, limit, getFirestore, where } from "firebase/firestore";
import './App.css'
function CommentTracker({url}) {
      const db = getFirestore(app)
      const [comments, setComments] = useState([])
      const [loading, setLoading] = useState(true)
      const [dailycounts, setDailyCounts] = useState({})
      useEffect(()=>{
        const fetchComments = async()=>{
            try {
                const commentRef = collection(db,"comments",url.href?.split('/in/')[1]?.split('/')[0], "items");
                const quert = query(
                        commentRef,
                        where('text',"!=","")
                     );

                const querySnapshot = await getDocs(quert)
                // const fetchedComments = [];
                //     querySnapshot.forEach((doc) => {
                //     fetchedComments.push({
                //     id: doc.id,
                //         ...doc.data()
                //     });
                // });
                // setComments(fetchedComments)
                // Get comment count
                const counts = {}
                querySnapshot.forEach((doc)=>{
                    const data = doc.data()
                    if(!data.text || data.text.trim()===""){
                        return
                    }
                    console.log(data.text,"text")
                    const date = new Date(data.createdAt)
                    const dateString = date.toLocaleDateString('en-US');
                    if(counts[dateString]){
                        counts[dateString]++
                    }
                    else{
                        counts[dateString] = 1
                    }
                    setDailyCounts(counts)
                })
            } catch (error) {
                console.error("Error fetching comments:", error);
            }finally {
        setLoading(false);
      }
        }
        fetchComments()
      },[url, db])
    const sortedDates = Object.keys(dailycounts).sort((a, b) => b.localeCompare(a));
    if(dailycounts){
                console.log(dailycounts['2025-12-30'])

    }

  return (
    <div>
        {/* {loading&&<div>Loading comments...</div>}

          <div style={{ color:'black',padding: '10px', marginBottom: '10px', backgroundColor:'white',border: '1px solid #E45A92',boxShadow:'0 4px 8px 0 rgba(242, 107, 249, 0.65), 0 6px 20px 0 rgba(242, 107, 249, 0.65)' }}>
            <h3 style={{color:'black', fontSize:'1.5rem'}}>Comments Every Day</h3>
            {dailycounts&&sortedDates.map((date)=>
                <div key={date} style={{display:'flex', alignItems:'center', justifyContent:'space-evenly',color:'black'}}>
                    <p style={{fontFamily:'Avenir',fontWeight:'thin',fontSize:'1rem',color:'black'}} >{new Date(date).toLocaleDateString('en-US',{
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}</p>
                    <p style={{fontFamily:'Avenir',fontWeight:'thin',fontSize:'1rem',color:'black'}}>
                        {dailycounts[date]}
                    </p>
                   </div> 
            )}
          </div> */}

    </div>
  )
}

export default CommentTracker