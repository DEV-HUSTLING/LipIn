import React, { use, useEffect, useState } from 'react'
import { app } from './auth/firebase.jsx';
import dayjs from 'dayjs';
import { browserTheme } from './helpers/bowserTheme.jsx';
import { collection, getDocs, query, orderBy, limit, getFirestore, where, onSnapshot } from "firebase/firestore";
import './App.css'
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
    InputLabel,
    MenuItem,
    Select
} from '@mui/material';
function CommentTracker() {
    const [url, setUrl] = useState('');
    const db = getFirestore(app)
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [dailycounts, setDailyCounts] = useState({})

    let today = new Date();
    let theme = browserTheme()
    console.log(theme)
    let formattedDate = today.toLocaleDateString('en-US');
    const [todayDate, setTodayDate] = useState(dayjs(formattedDate))

    const [periodSelected, setPeriodSelected] = useState(7 * 24 * 60 * 60 * 1000)
    const [finalCounts, setFinalCounts] = useState()

    const timePeriod = [
        {
            name: '7 days', value: (7 * 24 * 60 * 60 * 1000),
        },
        {
            name: '30 days', value: (30 * 24 * 60 * 60 * 1000)
        },
    ];
    useEffect(() => {
        console.log("CommentTracker: Attempting to get profileURl from storage...");
        chrome.storage.local.get(['profileURl'], (result) => {
            console.log("CommentTracker: Chrome storage result:", result);
            if (result.profileURl) {
                 console.log("CommentTracker: Found profileURl:", result.profileURl);
                setUrl(result.profileURl)
            } else {
                console.log("CommentTracker: No profileURl found in storage");
                // Let's also check all storage keys
                chrome.storage.local.get(null, (allData) => {
                    console.log("CommentTracker: All storage data:", allData);
                });
            }
        });
    }, [])

    // Real-time listener for today's comments
    useEffect(() => {
        if (!url) return;
        
        const profileId = url?.split('/in/')[1]?.split('/')[0];
        if (!profileId) {
            console.error('Could not extract profile ID from URL:', url);
            return;
        }

        // Use dayjs .toDate() to properly convert to JS Date, then normalize to midnight
        const today = todayDate.toDate ? todayDate.toDate() : new Date(todayDate);
        today.setHours(0, 0, 0, 0);
        const numDate = today.getTime();

        console.log("Setting up real-time listener for profile:", profileId, "date:", numDate, "readable:", new Date(numDate).toLocaleDateString());

        const commentRef = collection(db, "comments", profileId, "items");
        const todayQuery = query(
            commentRef,
            where('createdAt', "==", numDate)
        );

        // Real-time listener - updates automatically when comments are added
        const unsubscribe = onSnapshot(todayQuery, (snapshot) => {
            // Deduplicate comments based on text and timestamp
            const uniqueComments = new Map();
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.text && data.text.trim() !== "") {
                    const key = `${data.text.trim()}_${data.timestamp || data.createdAt}`;
                    uniqueComments.set(key, data);
                }
            });
            
            const count = uniqueComments.size;
            const dateString = new Date(numDate).toLocaleDateString('en-US');
            console.log("Real-time update - Today's comments (deduplicated):", count, "for date:", dateString);
            setDailyCounts(prev => ({ ...prev, [dateString]: count }));
            setLoading(false);
        }, (error) => {
            console.error("Error in real-time listener:", error);
            setLoading(false);
        });

        // Cleanup listener on unmount or when dependencies change
        return () => unsubscribe();
    }, [url, db, todayDate]);

    const fetchComments = async (numDate) => {
        try {
            // Extract profile ID from URL string
            const profileId = url?.split('/in/')[1]?.split('/')[0];
            if (!profileId) {
                console.error('Could not extract profile ID from URL:', url);
                return;
            }
            const commentRef = collection(db, "comments", profileId, "items");
            // get todays comments
            const todayQuery = query(
                commentRef,
                where('text', "!=", ""),
                where('createdAt', "==", numDate)
            )
            const todayquerySnapshot = await getDocs(todayQuery)
            
            // Deduplicate comments
            const uniqueComments = new Map();
            todayquerySnapshot.forEach((doc) => {
                const data = doc.data()
                if (!data.text || data.text.trim() === "") {
                    return
                }
                const key = `${data.text.trim()}_${data.timestamp || data.createdAt}`;
                uniqueComments.set(key, data);
            })
            
            const count = uniqueComments.size;
            const date = new Date(numDate);
            const dateString = date.toLocaleDateString('en-US');
            setDailyCounts(prev => ({ ...prev, [dateString]: count }));

        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    }


    const handlePeriodChange = async (event) => {
        if (!url) return;
        console.log(event.target.value)
        const profileId = url?.split('/in/')[1]?.split('/')[0];
        if (!profileId) {
            console.error('Could not extract profile ID from URL:', url);
            return;
        }

        const newPeriodValue = event.target.value;
        setPeriodSelected(newPeriodValue);

        const today = new Date(todayDate);
        today.setHours(0, 0, 0, 0);
        const numDate = today.getTime();

        // Use the new period value instead of the state (which hasn't updated yet)
        const setPeriod = new Date(today.getTime() - newPeriodValue);
        setPeriod.setHours(0, 0, 0, 0);
        const finalDate = setPeriod.getTime();

        // monthly time
        const baseTime = today.getTime(); 
        const month = new Date(baseTime - 30 * 24 * 60 * 60 * 1000);
        month.setHours(0, 0, 0, 0);
        const monthDate = month.getTime();
        try {
            console.log("Fetching final counts");
            const commentRef = collection(db, "comments", profileId, "items");

            const todayQuery = query(
                commentRef,
                where('text', "!=", ""),
                where('createdAt', "<=", numDate),
                where('createdAt', ">=", finalDate)
            );

            const todayquerySnapshot = await getDocs(todayQuery);
            
            // Deduplicate comments
            const uniqueComments = new Map();
            todayquerySnapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.text || data.text.trim() === "") {
                    return;
                }
                const key = `${data.text.trim()}_${data.timestamp || data.createdAt}`;
                uniqueComments.set(key, data);
            });

            const counter = uniqueComments.size;
            setFinalCounts(counter);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("Setting up fetch for date change");
        if (url) {
            const today = todayDate.toDate ? todayDate.toDate() : new Date(todayDate);
            today.setHours(0, 0, 0, 0);
            const numDate = today.getTime();
            fetchComments(numDate);
        }
    }, [todayDate])  // Only re-fetch when date changes, not on every render
    
    // Real-time listener for period counts (7 days / 30 days)
    useEffect(() => {
        if (!url) return;
        
        const profileId = url?.split('/in/')[1]?.split('/')[0];
        if (!profileId) {
            console.error('Could not extract profile ID from URL:', url);
            return;
        }

        const today = todayDate.toDate ? todayDate.toDate() : new Date(todayDate);
        today.setHours(0, 0, 0, 0);
        const numDate = today.getTime();

        const periodStart = new Date(today.getTime() - periodSelected);
        periodStart.setHours(0, 0, 0, 0);
        const startDate = periodStart.getTime();

        console.log("Setting up period listener for:", periodSelected / (24 * 60 * 60 * 1000), "days");

        const commentRef = collection(db, "comments", profileId, "items");
        const periodQuery = query(
            commentRef,
            where('createdAt', "<=", numDate),
            where('createdAt', ">=", startDate)
        );

        const unsubscribe = onSnapshot(periodQuery, (snapshot) => {
            // Deduplicate comments
            const uniqueComments = new Map();
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.text && data.text.trim() !== "") {
                    const key = `${data.text.trim()}_${data.timestamp || data.createdAt}`;
                    uniqueComments.set(key, data);
                }
            });
            
            const count = uniqueComments.size;
            console.log("Real-time period update - Count (deduplicated):", count);
            setFinalCounts(count);
        }, (error) => {
            console.error("Error in period listener:", error);
        });

        return () => unsubscribe();
    }, [url, db, todayDate, periodSelected]);

    // Load initial 7 days count
    useEffect(() => {
        const fetchInitialCounts = async () => {
            if (!url) {
                console.log("No URL available for initial count");
                return;
            }

            const profileId = url.split('/in/')[1]?.split('/')[0];
            if (!profileId) {
                console.error('Could not extract profile ID from URL:', url);
                return;
            }

            try {
                console.log("Fetching initial 7-day counts for profile:", profileId);

                const today = new Date(todayDate);
                today.setHours(0, 0, 0, 0);
                const numDate = today.getTime();

                const initialPeriod = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                initialPeriod.setHours(0, 0, 0, 0);
                const initialDate = initialPeriod.getTime();

                const commentRef = collection(db, "comments", profileId, "items");
                const initialQuery = query(
                    commentRef,
                    where('text', "!=", ""),
                    where('createdAt', "<=", numDate),
                    where('createdAt', ">=", initialDate)
                );

                const initialSnapshot = await getDocs(initialQuery);
                
                // Deduplicate comments
                const uniqueComments = new Map();
                initialSnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!data.text || data.text.trim() === "") {
                        return;
                    }
                    const key = `${data.text.trim()}_${data.timestamp || data.createdAt}`;
                    uniqueComments.set(key, data);
                });

                const counter = uniqueComments.size;
                setFinalCounts(counter);
                console.log("Initial 7-day count set to:", counter);

            } catch (error) {
                console.error("Error fetching initial comments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialCounts();
    }, [url, todayDate, db]);
    //helper function to check today's date
    const formatDateDisplay = (selectedDate) => {
        const today = new Date();
        const selected = new Date(selectedDate);

        // Compare just the date parts (ignore time)
        if (
            selected.getFullYear() === today.getFullYear() &&
            selected.getMonth() === today.getMonth() &&
            selected.getDate() === today.getDate()
        ) {
            return "Today";
        }
        return selected.toLocaleDateString('en-US');
    };
    return (
        <div>
            {loading && <div>Loading comments...</div>}

            <div className='commontTracker'>
                <h3 style={{ color: 'black', textAlign: 'center', fontSize: '24px' }} >Tracking Comments</h3>
                <div className='commentCount' style={{ display: 'flex', alignItems: 'center',color: 'black' }}>
                    <div className={`commentDate Light_DatePicker`}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DemoContainer components={['DatePicker']}>
                                <DatePicker
                                    value={todayDate}
                                    format={todayDate &&
                                        new Date(todayDate).toDateString() === new Date().toDateString()
                                        ? "Today"
                                        : "MM/DD/YYYY"
                                    }
                                    onChange={(it) => setTodayDate(it)} />
                            </DemoContainer>
                        </LocalizationProvider>

                    </div>

                    <span className='commentValue' style={{ color: 'rgb(228, 90, 146)' }} >
                        {dailycounts[(todayDate.toDate ? todayDate.toDate() : new Date(todayDate)).toLocaleDateString('en-US')] ?? 0}
                    </span>
                </div>
                <div className='commentHist' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', color: 'black' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <InputLabel className='commentDate' style={{ color: 'black', fontSize: '16px', fontWeight: 'lighter' }} id="demo-simple-select-standard-label">Last</InputLabel>
                        <Select
                            variant="standard"
                            labelId="demo-simple-select-standard-label"
                            id="demo-simple-select-standard"
                            value={periodSelected || (7 * 24 * 60 * 60 * 1000)}
                            onChange={handlePeriodChange}
                            placeholder={"7 days"}
                            sx={{
                                fontSize: '16px', fontWeight: 'lighter'
                            }}

                        >
                            {timePeriod.map((acc) => (
                                <MenuItem key={acc.name} value={acc.value}
                                >
                                    {acc.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>
                    <div className='commentValue' style={{ color: 'rgb(228, 90, 146)' }}>
                        <span>{finalCounts ? finalCounts : 0}</span>
                    </div>

                </div>
            </div>

        </div>
    )
}

export default CommentTracker