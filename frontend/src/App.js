import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [stats, setStats] = useState({ drowsy: 0, phone: 0, side: 0 });

  useEffect(() => {
    // Fetch stats from Flask every 1 second
    const interval = setInterval(() => {
      axios.get('http://localhost:5000/api/stats')
        .then(res => setStats(res.data));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Driver Safety Dashboard</h1>
      {/* Video Feed */}
      <img src="http://localhost:5000/video_feed" alt="Cam View" width="640" />
      
      {/* Dashboard Stats */}
      <div style={{ marginTop: '20px' }}>
        <h3>Alerts:</h3>
        <p>Drowsy Count: {stats.drowsy}</p>
        <p>Phone Usage: {stats.phone}</p>
      </div>
    </div>
  );
}

export default App;