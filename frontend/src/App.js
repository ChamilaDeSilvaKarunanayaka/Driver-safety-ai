import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  // Main dashboard state variables matching backend keys
  const [stats, setStats] = useState({
    drowsy_events: 0,
    phone_events: 0,
    side_events: 0,
    current_drowsy_score: 0,
    current_phone_score: 0,
    current_side_score: 0,
    l_ear: 0.0,
    r_ear: 0.0,
    v_gaze: 0.0
  });

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // 1. Fetch live telemetry data from Flask API
    const interval = setInterval(() => {
      axios.get('http://localhost:5000/api/stats')
        .then(res => setStats(res.data))
        .catch(err => console.log("API Connection Error", err));
    }, 200); // 200ms rapid scanning rate for ultra-responsive gauges

    // 2. Track clock time for top digital dashboard widget
    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  // Determine critical alert states based on counters
  const isDrowsyAlertActive = stats.current_drowsy_score >= 10;
  const isPhoneAlertActive = stats.current_phone_score >= 12;
  const isAnyAlertTriggered = isDrowsyAlertActive || isPhoneAlertActive || (stats.current_side_score >= 75);

  // Auto-Stop Safety Logic: If aggregate alert counters exceed 3, engage safety break protocols
  const totalFails = stats.drowsy_events + stats.phone_events + stats.side_events;
  const isAutoStopEngaged = totalFails >= 3;

  return (
    <div style={styles.dashboardContainer}>
      
      {/* ====================================================
          TOP NOTCH HEAD BAR - DRIVING MODE INDICATOR
         ==================================================== */}
      <div style={styles.topHeader}>
        <div style={styles.brandTitle}>AUDI VIRTUAL SAFETY SUITE</div>
        
        {/* Driving Mode active status bar with automated pulsing indicator */}
        <div style={{
          ...styles.drivingModeBar,
          borderColor: isAutoStopEngaged ? '#ff0033' : '#00ff66',
          boxShadow: isAutoStopEngaged ? '0 0 15px rgba(255, 0, 51, 0.4)' : '0 0 15px rgba(0, 255, 102, 0.4)'
        }}>
          <span style={{
            ...styles.pulseDot,
            backgroundColor: isAutoStopEngaged ? '#ff0033' : '#00ff66',
            animation: 'ping 1.5s infinite'
          }}></span>
          <span style={{ color: isAutoStopEngaged ? '#ff0033' : '#00ff66', fontWeight: 'bold', letterSpacing: '2px' }}>
            {isAutoStopEngaged ? "EMERGENCY SYSTEM STOPPED" : "DRIVING MODE ACTIVE"}
          </span>
        </div>

        <div style={styles.topRightWidgets}>
          <span>{currentTime}</span>
          <span style={{ marginLeft: '15px', color: '#00ff66' }}>4G 📶</span>
        </div>
      </div>

      {/* ====================================================
          MAIN DASHBOARD SPLIT GRID SYSTEM
         ==================================================== */}
      <div style={styles.mainGrid}>
        
        {/* LEFT COLUMN: VEHICLE METRICS PANEL */}
        <div style={styles.leftControlPanel}>
          <div style={styles.panelTitle}>DRIVER SAFETY TELEMETRY</div>
          
          {/* Micro Telemetry Metric Cards */}
          <div style={styles.microRow}>
            <div style={styles.microCard}><h5>L.EAR</h5><p>{stats.l_ear}</p></div>
            <div style={styles.microCard}><h5>R.EAR</h5><p>{stats.r_ear}</p></div>
            <div style={styles.microCard}><h5>V.GAZE</h5><p>{stats.v_gaze}</p></div>
          </div>

          {/* FUTURISTIC CIRCULAR GAUGES MATRIX */}
          <div style={styles.gaugeContainerRow}>
            {/* Drowsy Circular Dial Progress Widget */}
            <div style={styles.gaugeWrapper}>
              <div style={{
                ...styles.circularGaugeOuter,
                borderColor: isDrowsyAlertActive ? '#ff0033' : '#00e5ff',
                boxShadow: isDrowsyAlertActive ? '0 0 20px #ff0033' : 'none'
              }}>
                <div style={styles.gaugeInnerContent}>
                  <span style={styles.gaugeLabel}>DROWSY</span>
                  <span style={{...styles.gaugeValue, color: isDrowsyAlertActive ? '#ff0033' : '#fff'}}>
                    {stats.current_drowsy_score}
                  </span>
                  <span style={styles.gaugeMax}>/ 10</span>
                </div>
              </div>
            </div>

            {/* Phone Usage Circular Dial Progress Widget */}
            <div style={styles.gaugeWrapper}>
              <div style={{
                ...styles.circularGaugeOuter,
                borderColor: isPhoneAlertActive ? '#ff0033' : '#00e5ff',
                boxShadow: isPhoneAlertActive ? '0 0 20px #ff0033' : 'none'
              }}>
                <div style={styles.gaugeInnerContent}>
                  <span style={styles.gaugeLabel}>PHONE</span>
                  <span style={{...styles.gaugeValue, color: isPhoneAlertActive ? '#ff0033' : '#fff'}}>
                    {stats.current_phone_score}
                  </span>
                  <span style={styles.gaugeMax}>/ 12</span>
                </div>
              </div>
            </div>
          </div>

          {/* LINEAR PROGRESS STATE ATTRIBUTES */}
          <div style={styles.linearStatusSection}>
            <div style={styles.linearRow}>
              <span>DROWSY EVENT TOTAL</span>
              <span style={{color: '#ff3333'}}>{stats.drowsy_events}</span>
            </div>
            <div style={styles.linearRow}>
              <span>PHONE EVENT TOTAL</span>
              <span style={{color: '#ffcc00'}}>{stats.phone_events}</span>
            </div>
            <div style={styles.linearRow}>
              <span>DISTRACTION LEVEL</span>
              <span style={{ color: isAnyAlertTriggered ? '#ff0033' : '#00ff66' }}>
                {isAnyAlertTriggered ? "HIGH RISK" : "MINIMAL / LOW"}
              </span>
            </div>
          </div>

          {/* CONTROL BOTTOM EMERGENCY ACTION INDICATOR ICONS */}
          <div style={styles.bottomIconRow}>
            {/* Alarm Siren Indicator Box */}
            <div style={{
              ...styles.actionCard,
              borderColor: isAnyAlertTriggered ? '#ff0033' : '#222',
              backgroundColor: isAnyAlertTriggered ? 'rgba(255, 0, 51, 0.15)' : '#0d0d0d',
              animation: isAnyAlertTriggered ? 'blink 0.8s infinite alternate' : 'none'
            }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🚨</span>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>ALARM STATUS</div>
                <div style={{ fontSize: '13px', color: isAnyAlertTriggered ? '#ff0033' : '#fff', fontWeight: 'bold' }}>
                  {isAnyAlertTriggered ? "CRITICAL ALERT" : "SYSTEM OK"}
                </div>
              </div>
            </div>

            {/* Auto-Break System Trigger Action Icon */}
            <div style={{
              ...styles.actionCard,
              borderColor: isAutoStopEngaged ? '#ffcc00' : '#222',
              backgroundColor: isAutoStopEngaged ? 'rgba(255, 204, 0, 0.15)' : '#0d0d0d'
            }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🛑</span>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>AUTO-STOP</div>
                <div style={{ fontSize: '13px', color: isAutoStopEngaged ? '#ffcc00' : '#fff', fontWeight: 'bold' }}>
                  {isAutoStopEngaged ? "ENGAGED / BREAK" : "STANDBY"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CORE CAMERA FEED COMPONENT MONITOR */}
        <div style={styles.rightFeedPanel}>
          <div style={styles.feedHeaderRow}>
            <div>🔴 LIVE CAMERA SCANNER FEED</div>
            <div style={{ color: '#00ff66', fontSize: '12px' }}>● TRACKING ACTIVE</div>
          </div>
          
          <div style={styles.videoWindowFrame}>
            {/* Main Streaming Feed Video Interface Frame */}
            <img 
              src="http://localhost:5000/video_feed" 
              alt="Automotive Computer Vision Tracker Engine" 
              style={styles.responsiveImageFeed} 
            />
          </div>
          
          {/* Lower Summary Footer Layout status display panel */}
          <div style={styles.summaryFooterStrip}>
            <div>RISK ASSESSMENT: <span style={{color: isAnyAlertTriggered ? '#ff0033' : '#00ff66'}}>{isAnyAlertTriggered ? "WARNING" : "SAFE"}</span></div>
            <div>TOTAL SYSTEM ALERTS RECORDED: <span style={{color: '#ff3333', fontSize: '16px', fontWeight: 'bold'}}>{totalFails}</span></div>
          </div>
        </div>

      </div>

      {/* Global Embedded Animations Style Tag */}
      <style>{`
        @keyframes ping {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes blink {
          0% { opacity: 0.4; border-color: #555; }
          100% { opacity: 1; border-color: #ff0033; box-shadow: 0 0 10px rgba(255,0,51,0.5); }
        }
      `}</style>

    </div>
  );
}

// ====================================================
// UX STYLESHEET OBJECT MAP (PREMIUM CARBON TEXTURE DARK MODE)
// ====================================================
const styles = {
  dashboardContainer: {
    backgroundColor: '#050506',
    color: '#ffffff',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '15px',
    boxSizing: 'border-box'
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #15161a',
    paddingBottom: '12px',
    marginBottom: '15px'
  },
  brandTitle: {
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '3px',
    color: '#a3a6b5'
  },
  drivingModeBar: {
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '8px 30px',
    borderRadius: '30px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0b0c10',
    fontSize: '13px'
  },
  pulseDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '12px',
    display: 'inline-block'
  },
  topRightWidgets: {
    fontSize: '13px',
    color: '#8e92a3',
    letterSpacing: '1px'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.6fr',
    gap: '20px',
    alignItems: 'stretch'
  },
  leftControlPanel: {
    backgroundColor: '#0a0b0d',
    border: '1px solid #161920',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  panelTitle: {
    fontSize: '12px',
    letterSpacing: '2px',
    color: '#65697a',
    fontWeight: 'bold',
    marginBottom: '15px'
  },
  microRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '10px',
    marginBottom: '20px'
  },
  microCard: {
    backgroundColor: '#111318',
    border: '1px solid #1c1f26',
    borderRadius: '6px',
    padding: '8px',
    textAlign: 'center',
    h5: { margin: '0 0 4px 0', fontSize: '10px', color: '#555' },
    p: { margin: '0', fontSize: '14px', fontWeight: 'bold', color: '#00e5ff' }
  },
  gaugeContainerRow: {
    display: 'flex',
    justifyContent: 'space-around',
    margin: '15px 0'
  },
  gaugeWrapper: {
    textAlign: 'center'
  },
  circularGaugeOuter: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    borderWidth: '4px',
    borderStyle: 'solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d0f13',
    transition: 'all 0.3s ease'
  },
  gaugeInnerContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  gaugeLabel: {
    fontSize: '9px',
    color: '#6c7282',
    letterSpacing: '1px'
  },
  gaugeValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '2px 0'
  },
  gaugeMax: {
    fontSize: '10px',
    color: '#494f5c'
  },
  linearStatusSection: {
    backgroundColor: '#111318',
    borderRadius: '8px',
    padding: '12px',
    margin: '15px 0',
    border: '1px solid #1c1f26'
  },
  linearRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    padding: '6px 0',
    borderBottom: '1px solid #1c1f26',
    color: '#bcbfc4'
  },
  bottomIconRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginTop: '10px'
  },
  actionCard: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s ease'
  },
  rightFeedPanel: {
    backgroundColor: '#0a0b0d',
    border: '1px solid #161920',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  feedHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    letterSpacing: '1px',
    color: '#a3a6b5',
    marginBottom: '12px'
  },
  videoWindowFrame: {
    backgroundColor: '#000',
    border: '2px solid #1c1f26',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  responsiveImageFeed: {
    width: '100%',
    height: 'auto',
    maxHeight: '480px',
    display: 'block'
  },
  summaryFooterStrip: {
    backgroundColor: '#111318',
    border: '1px solid #1c1f26',
    borderRadius: '8px',
    padding: '15px',
    marginTop: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#bcbfc4'
  }
};

export default App;