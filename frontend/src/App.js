import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [stats, setStats] = useState({
    drowsy_events: 0,
    phone_events: 0,
    side_events: 0,
    current_drowsy_score: 0,
    current_phone_score: 0,
    current_side_score: 0,
    l_ear: 0.0,
    r_ear: 0.0,
    v_gaze: 0.0,
    is_emergency_stop: false
  });

  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Rapid polling loop to track responsive gauge changes
    const interval = setInterval(() => {
      axios.get('http://localhost:5000/api/stats')
        .then(res => setStats(res.data))
        .catch(err => console.log("Backend offline", err));
    }, 200);

    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  // UI Active State evaluation parameters
  const isDrowsyActive = stats.current_drowsy_score >= 10;
  const isPhoneActive = stats.current_phone_score >= 12;
  const isSideActive = stats.current_side_score >= 75;
  const isAnyAlarmRinging = isDrowsyActive || isPhoneActive || isSideActive;

  // Handler to clear hard system lockdown via backend trigger route
  const handleSystemReset = () => {
    axios.post('http://localhost:5000/api/reset')
      .then(() => console.log("System override approved. Driving mode restored."));
  };

  return (
    <div style={styles.dashboardContainer}>
      
      {/* ====================================================
          TOP NOTCH HEAD BAR - AUTO-RESET DRIVING MODES
         ==================================================== */}
      <div style={styles.topHeader}>
        <div style={styles.brandTitle}>MBUX LUXURY INTELLIGENCE</div>
        
        <div style={{
          ...styles.drivingModeBar,
          borderColor: stats.is_emergency_stop ? '#ff0033' : isAnyAlarmRinging ? '#ffcc00' : '#00ff66',
          boxShadow: stats.is_emergency_stop ? '0 0 15px #ff0033' : isAnyAlarmRinging ? '0 0 15px #ffcc00' : '0 0 15px #00ff66'
        }}>
          <span style={{
            ...styles.pulseDot,
            backgroundColor: stats.is_emergency_stop ? '#ff0033' : isAnyAlarmRinging ? '#ffcc00' : '#00ff66',
            animation: 'ping 1.2s infinite'
          }}></span>
          <span style={{ color: stats.is_emergency_stop ? '#ff0033' : isAnyAlarmRinging ? '#ffcc00' : '#00ff66', fontWeight: 'bold', letterSpacing: '2px' }}>
            {stats.is_emergency_stop ? "EMERGENCY SHUTDOWN: 3 FAILS IN 15S" : isAnyAlarmRinging ? "WARNING: ALARM ACTIVE" : "DRIVING MODE ACTIVE"}
          </span>
        </div>

        <div style={styles.topRightWidgets}>
          <span>{currentTime}</span>
          <span style={{ marginLeft: '15px', color: '#00ff66' }}>ONLINE 📶</span>
        </div>
      </div>

      {/* ====================================================
          MAIN DASHBOARD SPLIT GRID SYSTEM
         ==================================================== */}
      <div style={styles.mainGrid}>
        
        {/* LEFT COLUMN: GAUGE GRID PANELS */}
        <div style={styles.leftControlPanel}>
          <div style={styles.panelTitle}>BIOMETRIC VISION TELEMETRY</div>
          
          <div style={styles.microRow}>
            <div style={styles.microCard}><h5>L.EAR</h5><p>{stats.l_ear}</p></div>
            <div style={styles.microCard}><h5>R.EAR</h5><p>{stats.r_ear}</p></div>
            <div style={styles.microCard}><h5>V.GAZE</h5><p>{stats.v_gaze}</p></div>
          </div>

          {/* FUTURISTIC THREE-GAUGE COMPACT MATRIX */}
          <div style={styles.gaugeContainerRow}>
            
            {/* Drowsy Meter */}
            <div style={styles.gaugeWrapper}>
              <div style={{
                ...styles.circularGaugeOuter,
                borderColor: isDrowsyActive ? '#ff0033' : '#00e5ff',
                boxShadow: isDrowsyActive ? '0 0 15px #ff0033' : 'none'
              }}>
                <div style={styles.gaugeInnerContent}>
                  <span style={styles.gaugeLabel}>DROWSY</span>
                  <span style={{...styles.gaugeValue, color: isDrowsyActive ? '#ff0033' : '#fff'}}>{stats.current_drowsy_score}</span>
                  <span style={styles.gaugeMax}>/ 10</span>
                </div>
              </div>
            </div>

            {/* Phone Meter */}
            <div style={styles.gaugeWrapper}>
              <div style={{
                ...styles.circularGaugeOuter,
                borderColor: isPhoneActive ? '#ff0033' : '#00e5ff',
                boxShadow: isPhoneActive ? '0 0 15px #ff0033' : 'none'
              }}>
                <div style={styles.gaugeInnerContent}>
                  <span style={styles.gaugeLabel}>PHONE</span>
                  <span style={{...styles.gaugeValue, color: isPhoneActive ? '#ff0033' : '#fff'}}>{stats.current_phone_score}</span>
                  <span style={styles.gaugeMax}>/ 12</span>
                </div>
              </div>
            </div>

            {/* ADDED: Side Distraction Meter */}
            <div style={styles.gaugeWrapper}>
              <div style={{
                ...styles.circularGaugeOuter,
                borderColor: isSideActive ? '#ff0033' : '#00e5ff',
                boxShadow: isSideActive ? '0 0 15px #ff0033' : 'none'
              }}>
                <div style={styles.gaugeInnerContent}>
                  <span style={styles.gaugeLabel}>SIDE EYE</span>
                  <span style={{...styles.gaugeValue, color: isSideActive ? '#ff0033' : '#fff'}}>{stats.current_side_score}</span>
                  <span style={styles.gaugeMax}>/ 75</span>
                </div>
              </div>
            </div>

          </div>

          <div style={styles.linearStatusSection}>
            <div style={styles.linearRow}><span>DROWSY EVENTS SIGNALS</span><span style={{color: '#ff3333'}}>{stats.drowsy_events}</span></div>
            <div style={styles.linearRow}><span>PHONE EVENTS SIGNALS</span><span style={{color: '#ffcc00'}}>{stats.phone_events}</span></div>
            <div style={styles.linearRow}><span>SIDE DISTRACT EVENTS</span><span style={{color: '#bc00ff'}}>{stats.side_events}</span></div>
          </div>

          <div style={styles.bottomIconRow}>
            {/* Alarm Siren Box Component */}
            <div style={{
              ...styles.actionCard,
              borderColor: isAnyAlarmRinging ? '#ff0033' : '#222',
              backgroundColor: isAnyAlarmRinging ? 'rgba(255, 0, 51, 0.15)' : '#0d0d0d',
              animation: isAnyAlarmRinging ? 'blink 0.5s infinite alternate' : 'none'
            }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🚨</span>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>SIREN STATUS</div>
                <div style={{ fontSize: '13px', color: isAnyAlarmRinging ? '#ff0033' : '#fff', fontWeight: 'bold' }}>
                  {isAnyAlarmRinging ? "SOUNDING ALARM" : "SILENT READY"}
                </div>
              </div>
            </div>

            {/* Emergency Lockdown Stop Component Box */}
            <div style={{
              ...styles.actionCard,
              borderColor: stats.is_emergency_stop ? '#ffcc00' : '#222',
              backgroundColor: stats.is_emergency_stop ? 'rgba(255, 204, 0, 0.2)' : '#0d0d0d'
            }}>
              <span style={{ fontSize: '24px', marginRight: '10px' }}>🛑</span>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>AUTO-LOCK</div>
                <div style={{ fontSize: '13px', color: stats.is_emergency_stop ? '#ffcc00' : '#fff', fontWeight: 'bold' }}>
                  {stats.is_emergency_stop ? "ENGINE KILLED" : "STANDBY OK"}
                </div>
              </div>
            </div>
          </div>

          {/* Manual Reset button visible during critical lockouts */}
          {stats.is_emergency_stop && (
            <button onClick={handleSystemReset} style={styles.overrideButton}>
              MANUAL SYSTEM OVERRIDE / RESET ENGINE
            </button>
          )}

        </div>

        {/* RIGHT COLUMN: REFRESHED LIVE FEED */}
        <div style={styles.rightFeedPanel}>
          <div style={styles.feedHeaderRow}>
            <div>🔴 HIGH-DEFINITION INFOTAINMENT CONSOLE STREAM</div>
            <div style={{ color: isAnyAlarmRinging ? '#ff0033' : '#00ff66', fontSize: '12px' }}>
              {isAnyAlarmRinging ? "⚠️ THREAT DETECTED" : "● SYSTEM HEALTHY"}
            </div>
          </div>
          
          <div style={styles.videoWindowFrame}>
            <img src="http://localhost:5000/video_feed" alt="Biometric Vector Feed" style={styles.responsiveImageFeed} />
          </div>
          
          <div style={styles.summaryFooterStrip}>
            <div>SAFETY BOUND: <span style={{color: isAnyAlarmRinging ? '#ff0033' : '#00ff66'}}>{isAnyAlarmRinging ? "RISK HIGHLIGHT" : "SECURE"}</span></div>
            <div>STATUS: <span style={{color: '#00e5ff'}}>{stats.is_emergency_stop ? "LOCKED" : "MONITORING"}</span></div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes ping {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes blink {
          0% { background-color: rgba(13,15,19,0.8); }
          100% { background-color: rgba(255, 0, 51, 0.25); box-shadow: 0 0 15px rgba(255,0,51,0.6); }
        }
      `}</style>

    </div>
  );
}

// ====================================================
// DESIGN STYLE ARCHITECTURE (AUDI COCKPIT BLACK MATRIX)
// ====================================================
const styles = {
  dashboardContainer: { backgroundColor: '#040405', color: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif', padding: '15px', boxSizing: 'border-box' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #121317', paddingBottom: '12px', marginBottom: '15px' },
  brandTitle: { fontSize: '13px', fontWeight: 'bold', letterSpacing: '3px', color: '#7a7e8c' },
  drivingModeBar: { border: '1px solid', padding: '8px 25px', borderRadius: '30px', display: 'flex', alignItems: 'center', backgroundColor: '#08090c', fontSize: '12px' },
  pulseDot: { width: '8px', height: '8px', borderRadius: '50%', marginRight: '12px', display: 'inline-block' },
  topRightWidgets: { fontSize: '12px', color: '#767a8a' },
  mainGrid: { display: 'grid', gridTemplateColumns: '1.2fr 1.4fr', gap: '20px' },
  leftControlPanel: { backgroundColor: '#08090c', border: '1px solid #14161f', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' },
  panelTitle: { fontSize: '11px', letterSpacing: '2px', color: '#565a69', fontWeight: 'bold', marginBottom: '15px' },
  microRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' },
  microCard: { 
    backgroundColor: '#0f1117', border: '1px solid #1c1f2b', borderRadius: '6px', padding: '6px', textAlign: 'center',
    h5: { margin: '0', fontSize: '9px', color: '#555' }, p: { margin: '0', fontSize: '13px', fontWeight: 'bold', color: '#00e5ff' }
  },
  gaugeContainerRow: { display: 'flex', justifyContent: 'space-between', margin: '15px 0', gap: '10px' },
  gaugeWrapper: { flex: 1, display: 'flex', justifyContent: 'center' },
  circularGaugeOuter: { width: '105px', height: '105px', borderRadius: '50%', borderWidth: '3px', borderStyle: 'solid', display: 'flex', alignItems: 'center', justifyCenter: 'center', backgroundColor: '#0b0d12', transition: 'all 0.2s ease', justifyContent: 'center' },
  gaugeInnerContent: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  gaugeLabel: { fontSize: '8px', color: '#5a6070', letterSpacing: '1px' },
  gaugeValue: { fontSize: '24px', fontWeight: 'bold', margin: '2px 0' },
  gaugeMax: { fontSize: '9px', color: '#414654' },
  linearStatusSection: { backgroundColor: '#0f1117', borderRadius: '8px', padding: '12px', margin: '10px 0', border: '1px solid #1c1f2b' },
  linearRow: { display: 'flex', justifyBetween: 'space-between', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', color: '#a2a6b0' },
  bottomIconRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '10px' },
  actionCard: { border: '1px solid', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center' },
  overrideButton: { marginTop: '15px', padding: '12px', backgroundColor: '#ff0033', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '1px' },
  rightFeedPanel: { backgroundColor: '#08090c', border: '1px solid #14161f', borderRadius: '12px', padding: '20px' },
  feedHeaderRow: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7a7e8c', marginBottom: '12px' },
  videoWindowFrame: { backgroundColor: '#000', border: '1px solid #1c1f2b', borderRadius: '8px', overflow: 'hidden' },
  responsiveImageFeed: { width: '100%', height: 'auto', display: 'block' },
  summaryFooterStrip: { backgroundColor: '#0f1117', border: '1px solid #1c1f2b', borderRadius: '8px', padding: '12px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }
};

export default App;