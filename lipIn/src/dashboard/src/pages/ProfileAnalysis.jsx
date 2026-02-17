import axios from 'axios';
import React, { useState, useEffect } from 'react'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';

function profileAnalysis(props) {
    const profileData = props.data?.data || null;
    const [expandedSections, setExpandedSections] = useState({});

    const toggleExpanded = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const renderCurrent = (current, sectionName) => {
        const isExpanded = expandedSections[sectionName] || false;

        // Special handling for Visual Branding - show profile picture image if available
        if (sectionName === 'Visual Branding' && typeof current === 'object' && current !== null) {
            const profilePictureUrl = current.profile_picture || '';
            return (
                <div>
                    {profilePictureUrl ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            border: '1px solid #e8e8e8',
                            borderRadius: '10px',
                            backgroundColor: '#fafafa'
                        }}>
                            <img
                                src={profilePictureUrl}
                                alt="Profile"
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    objectFit: 'cover',
                                    borderRadius: '12px',
                                    border: '1px solid #ddd'
                                }}
                            />
                            <div>
                                <Typography component="div" style={{ fontSize: '14px', color: '#555' }}>
                                    <strong style={{ color: '#333' }}>Profile Picture:</strong> Loaded
                                </Typography>
                                <Typography component="div" style={{ fontSize: '13px', color: '#777', marginTop: '0.25rem' }}>
                                    Banner: {current.has_custom_banner ? 'Custom' : 'Default'}
                                </Typography>
                            </div>
                        </div>
                    ) : (
                        <Typography component="div" style={{ color: '#999', fontSize: '15px', fontStyle: 'italic' }}>
                            No profile picture available
                        </Typography>
                    )}
                </div>
            );
        }

        // Special handling for About Section - show first line with see more
        if (sectionName === 'About Section' && typeof current === 'string') {
            const lines = current.split('\n');
            const firstLine = lines[0];
            const preview = firstLine.length > 50 ? `${firstLine.substring(0, 50)}...` : firstLine;
            const hasMore = lines.length > 1 || current.length > 50;

            return (
                <div>
                    <Typography component="div" style={{ color: '#333', fontSize: '15px' }}>
                        {isExpanded ? current : preview}
                    </Typography>
                    {hasMore && (
                        <Button
                            size="small"
                            onClick={() => toggleExpanded(sectionName)}
                            style={{ marginTop: '0.5rem', textTransform: 'none', fontSize: '13px' }}
                        >
                            {isExpanded ? 'See Less' : 'See More'}
                        </Button>
                    )}
                </div>
            );
        }

        // Special handling for Experience Section - always show all in accordion format
        if (sectionName === 'Experience Section' && Array.isArray(current)) {
            return (
                <div>
                    {current.map((experience, idx) => (
                        <Accordion key={idx} style={{ marginBottom: '0.5rem', boxShadow: 'none', border: '1px solid #e8e8e8' }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ minHeight: '48px' }}>
                                <Typography style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                    {experience.title || experience.position || `Position ${idx + 1}`}
                                    {experience.company && ` @ ${experience.company}`}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails style={{ paddingTop: 0 }}>
                                <div>
                                    {Object.entries(experience).map(([key, value]) => (
                                        key !== 'title' && key !== 'position' && key !== 'company' && (
                                            <Typography key={key} component="div" style={{ marginBottom: '0.3rem', fontSize: '14px', color: '#555' }}>
                                                <strong style={{ color: '#333' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {
                                                    typeof value === 'object' ? JSON.stringify(value, null, 2) : value
                                                }
                                            </Typography>
                                        )
                                    ))}
                                </div>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </div>
            );
        }

        // Special handling for Skills & Endorsements - show count and list
        if (sectionName === 'Skills & Endorsements' && typeof current === 'object' && current !== null) {
            return (
                <div>
                    {current.skills_count && (
                        <Typography component="div" style={{ marginBottom: '0.5rem', fontSize: '14px', color: '#1565c0', fontWeight: '600' }}>
                            Total Skills: {current.skills_count}
                        </Typography>
                    )}
                    {current.skills && Array.isArray(current.skills) && (
                        <div style={{ marginBottom: '0.5rem' }}>
                            <Typography component="div" style={{ fontSize: '13px', color: '#666', marginBottom: '0.3rem' }}>
                                <strong>Skills List:</strong>
                            </Typography>
                            <Typography component="div" style={{ fontSize: '14px', color: '#555' }}>
                                {isExpanded ? current.skills.join(', ') : current.skills.slice(0, 10).join(', ')}
                                {current.skills.length > 10 && !isExpanded && '...'}
                            </Typography>
                            {current.skills.length > 10 && (
                                <Button
                                    size="small"
                                    onClick={() => toggleExpanded(sectionName)}
                                    style={{ marginTop: '0.5rem', textTransform: 'none', fontSize: '13px' }}
                                >
                                    {isExpanded ? 'See Less' : `See More (${current.skills.length - 10} more)`}
                                </Button>
                            )}
                        </div>
                    )}
                    {current.top_endorsed && Array.isArray(current.top_endorsed) && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <Typography component="div" style={{ fontSize: '13px', color: '#666', marginBottom: '0.3rem' }}>
                                <strong>Top Endorsed:</strong>
                            </Typography>
                            {current.top_endorsed.map((item, idx) => (
                                <Typography key={idx} component="div" style={{ fontSize: '14px', color: '#555', marginBottom: '0.2rem' }}>
                                    • {item.skill}: {item.endorsements} endorsements
                                </Typography>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Special handling for Network Size - show connections and visible count
        if (sectionName === 'Network Size' && typeof current === 'object' && current !== null) {
            return (
                <div>
                    {Object.entries(current).map(([key, value]) => (
                        <Typography key={key} component="div" style={{ marginBottom: '0.3rem', fontSize: '14px', color: '#555' }}>
                            <strong style={{ color: '#333' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {value}
                        </Typography>
                    ))}
                </div>
            );
        }

        // Special handling for Activity & Engagement
        if (sectionName === 'Activity & Engagement' && typeof current === 'object' && current !== null) {
            return (
                <div>
                    {current.posting_frequency && (
                        <Typography component="div" style={{ marginBottom: '0.3rem', fontSize: '14px', color: '#555' }}>
                            <strong style={{ color: '#333' }}>Posting Frequency:</strong> {current.posting_frequency}
                        </Typography>
                    )}
                    {current.last_post && (
                        <Typography component="div" style={{ marginBottom: '0.3rem', fontSize: '14px', color: '#555' }}>
                            <strong style={{ color: '#333' }}>Last Post:</strong> {current.last_post}
                        </Typography>
                    )}
                    {current.engagement_frequency && (
                        <Typography component="div" style={{ marginBottom: '0.3rem', fontSize: '14px', color: '#555' }}>
                            <strong style={{ color: '#333' }}>Engagement Frequency:</strong> {current.engagement_frequency}
                        </Typography>
                    )}
                </div>
            );
        }

        // Default handling for other sections
        if (typeof current === 'string') {
            const isLong = current.length > 200;
            return (
                <div>
                    <Typography component="div" style={{ color: '#333', fontSize: '15px' }}>
                        {isExpanded || !isLong ? current : `${current.substring(0, 200)}...`}
                    </Typography>
                    {isLong && (
                        <Button
                            size="small"
                            onClick={() => toggleExpanded(sectionName)}
                            style={{ marginTop: '0.5rem', textTransform: 'none', fontSize: '13px' }}
                        >
                            {isExpanded ? 'See Less' : 'See More'}
                        </Button>
                    )}
                </div>
            );
        } else if (Array.isArray(current)) {
            const hasMultiple = current.length > 2;
            const displayItems = isExpanded ? current : current.slice(0, 2);

            return (
                <div>
                    {displayItems.map((item, idx) => (
                        typeof item === 'object' && item !== null ? (
                            <div key={idx} style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
                                {Object.entries(item).map(([key, value]) => (
                                    <Typography key={key} component="div" style={{ marginBottom: '0.3rem', fontSize: '14px', color: '#555' }}>
                                        <strong style={{ color: '#333' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {
                                            typeof value === 'object' ? JSON.stringify(value, null, 2) : value
                                        }
                                    </Typography>
                                ))}
                            </div>
                        ) : (
                            <Typography key={idx} component="div" style={{ marginBottom: '0.5rem', color: '#555', fontSize: '14px' }}>
                                • {item}
                            </Typography>
                        )
                    ))}
                    {hasMultiple && (
                        <Button
                            size="small"
                            onClick={() => toggleExpanded(sectionName)}
                            style={{ marginTop: '0.5rem', textTransform: 'none', fontSize: '13px' }}
                        >
                            {isExpanded ? 'See Less' : `See More (${current.length - 2} more)`}
                        </Button>
                    )}
                </div>
            );
        } else if (typeof current === 'object' && current !== null) {
            const entries = Object.entries(current);
            const hasMany = entries.length > 3;
            const displayEntries = isExpanded ? entries : entries.slice(0, 3);

            return (
                <div>
                    {displayEntries.map(([key, value]) => (
                        <Typography key={key} component="div" style={{ marginBottom: '0.5rem', fontSize: '14px', color: '#555' }}>
                            <strong style={{ color: '#333' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> {
                                typeof value === 'object' ? JSON.stringify(value, null, 2) : value
                            }
                        </Typography>
                    ))}
                    {hasMany && (
                        <Button
                            size="small"
                            onClick={() => toggleExpanded(sectionName)}
                            style={{ marginTop: '0.5rem', textTransform: 'none', fontSize: '13px' }}
                        >
                            {isExpanded ? 'See Less' : `See More (${entries.length - 3} more)`}
                        </Button>
                    )}
                </div>
            );
        } else {
            return (
                <Typography component="div" style={{ color: '#999', fontSize: '15px', fontStyle: 'italic' }}>
                    No data available
                </Typography>
            );
        }
    };

    console.log("Profile Analysis Props:", profileData)
    return (
        <div>
            {profileData ?
                <div>
                    <p style={{ fontSize:'large', display:'flex', alignItems:'center', backgroundColor:'#f4287b', borderRadius:'10px', color:'white', padding:'1rem'}}><span>Overall Profile Score:</span><b style={{ fontSize: 'x-large' }}>{profileData.total_score}</b></p>
                    <div style={{ borderTop: '1px #f1f1f1' }}>
                        <div style={{ backgroundColor: "#f66ea461", padding: '1rem', fontSize: '16px', width: 'max-content', lineHeight: '1.5rem', borderRadius: '10px' }}>
                            <p>Overall Quick Suggestions</p>
                            <ul >
                                {profileData.quick_wins?.map((ik) =>
                                    <li>
                                        {ik}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                    {/* Headline */}
                    <div>
                        {profileData.section_scores.map((it) => (<Accordion style={{ borderRadius: '10px' }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                aria-controls="panel1-content"
                                id="panel1-header"
                                style={{ height: '60px' }}
                            >
                                <Typography style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: 'large' }} component="span">
                                    <p>  {it.section_name} </p>
                                    <p><span style={(it.score > it.max_score / 2) ? { color: 'green' } : { color: 'red' }}> {it.score} </span>/{it.max_score} </p>
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <div style={{
                                    marginBottom: '1.5rem',
                                    padding: '1rem 1.5rem',
                                    backgroundColor: '#fafafa',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '10px',
                                    fontSize: '15px',
                                    lineHeight: '1.6'
                                }}>
                                    <p style={{
                                        margin: '0 0 0.5rem 0',
                                        fontWeight: '600',
                                        color: '#666',
                                        fontSize: '13px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Current Status</p>
                                    {renderCurrent(it.current, it.section_name)}
                                </div>
                                <div style={{ borderTop: '1px #f1f1f1' }}>
                                    <div style={{ backgroundColor: "#f0fdf4", padding: '1rem', fontSize: '16px', width: 'max-content', lineHeight: '1.5rem', borderRadius: '10px' }}>
                                        <p>What's Working</p>
                                        <ul >
                                            {it.observations?.analysis?.map((ik) =>
                                                <li>
                                                    {ik}
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div style={{ backgroundColor: "#e0e0e0", padding: '1rem', fontSize: '16px', width: 'max-content', lineHeight: '1.5rem', borderRadius: '10px', marginTop: '1rem' }}>
                                        <p>AI Suggestions to Improve Score</p>
                                        <ul>
                                            {it.observations?.improvements?.map((il) =>
                                                <li>
                                                    {il}
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </AccordionDetails>
                        </Accordion>))}
                    </div>

                </div>

                : <h1>Data on the wa</h1>}
        </div>
    )
}

export default profileAnalysis