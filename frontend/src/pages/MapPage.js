import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Typography, 
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Avatar,
  Tooltip,
  Paper
} from '@mui/material';
import {
  MyLocation as LocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as FullscreenIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import ParcelStats from '../components/ParcelStats';

const containerStyle = {
  width: '100%',
  height: '70vh',
  borderRadius: '12px'
};

const center = {
  lat: 13.082680,
  lng: 80.270718
};

function MapPage() {
  const [parcels, setParcels] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [mapRef, setMapRef] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterParcels();
  }, [parcels, statusFilter, showUnassignedOnly]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [parcelsResponse, driversResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels`),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/drivers`)
      ]);
      setParcels(parcelsResponse.data);
      setDrivers(driversResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterParcels = () => {
    let filtered = parcels.filter(parcel => 
      parcel.latitude && parcel.longitude
    );

    if (statusFilter !== 'All') {
      filtered = filtered.filter(parcel => 
        parcel.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (showUnassignedOnly) {
      filtered = filtered.filter(parcel => 
        parcel.status === 'unassigned'
      );
    }

    setFilteredParcels(filtered);
  };

  const getMarkerIcon = (status) => {
    const icons = {
      'unassigned': {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      'assigned': {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      'in_transit': {
        url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      'completed': {
        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      'pending': {
        url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
        scaledSize: new window.google.maps.Size(40, 40)
      }
    };
    return icons[status] || icons['unassigned'];
  };

  const getStatusChip = (status) => {
    const configs = {
      'unassigned': { label: 'Unassigned', color: 'error' },
      'assigned': { label: 'Assigned', color: 'primary' },
      'in_transit': { label: 'In Transit', color: 'warning' },
      'completed': { label: 'Completed', color: 'success' },
      'pending': { label: 'Pending', color: 'secondary' }
    };
    const config = configs[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const handleMapLoad = (map) => {
    setMapRef(map);
  };

  const centerToUserLocation = () => {
    if (navigator.geolocation && mapRef) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        mapRef.panTo(userLocation);
        mapRef.setZoom(14);
      });
    }
  };

  const handleAssignDriver = async (parcelId, driverId) => {
    try {
      // If driverId is empty, unassign the driver instead
      if (!driverId || driverId === '') {
        await handleUnassignDriver(parcelId);
        return;
      }
      
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels/${parcelId}/assign`, { driver_id: driverId });
      fetchData(); // Refresh data to show updated assignment
      showAlert('Driver assigned successfully!', 'success');
      setSelectedParcel(null); // Close the info window
    } catch (error) {
      showAlert('Error assigning driver', 'error');
    }
  };

  const handleUnassignDriver = async (parcelId) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels/${parcelId}/unassign`);
      fetchData(); // Refresh data to show updated assignment
      showAlert('Driver unassigned successfully!', 'success');
      setSelectedParcel(null); // Close the info window
    } catch (error) {
      showAlert('Error unassigning driver', 'error');
    }
  };

  const handleStatusUpdate = async (parcelId, newStatus) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels/${parcelId}/status`, { status: newStatus });
      fetchData(); // Refresh data to show updated status
      showAlert(`Status updated to ${newStatus.replace('_', ' ')}!`, 'success');
      setSelectedParcel(null); // Close the info window
    } catch (error) {
      showAlert('Error updating status', 'error');
    }
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4000);
  };

  const statusCounts = {
    total: filteredParcels.length,
    unassigned: filteredParcels.filter(p => p.status === 'unassigned').length,
    assigned: filteredParcels.filter(p => p.status === 'assigned').length,
    in_transit: filteredParcels.filter(p => p.status === 'in_transit').length,
    completed: filteredParcels.filter(p => p.status === 'completed').length,
    pending: filteredParcels.filter(p => p.status === 'pending').length
  };

  return (
    <Box className="fade-in">
      {/* Alert */}
      {alert.show && (
        <Alert 
          severity={alert.severity} 
          sx={{ mb: 2 }}
          onClose={() => setAlert({ show: false, message: '', severity: 'success' })}
        >
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1f2937', mb: 1 }}>
          Delivery Map View
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Real-time parcel locations and delivery tracking
        </Typography>
      </Box>

      {/* Centered Parcel Statistics */}
      <ParcelStats parcelsData={parcels} driversData={drivers} />

      {/* Map-specific Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }} justifyContent="center">
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
              {statusCounts.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              On Map
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ef4444' }}>
              {statusCounts.unassigned}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Unassigned
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
              {statusCounts.assigned}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Assigned
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f59e0b' }}>
              {statusCounts.in_transit}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              In Transit
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#10b981' }}>
              {statusCounts.completed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>
              {statusCounts.pending}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Map Controls */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All">All Status</MenuItem>
                  <MenuItem value="Unassigned">Unassigned</MenuItem>
                  <MenuItem value="Assigned">Assigned</MenuItem>
                  <MenuItem value="In_transit">In Transit</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showUnassignedOnly}
                    onChange={(e) => setShowUnassignedOnly(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Unassigned Only"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Tooltip title="Refresh Data">
                  <IconButton 
                    onClick={fetchData} 
                    disabled={loading}
                    sx={{ 
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' },
                      width: 40,
                      height: 40
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Center to My Location">
                  <IconButton 
                    onClick={centerToUserLocation}
                    sx={{ 
                      bgcolor: 'rgba(102, 126, 234, 0.1)',
                      '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' },
                      width: 40,
                      height: 40
                    }}
                  >
                    <LocationIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card sx={{ borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <Box sx={{ 
          p: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Live Delivery Map
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {filteredParcels.length} parcels displayed • Real-time tracking
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={12}
            onLoad={handleMapLoad}
            options={{
              styles: [
                {
                  featureType: 'poi',
                  elementType: 'labels',
                  stylers: [{ visibility: 'off' }]
                }
              ],
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: true,
              mapTypeControl: true,
              fullscreenControl: true
            }}
          >
            {filteredParcels.map(parcel => (
              <Marker
                key={parcel.id}
                position={{ 
                  lat: parseFloat(parcel.latitude), 
                  lng: parseFloat(parcel.longitude) 
                }}
                icon={getMarkerIcon(parcel.status)}
                onClick={() => setSelectedParcel(parcel)}
                animation={parcel.status === 'in_transit' ? window.google.maps.Animation.BOUNCE : null}
              />
            ))}

            {selectedParcel && (
              <InfoWindow
                position={{
                  lat: parseFloat(selectedParcel.latitude),
                  lng: parseFloat(selectedParcel.longitude)
                }}
                onCloseClick={() => setSelectedParcel(null)}
              >
                <Box sx={{ p: 1, minWidth: '250px' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {selectedParcel.customer_name}
                  </Typography>
                  
                  <Box sx={{ mb: 1 }}>
                    {getStatusChip(selectedParcel.status)}
                  </Box>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Phone:</strong> {selectedParcel.phone_number}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Weight:</strong> {selectedParcel.weight} kg
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>PIN:</strong> {selectedParcel.pin_code}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Address:</strong> {selectedParcel.address}
                  </Typography>
                  
                  {/* Status Update Section */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      Update Status:
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedParcel.status}
                        onChange={(e) => handleStatusUpdate(selectedParcel.id, e.target.value)}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        <MenuItem value="unassigned">Unassigned</MenuItem>
                        <MenuItem value="assigned">Assigned</MenuItem>
                        <MenuItem value="in_transit">In Transit</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  {selectedParcel.assigned_driver_id ? (
                    <Box sx={{ 
                      bgcolor: '#f0f9ff', 
                      p: 1, 
                      borderRadius: 1,
                      border: '1px solid #bfdbfe',
                      mb: 1
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
                          Assigned: {
                          drivers.find(driver => driver.id === selectedParcel.assigned_driver_id)?.full_name || 'Unknown'
                        }
                        </Typography>
                        <IconButton 
                          size="small"
                          onClick={() => handleUnassignDriver(selectedParcel.id)}
                          sx={{ color: '#ef4444', ml: 1 }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Assign Driver:
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value=""
                          displayEmpty
                          onChange={(e) => handleAssignDriver(selectedParcel.id, e.target.value)}
                          sx={{ fontSize: '0.875rem' }}
                        >
                          <MenuItem value="" disabled>
                            <em>Select Driver</em>
                          </MenuItem>
                          {drivers.filter(driver => driver.is_active).map(driver => (
                            <MenuItem key={driver.id} value={driver.id}>
                              {driver.full_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </Box>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </Card>

      {/* Legend */}
      <Card sx={{ borderRadius: 3, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Map Legend
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#ef4444', borderRadius: '50%' }} />
                <Typography variant="body2">Unassigned</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#3b82f6', borderRadius: '50%' }} />
                <Typography variant="body2">Assigned</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#f59e0b', borderRadius: '50%' }} />
                <Typography variant="body2">In Transit</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#10b981', borderRadius: '50%' }} />
                <Typography variant="body2">Completed</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#8b5cf6', borderRadius: '50%' }} />
                <Typography variant="body2">Pending</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default MapPage;
