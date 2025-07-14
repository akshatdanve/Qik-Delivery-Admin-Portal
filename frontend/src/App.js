import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardPage from './pages/DashboardPage';
import DriversPage from './pages/DriversPage';
import ParcelsPage from './pages/ParcelsPage';
import MapPage from './pages/MapPage';
import DriverRoutesPage from './pages/DriverRoutesPage';
import { LoadScript } from '@react-google-maps/api';
import './App.css';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleSoftRefresh = () => setRefreshKey(prev => prev + 1);
  return (
    <Router>
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
        <div className="app-container">
          <Sidebar onSoftRefresh={handleSoftRefresh} />
          <Topbar />
          <div className="main-content">
            <div className="content-area">
              <Routes>
                <Route path="/" element={<DashboardPage key={refreshKey} />} />
                <Route path="/dashboard" element={<DashboardPage key={refreshKey} />} />
                <Route path="/drivers" element={<DriversPage key={refreshKey} />} />
                <Route path="/parcels" element={<ParcelsPage key={refreshKey} />} />
                <Route path="/map" element={<MapPage key={refreshKey} />} />
                <Route path="/driver-routes" element={<DriverRoutesPage key={refreshKey} />} />
              </Routes>
            </div>
          </div>
        </div>
      </LoadScript>
    </Router>
  );
}

export default App;
