import React, { useEffect, useState } from 'react'
import { app } from './firebase.jsx';
import dayjs from 'dayjs';
import {browserTheme} from './helpers/bowserTheme.jsx';
import { collection, getDocs, query, orderBy, limit, getFirestore, where } from "firebase/firestore";
import './App.css'
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
function CommentTracker({ url }) {
    const db = getFirestore(app)
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [dailycounts, setDailyCounts] = useState({})
    const [weekCounts, setWeekCounts] = useState()
    const [monthlyCounts, setMonthlyCounts] = useState()
    let today = new Date();
    let theme = browserTheme()
    console.log(theme)
    let formattedDate = today.toLocaleDateString('en-US');
    const [todayDate, setTodayDate] = useState(dayjs(formattedDate))
    const fetchComments = async (numDate) => {
        try {
            const commentRef = collection(db, "comments", url.href?.split('/in/')[1]?.split('/')[0], "items");
            const counts = {}
            // get todays comments
            const todayQuery = query(
                commentRef,
                where('text', "!=", ""),
                where('createdAt', "==", numDate)
            )
            const todayquerySnapshot = await getDocs(todayQuery)
            todayquerySnapshot.forEach((doc) => {
                const data = doc.data()
                if (!data.text || data.text.trim() === "") {
                    return
                }
                const date = new Date(numDate);
                const dateString = date.toLocaleDateString('en-US');
                if (counts[dateString]) {
                    counts[dateString]++
                }
                else {
                    counts[dateString] = 1
                }
                setDailyCounts({ ...counts })
            })



        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        const today = new Date(todayDate);
        today.setHours(0, 0, 0, 0);
        const numDate = today.getTime();
        fetchComments(numDate)
    }, [url, db, todayDate])
    // const sortedDates = Object.keys(dailycounts).sort((a, b) => b.localeCompare(a));
    useEffect(async () => {
        const today = new Date(todayDate);
        today.setHours(0, 0, 0, 0);
        const numDate = today.getTime();
        console.log(numDate)

        const week = new Date(todayDate - 7 * 24 * 60 * 60 * 1000)
        week.setHours(0, 0, 0, 0);
        const weekDate = week.getTime();

        // monthly time
        const month = new Date(todayDate - 30 * 24 * 60 * 60 * 1000)
        month.setHours(0,0,0,0);
        const monthDate = month.getTime();
        try {

            const commentRef = collection(db, "comments", url.href?.split('/in/')[1]?.split('/')[0], "items");
            const counts = {}
            // get todays comments
            const todayQuery = query(
                commentRef,
                where('text', "!=", ""),
                where('createdAt', "<=", numDate),
                where('createdAt', ">=", weekDate)
            )
            const todayquerySnapshot = await getDocs(todayQuery)
            let counter = 0
            todayquerySnapshot.forEach((doc) => {
                const data = doc.data()
                if (!data.text || data.text.trim() === "") {
                    return
                }
                counter += 1
            })
            setWeekCounts(counter)
            console.log(todayquerySnapshot.length)



        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
         try {

            const commentRef = collection(db, "comments", url.href?.split('/in/')[1]?.split('/')[0], "items");
            // get todays comments
            const monthlyQuery = query(
                commentRef,
                where('text', "!=", ""),
                where('createdAt', "<=", numDate),
                where('createdAt', ">=", monthDate)
            )
            const monthquerySnapshot = await getDocs(monthlyQuery)
            let counter = 0
            monthquerySnapshot.forEach((doc) => {
                const data = doc.data()
                if (!data.text || data.text.trim() === "") {
                    return
                }
                counter += 1
            })
            setMonthlyCounts(counter)
            console.log(monthquerySnapshot.length)
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    }, [url])
    return (
        <div>
            {loading && <div>Loading comments...</div>}

            <div className='commontTracker'>
                <h3 style={{color:theme ==="dark"?'white':'black'}} >Tracking Comments</h3>
                <div className='commentCount' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', color: 'black' }}>
                    <div className={`commentDate ${theme === 'dark' ? 'Dark_DatePicker' : 'Light_DatePicker'}`}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DemoContainer components={['DatePicker']}>
                                <DatePicker value={todayDate} onChange={(it) => setTodayDate(it)} sx={{ width: '100%', fontSize: '2rem' }} />
                            </DemoContainer>
                        </LocalizationProvider>
                    </div>

                    <span className='commentValue' style={{color: 'rgb(228, 90, 146)'}} >
                        {dailycounts[new Date(todayDate).toLocaleDateString('en-US')]}
                    </span>
                </div>
                <div className='commentHist' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', color: 'black' }}>
                    <p className='commentDate' style={{color: theme==='dark'?'white':'black'}}>
                        Last 7 Days
                    </p>
                    <div className='commentValue' style={{color:'rgb(228, 90, 146)'}}>
                        <span>{weekCounts}</span>
                    </div>
                </div>
                                <div className='commentHist' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', color: 'black' }}>
                    <p className='commentDate' style={{color: theme==='dark'?'white':'black'}}>
                        Last 30 Days
                    </p>
                    <div className='commentValue' style={{color:'rgb(228, 90, 146)'}}>
                        <span>{weekCounts}</span>
                    </div>
                </div>

            </div>

        </div>
    )
}

export default CommentTracker