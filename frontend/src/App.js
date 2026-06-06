import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// SVG Icons
const Icons = {
  MainLogo: () => (
    <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
      <path d="M2 17l10 5 10-5"></path>
      <path d="M2 12l10 5 10-5"></path>
    </svg>
  ),
  Radar: ({ color, ...props }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M12 2v20M2 12h20"/>
    </svg>
  ),
  Bell: ({ color, ...props }) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  Wheel: ({ color, ...props }) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M12 2v10"></path>
      <path d="m12 12 8.5 5"></path>
      <path d="M12 12 3.5 17"></path>
      <path d="M20.5 7A10.5 10.5 0 0 0 12 1.5"></path>
    </svg>
  ),
  Shield: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>
  ),
  Bluetooth: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6.5 6.5 11 11L12 23V1l5.5 5.5-11 11"></path>
    </svg>
  ),
  Signal: (props) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"></path>
    </svg>
  ),
  Warning: ({ color, ...props }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  Phone: ({ color, ...props }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  ),
  Eye: ({ color, ...props }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  )
};

function App() {
  const [stats, setStats] = useState({
    drowsy_events: 0,
    phone_events: 0,
    side_events: 0,
    current_drowsy_score: 0,
    current_phone_score: 0,
    current_side_score: 0,
    l_ear: 0.30,
    r_ear: 0.31,
    v_gaze: 0.37,
    is_emergency_stop: false
  });

  const [currentTime, setCurrentTime] = useState('');
  
  // Audio state for alarms
  const [alarmAudio] = useState(new Audio('/alarm.wav')); 

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get('http://localhost:5000/api/stats')
        .then(res => setStats(res.data))
        .catch(err => console.log("Backend offline", err));
    }, 200);

    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const isDrowsyActive = stats.current_drowsy_score >= 10;
  const isPhoneActive = stats.current_phone_score >= 12;
  const isSideActive = stats.current_side_score >= 75;
  const isAnyAlarmRinging = isDrowsyActive || isPhoneActive || isSideActive || stats.is_emergency_stop;
  
  // Play/Stop Audio Logic
  useEffect(() => {
    if (isAnyAlarmRinging) {
      alarmAudio.play().catch(e => console.log("Audio play blocked by browser. Please interact with the page first."));
    } else {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    }
  }, [isAnyAlarmRinging, alarmAudio]);

  const mainColor = isAnyAlarmRinging ? '#ff0d00' : '#00ff33';

  // Manual Reset Function for Emergency Stop
  const handleReset = () => {
    axios.post('http://localhost:5000/api/reset')
      .then(res => console.log("System Reset Successful"))
      .catch(err => console.log("Error resetting system", err));
  };

  return (
    <div className="dashboard-container">
      {/* TOP HEADER */}
      <div className="top-header">
        <div className="header-left">
          <Icons.MainLogo />
          <span className="brand-text"><strong>DRIVER</strong> SAFETY AI</span>
        </div>
        
        <div className={`driving-mode-badge ${stats.is_emergency_stop ? 'alarm-active' : isAnyAlarmRinging ? 'alarm-active' : 'mode-active'}`}>
          <div className="radar-icon">
            <Icons.Radar color={stats.is_emergency_stop ? '#ff0d00' : mainColor} />
            <div className="radar-ping" style={{borderColor: stats.is_emergency_stop ? '#ff0d00' : mainColor}}></div>
          </div>
          <span className="mode-text">
            {stats.is_emergency_stop ? "EMERGENCY SHUTDOWN" : isAnyAlarmRinging ? "WARNING: ALARM ACTIVE" : "DRIVING MODE ACTIVE"}
          </span>
        </div>

        <div className="header-right">
          <span className="time-text">{currentTime}</span>
          <span className="network-text">4G</span>
          <Icons.Signal />
          <Icons.Bluetooth />
          <Icons.Shield />
        </div>
      </div>

      <div className="main-grid">
        
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="panel-title">DRIVER SAFETY DASHBOARD</div>
          
          <div className="telemetry-row">
            <div className="telemetry-box">
              <div className="t-label">L.EAR</div>
              <div className="t-val">{stats.l_ear.toFixed(2)}</div>
            </div>
            <div className="telemetry-box">
              <div className="t-label">R.EAR</div>
              <div className="t-val">{stats.r_ear.toFixed(2)}</div>
            </div>
            <div className="telemetry-box">
              <div className="t-label">V.GAZE</div>
              <div className="t-val">{stats.v_gaze.toFixed(2)}</div>
            </div>
          </div>

          <div className="gauges-row">
            {/* DROWSY */}
            <div className={`gauge-container ${isDrowsyActive ? 'gauge-danger-active' : 'gauge-danger'}`}>
              <div className="gauge-circle">
                <svg viewBox="0 0 100 100" className="gauge-svg">
                  <circle cx="50" cy="50" r="45" className="gauge-bg" />
                  <circle cx="50" cy="50" r="45" className="gauge-progress" strokeDasharray="283" strokeDashoffset={283 - (Math.min(10, stats.current_drowsy_score)/10)*283} />
                </svg>
                <div className="gauge-content">
                  <div className="g-title">DROWSY</div>
                  <div className="g-value">{stats.current_drowsy_score}</div>
                  <div className="g-max">/ 10</div>
                  <div className="g-icon"><Icons.Warning color={isDrowsyActive ? '#ff0d00' : '#444'} width="24" height="24" /></div>
                </div>
              </div>
            </div>

            {/* PHONE USAGE */}
            <div className={`gauge-container ${isPhoneActive ? 'gauge-cyan-active' : 'gauge-cyan'}`}>
              <div className="gauge-circle">
                <svg viewBox="0 0 100 100" className="gauge-svg">
                  <circle cx="50" cy="50" r="45" className="gauge-bg" />
                  <circle cx="50" cy="50" r="45" className="gauge-progress" strokeDasharray="283" strokeDashoffset={283 - (Math.min(12, stats.current_phone_score)/12)*283} />
                </svg>
                <div className="gauge-content">
                  <div className="g-title">PHONE USAGE</div>
                  <div className="g-value">{stats.current_phone_score}</div>
                  <div className="g-max">/ 12</div>
                  <div className="g-icon"><Icons.Phone color={isPhoneActive ? '#00e5ff' : '#444'} width="24" height="24" /></div>
                </div>
              </div>
            </div>

            {/* SIDE EYE */}
            <div className={`gauge-container ${isSideActive ? 'gauge-green-active' : 'gauge-green'}`}>
              <div className="gauge-circle">
                <svg viewBox="0 0 100 100" className="gauge-svg">
                  <circle cx="50" cy="50" r="45" className="gauge-bg" />
                  <circle cx="50" cy="50" r="45" className="gauge-progress" strokeDasharray="283" strokeDashoffset={283 - (Math.min(75, stats.current_side_score)/75)*283} />
                </svg>
                <div className="gauge-content">
                  <div className="g-title">SIDE EYE</div>
                  <div className="g-value">{stats.current_side_score}</div>
                  <div className="g-max">/ 75</div>
                  <div className="g-icon"><Icons.Eye color={isSideActive ? '#00ff33' : '#444'} width="24" height="24" /></div>
                </div>
              </div>
            </div>
          </div>

          <div className="progress-bars">
            <div className="progress-row">
              <div className="p-text">DROWSY COUNT</div>
              <div className="p-text-val highlight-red">{stats.drowsy_events} / 10</div>
            </div>
            <div className="progress-bar-bg"><div className="progress-bar-fill red-fill" style={{width: `${Math.min(100, (stats.drowsy_events/10)*100)}%`}}></div></div>

            <div className="progress-row">
              <div className="p-text">PHONE USAGE</div>
              <div className="p-text-val highlight-cyan">{stats.phone_events} / 12</div>
            </div>
            <div className="progress-bar-bg"><div className="progress-bar-fill cyan-fill" style={{width: `${Math.min(100, (stats.phone_events/12)*100)}%`}}></div></div>

            <div className="progress-row">
              <div className="p-text">SEAT BELT</div>
              <div className="p-text-val highlight-green">FASTENED</div>
            </div>
            <div className="progress-bar-bg"><div className="progress-bar-fill green-fill" style={{width: `100%`}}></div></div>

            <div className="progress-row">
              <div className="p-text">DISTRACTION LEVEL</div>
              <div className="p-text-val highlight-green">LOW</div>
            </div>
            <div className="progress-bar-bg"><div className="progress-bar-fill green-fill" style={{width: `20%`}}></div></div>
          </div>

          <div className="bottom-actions">
            <div className={`action-card alarm-card ${isAnyAlarmRinging ? 'ringing' : ''}`}>
              <div className="a-icon"><Icons.Bell color="#ff0d00" width="48" height="48" /></div>
              <div className="a-text">
                <div className="a-title">ALARM</div>
                <div className="a-sub">HIGH ALERT</div>
              </div>
            </div>

            <div className="action-card auto-stop-card" onClick={handleReset} style={{ borderColor: stats.is_emergency_stop ? '#ff0d00' : '' }}>
              <div className="a-icon"><Icons.Wheel color={stats.is_emergency_stop ? "#ff0d00" : "#00e5ff"} width="48" height="48" /></div>
              <div className="a-text">
                <div className="a-title" style={{ color: stats.is_emergency_stop ? "#ff0d00" : "white" }}>
                  {stats.is_emergency_stop ? "RESET SYSTEM" : "AUTO-STOP"}
                </div>
                <div className="a-sub">{stats.is_emergency_stop ? "CLICK TO RESTART" : "SYSTEM OK"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="camera-feed-container">
            <div className="feed-header">
              <div className="f-left"><span className="dot green"></span> LIVE FEED</div>
              <div className="f-right">TRACKING</div>
            </div>
            <div className="feed-sub">1080p / 30fps</div>
            
            <div className="video-wrapper">
              <img src="http://localhost:5000/video_feed" alt="Live Stream" className="camera-image" />
            </div>
            
            <div className="feed-footer">
              <div className="ff-stats">L.EAR: <strong>{stats.l_ear.toFixed(2)}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; R.EAR: <strong>{stats.r_ear.toFixed(2)}</strong> &nbsp;&nbsp;|&nbsp;&nbsp; V.GAZE: <strong>{stats.v_gaze.toFixed(2)}</strong></div>
              <div className="ff-right">FPS: <strong>30</strong> &nbsp;&nbsp;&nbsp;&nbsp; STATUS: <strong className={stats.is_emergency_stop ? "highlight-red" : "highlight-green"}>{stats.is_emergency_stop ? "KILLED" : "OK"}</strong></div>
            </div>
          </div>

          <div className="bottom-status-strip">
            <div className="status-box">
              <Icons.Warning color="#ff0d00" />
              <div className="s-text">
                <div className="s-title">ALERT STATUS</div>
                <div className={`s-val ${isAnyAlarmRinging ? 'highlight-red' : 'highlight-green'}`}>{isAnyAlarmRinging ? 'HIGH RISK' : 'NORMAL'}</div>
              </div>
            </div>

            <div className="status-box center-box">
              <div className="s-title">TOTAL ALERTS</div>
              <div className="s-val huge-red">{stats.drowsy_events + stats.phone_events + stats.side_events}</div>
            </div>

            <div className="status-box right-box">
              <div className="s-text">
                <div className="s-title">SYSTEM STATUS</div>
                <div className="s-val highlight-green">MONITORING ACTIVE</div>
              </div>
              <div className="glow-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;