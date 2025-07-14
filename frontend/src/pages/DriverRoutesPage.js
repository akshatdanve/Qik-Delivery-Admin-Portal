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
  Button,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
  Divider,
  Badge
} from '@mui/material';
import {
  Timeline as RouteIcon,
  Navigation as NavigationIcon,
  Map as MapIcon,
  Person as PersonIcon,
  Inventory as PackageIcon,
  ArrowBack as ArrowBackIcon,
  LocalShipping as TruckIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  CheckCircle as DeliveredIcon,
  PendingActions as PendingIcon,
  DirectionsCar as TransitIcon,
  Error as FailedIcon,
  Home as AddressIcon,
  Receipt as OrderIcon,
  Speed as SpeedIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { GoogleMap, DirectionsService, DirectionsRenderer, Marker, InfoWindow, useLoadScript, Polyline } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const MAX_WAYPOINTS = 23; // Google Directions API limit

const defaultCenter = [13.0827, 80.2707]; // Chennai coordinates

// Route colors for different delivery routes
const routeColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

const libraries = ['places'];

function DriverRoutesPage() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const [drivers, setDrivers] = useState([]);
  const [selectedDriverDetails, setSelectedDriverDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });
  const [mapMode, setMapMode] = useState('overview'); // 'overview', 'routes', or 'individual'
  const [routeCoordinates, setRouteCoordinates] = useState({});

  useEffect(() => {
    fetchDriversData();
  }, []);

  const fetchDriversData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/driver-routes`);
      setDrivers(response.data);
    } catch (error) {
      showAlert('Error fetching drivers data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverRoutes = async (driverId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/driver-routes/${driverId}`);
      setSelectedDriverDetails(response.data);
      
      console.log('🔥 RAW API RESPONSE:', JSON.stringify(response.data, null, 2));
      console.log(`🔍 Driver ${response.data.driver.driver_name} - Total parcels from API:`, response.data.parcels.length);
      
      // Log each individual parcel
      response.data.parcels.forEach((parcel, idx) => {
        console.log(`📦 Parcel ${idx + 1}:`, {
          id: parcel.id,
          customer: parcel.customer_name,
          status: parcel.status,
          lat: parcel.latitude,
          lng: parcel.longitude,
          created: parcel.created_at
        });
      });
      
      // Track used coordinates to prevent overlapping markers
      const usedCoordinates = new Set();
      
      // Function to generate unique coordinates
      const getUniqueCoordinates = (originalLat, originalLng, parcelId) => {
        let lat = parseFloat(originalLat);
        let lng = parseFloat(originalLng);
        
        // Check if coordinates are valid for Chennai CITY area (avoiding sea)
        const isValidCoords = !isNaN(lat) && !isNaN(lng) && 
                             lat >= 12.82 && lat <= 13.25 &&
                             lng >= 80.10 && lng <= 80.22;
        
        if (!isValidCoords) {
          // Use default Chennai coordinates for invalid parcels
          lat = 13.0827;
          lng = 80.2707;
        }
        
        // Create coordinate key (rounded to 4 decimal places to catch near-duplicates)
        const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        
        if (usedCoordinates.has(coordKey)) {
          // Generate unique offset for duplicate coordinates
          const attempts = usedCoordinates.size;
          const angle = (attempts * 51.4285) % 360; // Golden angle for even distribution
          const radius = 0.002 + (attempts * 0.001); // Increasing radius for multiple duplicates
          
          const offsetLat = lat + (radius * Math.cos(angle * Math.PI / 180));
          const offsetLng = lng + (radius * Math.sin(angle * Math.PI / 180));
          
          const newCoordKey = `${offsetLat.toFixed(4)},${offsetLng.toFixed(4)}`;
          usedCoordinates.add(newCoordKey);
          
          console.log(`🔄 DUPLICATE coordinates detected for parcel ${parcelId}! Original: ${lat}, ${lng} → Adjusted: ${offsetLat.toFixed(6)}, ${offsetLng.toFixed(6)}`);
          
          return {
            lat: offsetLat,
            lng: offsetLng,
            isAdjusted: true,
            originalLat: lat,
            originalLng: lng
          };
        } else {
          usedCoordinates.add(coordKey);
          return {
            lat: lat,
            lng: lng,
            isAdjusted: false,
            originalLat: lat,
            originalLng: lng
          };
        }
      };
      
      // Calculate route coordinates for each route
      const routes = {};
      let globalDeliveryIndex = 0; // Global counter for consecutive numbering
      
      console.log('📋 ROUTES DATA:', response.data.routes);
      
      response.data.routes.forEach((route, routeIdx) => {
        console.log(`🛣️ Processing Route ${route.routeId} (index ${routeIdx}) - ${route.parcels.length} parcels`);
        
        const routeCoords = [];
        
        // Add driver starting point
        const driverLat = parseFloat(response.data.driver.driver_latitude);
        const driverLng = parseFloat(response.data.driver.driver_longitude);
        routeCoords.push([driverLat, driverLng]);
        
        // Process parcels for this route
        route.parcels.forEach((parcel, parcelIdx) => {
          globalDeliveryIndex++; // Increment global counter
          console.log(`  📦 Parcel ${parcelIdx + 1} (Global #${globalDeliveryIndex}):`, {
            id: parcel.id,
            customer: parcel.customer_name,
            originalCoords: `${parcel.latitude}, ${parcel.longitude}`,
            status: parcel.status
          });
          
          // Get unique coordinates for this parcel
          const uniqueCoords = getUniqueCoordinates(parcel.latitude, parcel.longitude, parcel.id);
          
          // Store processed coordinates back in parcel object
          parcel.mapLat = uniqueCoords.lat;
          parcel.mapLng = uniqueCoords.lng;
          parcel.isCoordAdjusted = uniqueCoords.isAdjusted;
          parcel.originalLat = uniqueCoords.originalLat;
          parcel.originalLng = uniqueCoords.originalLng;
          parcel.globalDeliveryNumber = globalDeliveryIndex; // Add global number
          
          // Add to route coordinates
          routeCoords.push([uniqueCoords.lat, uniqueCoords.lng]);
        });
        
        routes[route.routeId] = routeCoords;
        console.log(`✅ Route ${route.routeId} processed: ${routeCoords.length} coordinates (including driver start)`);
      });
      
      setRouteCoordinates(routes);
      setMapMode('individual');
    } catch (error) {
      console.error('Error fetching driver routes:', error);
      showAlert('Error fetching driver routes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 3000);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      'delivered': { color: 'success', icon: <DeliveredIcon sx={{ fontSize: 14 }} />, label: 'Delivered' },
      'pending': { color: 'warning', icon: <PendingIcon sx={{ fontSize: 14 }} />, label: 'Pending' },
      'out_for_delivery': { color: 'info', icon: <TransitIcon sx={{ fontSize: 14 }} />, label: 'Out for Delivery' },
      'failed': { color: 'error', icon: <FailedIcon sx={{ fontSize: 14 }} />, label: 'Failed' }
    };
    
    const config = statusConfig[status] || { color: 'default', icon: null, label: status };
    
    return (
      <Chip 
        icon={config.icon}
        label={config.label}
        color={config.color} 
        size="small" 
        sx={{ fontWeight: 'bold' }}
      />
    );
  };

  const closeIndividualMap = () => {
    setSelectedDriverDetails(null);
    setMapMode('overview');
    setRouteCoordinates({});
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateRouteStats = () => {
    if (!selectedDriverDetails) return {};
    
    const stats = {
      totalDeliveries: 0,
      delivered: 0,
      pending: 0,
      outForDelivery: 0,
      failed: 0,
      totalRoutes: selectedDriverDetails.routes.length
    };
    
    selectedDriverDetails.routes.forEach(route => {
      route.parcels.forEach(parcel => {
        stats.totalDeliveries++;
        if (parcel.status === 'delivered') stats.delivered++;
        else if (parcel.status === 'pending') stats.pending++;
        else if (parcel.status === 'out_for_delivery') stats.outForDelivery++;
        else if (parcel.status === 'failed') stats.failed++;
      });
    });
    
    return stats;
  };

  // Individual Driver Map Component
  const IndividualDriverMap = () => {
    const [directionsResults, setDirectionsResults] = useState({});
    const [directionsErrors, setDirectionsErrors] = useState({});
    const [loadingRoutes, setLoadingRoutes] = useState({});
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [useFallbackRoutes, setUseFallbackRoutes] = useState({});

    const routeStats = calculateRouteStats();

    useEffect(() => {
      if (!selectedDriverDetails) return;
      const routes = selectedDriverDetails.routes || [];
      const newLoading = {};
      routes.forEach(route => {
        newLoading[route.routeId] = true;
      });
      setLoadingRoutes(newLoading);
      setDirectionsResults({});
      setDirectionsErrors({});
      setUseFallbackRoutes({});
    }, [selectedDriverDetails]);

    // Helper to build DirectionsService request for a route
    const buildDirectionsRequest = (route) => {
      if (!route || route.parcels.length === 0) {
        console.log(`❌ Invalid route for directions:`, route);
        return null;
      }
      
      // Validate and sanitize coordinates
      const validParcels = route.parcels.filter(parcel =>
        !isNaN(parseFloat(parcel.mapLat)) && !isNaN(parseFloat(parcel.mapLng))
      );
      
      if (validParcels.length === 0) {
        console.log(`❌ No valid parcels found for route ${route.routeId}`);
      return null;
    }
      
      const origin = {
        lat: parseFloat(selectedDriverDetails.driver.driver_latitude),
        lng: parseFloat(selectedDriverDetails.driver.driver_longitude)
      };
      
      const destination = {
        lat: parseFloat(validParcels[validParcels.length - 1].mapLat),
        lng: parseFloat(validParcels[validParcels.length - 1].mapLng)
      };
      
      // Limit waypoints to 23 (Google API limit) - exclude destination from waypoints
      const waypoints = validParcels.slice(0, -1).slice(0, MAX_WAYPOINTS).map(parcel => ({
        location: { lat: parseFloat(parcel.mapLat), lng: parseFloat(parcel.mapLng) },
        stopover: true
      }));
      
      const request = {
        origin,
        destination,
        waypoints,
        travelMode: 'DRIVING',
        optimizeWaypoints: false
      };
      
      console.log(`🗺️ Built directions request for route ${route.routeId}:`, {
        origin,
        destination,
        waypointCount: waypoints.length,
        validParcelCount: validParcels.length
      });
      
      return request;
    };

    // Helper to get fallback straight line coordinates
    const getFallbackRouteCoordinates = (route) => {
      if (!route || route.parcels.length === 0) return [];
      
      const coordinates = [];
      
      // Add driver starting point
      coordinates.push({
        lat: parseFloat(selectedDriverDetails.driver.driver_latitude),
        lng: parseFloat(selectedDriverDetails.driver.driver_longitude)
      });
      
      // Add all parcel coordinates
      route.parcels.forEach(parcel => {
        if (!isNaN(parseFloat(parcel.mapLat)) && !isNaN(parseFloat(parcel.mapLng))) {
          coordinates.push({
            lat: parseFloat(parcel.mapLat),
            lng: parseFloat(parcel.mapLng)
          });
        }
      });
      
      return coordinates;
    };

    if (loadError) {
  return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="error">
            Error loading Google Maps. Please check your internet connection and API key.
        </Alert>
              </Box>
      );
    }

    if (!isLoaded) {
      return (
              <Box sx={{ 
          height: '100vh', 
                display: 'flex', 
                justifyContent: 'center',
                          alignItems: 'center',
          flexDirection: 'column'
        }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, fontSize: '1.2rem' }}>Loading Google Maps...</Typography>
                      </Box>
      );
    }

    return (
      <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bgcolor: 'red', color: 'white', zIndex: 3000, p: 2 }}>
          TEST HEADER VISIBLE?
        </Box>
        {/* Enhanced Driver Info Bar */}
                    <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                              color: 'white',
          px: 3,
          py: 1,
          zIndex: 2000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          height: '56px',
                            display: 'flex', 
                            alignItems: 'center', 
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationIcon sx={{ color: '#e53935', fontSize: 24, mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white', mb: 0 }}>
              Driver Route: {selectedDriverDetails.driver.driver_name}
                              </Typography>
            <Typography variant="body2" sx={{ color: 'white', opacity: 0.95, fontSize: '1rem', fontWeight: 400, ml: 2 }}>
              Vehicle: {selectedDriverDetails.driver.vehicle_details} • Phone: {selectedDriverDetails.driver.driver_phone}
                                  </Typography>
                                </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={closeIndividualMap}
            sx={{ 
              minWidth: '140px',
              bgcolor: 'rgba(255,255,255,0.1)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)',
                borderColor: 'rgba(255,255,255,0.5)'
              }
            }}
          >
            Back to Overview
          </Button>
                              </Box>
        {/* Route Legend as floating white card over map */}
                      <Box sx={{ 
          position: 'fixed',
          top: 70,
          left: 32,
          bgcolor: 'white',
          color: '#222',
          p: 2,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          minWidth: '250px',
          maxWidth: '350px',
          border: '1px solid rgba(0,0,0,0.05)',
          zIndex: 2000
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DescriptionIcon sx={{ color: '#1976d2', mr: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1f2937', fontSize: '1.1rem' }}>
              Route Legend
                        </Typography>
                      </Box>
          {selectedDriverDetails.routes.map((route, index) => {
            const color = routeColors[index % routeColors.length];
            const routeTotal = route.parcels.length;
            return (
              <Box key={route.routeId} sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 24, height: 4, bgcolor: color, borderRadius: 2, mr: 1.5 }} />
                <Typography variant="body2" sx={{ fontSize: '0.97rem', fontWeight: 500 }}>
                  Route {route.routeId} ({routeTotal} deliveries)
                  </Typography>
                </Box>
            );
          })}
              </Box>
        {/* Map Container */}
              <GoogleMap
          mapContainerStyle={{ 
            width: '100%', 
            height: '100vh',
            paddingTop: '56px'
          }}
          center={{
            lat: parseFloat(selectedDriverDetails.driver.driver_latitude) || 13.0827,
            lng: parseFloat(selectedDriverDetails.driver.driver_longitude) || 80.2707
          }}
          zoom={12}
                options={{
                  zoomControl: true,
            zoomControlOptions: {
              position: 6 // BOTTOM_RIGHT
            },
                  mapTypeControl: true,
            streetViewControl: true,
                  fullscreenControl: true,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          }}
          onClick={() => setSelectedMarker(null)}
        >
          {/* Route Lines - Either Google Directions or Fallback Polylines */}
          {selectedDriverDetails.routes.map((route, idx) => {
            const directionsRequest = buildDirectionsRequest(route);
            const color = routeColors[idx % routeColors.length];
            
            console.log(`🛣️ Processing route ${route.routeId}:`, {
              directionsRequest,
              hasResult: !!directionsResults[route.routeId],
              hasError: !!directionsErrors[route.routeId],
              isLoading: loadingRoutes[route.routeId],
              useFallback: useFallbackRoutes[route.routeId]
            });
                    
                    return (
              <React.Fragment key={route.routeId}>
                {/* Try Google Directions first */}
                {directionsRequest && !directionsResults[route.routeId] && !directionsErrors[route.routeId] && !useFallbackRoutes[route.routeId] && (
                  <DirectionsService
                    options={directionsRequest}
                    callback={(result, status) => {
                      console.log(`🔄 DirectionsService callback for route ${route.routeId}:`, { status, result });
                      setLoadingRoutes(prev => ({ ...prev, [route.routeId]: false }));
                      if (status === 'OK') {
                        setDirectionsResults(prev => ({ ...prev, [route.routeId]: result }));
                        setDirectionsErrors(prev => ({ ...prev, [route.routeId]: null }));
                        console.log(`✅ Route ${route.routeId} directions loaded successfully!`);
                      } else {
                        setDirectionsErrors(prev => ({ ...prev, [route.routeId]: `Could not fetch route: ${status}` }));
                        setUseFallbackRoutes(prev => ({ ...prev, [route.routeId]: true }));
                        console.error(`❌ DirectionsService error for route ${route.routeId}:`, status, result);
                        console.log(`🔄 Switching to fallback polyline for route ${route.routeId}`);
                      }
                    }}
                  />
                )}
                
                {/* Render Google Directions result */}
                {directionsResults[route.routeId] && (
                  <DirectionsRenderer
                    options={{
                      directions: directionsResults[route.routeId],
                      polylineOptions: {
                        strokeColor: color,
                        strokeWeight: 6,
                        strokeOpacity: 0.8
                      },
                      suppressMarkers: true,
                      preserveViewport: true
                    }}
                  />
                )}
                
                {/* Fallback: Simple straight line routes */}
                {useFallbackRoutes[route.routeId] && (
                  <Polyline
                    path={getFallbackRouteCoordinates(route)}
                    options={{
                      strokeColor: color,
                      strokeWeight: 4,
                      strokeOpacity: 0.7,
                      strokeDashArray: [10, 5] // Dashed line to indicate it's not a real road route
                    }}
                  />
                )}
              </React.Fragment>
                              );
                            })}

          {/* Enhanced Driver Starting Point */}
          <Marker
            position={{
              lat: parseFloat(selectedDriverDetails.driver.driver_latitude) || 13.0827,
              lng: parseFloat(selectedDriverDetails.driver.driver_longitude) || 80.2707
            }}
            icon={{
              path: 'M-20,0a20,20 0 1,0 40,0a20,20 0 1,0 -40,0',
              fillColor: '#1976d2',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 4,
              scale: 1.2
            }}
            label={{
              text: 'DRIVER',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '10px'
            }}
            onClick={() => setSelectedMarker('driver')}
          />

          {/* Enhanced Delivery Stop Markers */}
          {selectedDriverDetails.routes.map((route, routeIndex) => {
            const color = routeColors[routeIndex % routeColors.length];
            
            return route.parcels.map((parcel, parcelIndex) => {
                              return (
                <Marker
                  key={`marker-${parcel.id}-${route.routeId}`}
                  position={{
                    lat: parcel.mapLat,
                    lng: parcel.mapLng
                  }}
                  icon={{
                    path: 'M-24,0a24,24 0 1,0 48,0a24,24 0 1,0 -48,0',
                    fillColor: parcel.status === 'delivered' ? '#4caf50' : color,
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                    scale: 1
                  }}
                  label={{
                    text: parcel.globalDeliveryNumber.toString(),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                  onClick={() => setSelectedMarker(`parcel-${parcel.id}`)}
                />
              );
            });
          })}

          {/* Enhanced Driver Info Window */}
          {selectedMarker === 'driver' && (
                  <InfoWindow
              position={{
                lat: parseFloat(selectedDriverDetails.driver.driver_latitude) || 13.0827,
                lng: parseFloat(selectedDriverDetails.driver.driver_longitude) || 80.2707
              }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
              <Box sx={{ minWidth: '320px', p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#1976d2', mr: 2, width: 48, height: 48 }}>
                    <TruckIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                      Driver Starting Point
                          </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      Route Headquarters
                          </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1.5 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ fontSize: 18, mr: 1, color: '#666' }} />
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {selectedDriverDetails.driver.driver_name}
                          </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneIcon sx={{ fontSize: 18, mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedDriverDetails.driver.driver_phone}
                          </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TruckIcon sx={{ fontSize: 18, mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {selectedDriverDetails.driver.vehicle_details}
                          </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationIcon sx={{ fontSize: 18, mr: 1, color: '#666' }} />
                    <Typography variant="body2">
                      {parseFloat(selectedDriverDetails.driver.driver_latitude).toFixed(4)}, {parseFloat(selectedDriverDetails.driver.driver_longitude).toFixed(4)}
                          </Typography>
                  </Box>
                </Box>
                    </Box>
                  </InfoWindow>
                )}

          {/* Enhanced Parcel Info Windows */}
          {selectedDriverDetails.routes.map((route, routeIndex) => {
            const color = routeColors[routeIndex % routeColors.length];
            
            return route.parcels.map((parcel) => {
              if (selectedMarker !== `parcel-${parcel.id}`) return null;
              
              return (
                <InfoWindow
                  key={`info-${parcel.id}`}
                  position={{
                    lat: parcel.mapLat,
                    lng: parcel.mapLng
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <Box sx={{ minWidth: 320, maxWidth: 370, p: 0, borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
                    {/* Blue Header */}
                    <Box sx={{
                      bgcolor: '#1976d2',
          color: 'white',
                      px: 2,
                      py: 1.5,
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
          display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      mb: 1
                    }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <PackageIcon sx={{ fontSize: 22, mr: 1, color: 'white' }} />
                        Stop #{parcel.globalDeliveryNumber}
            </Typography>
                      <Typography sx={{ fontSize: '0.95rem', opacity: 0.95 }}>
                        Route {route.routeId} • ID: {parcel.id}
            </Typography>
          </Box>

                    <Box sx={{ px: 2, pt: 0.5, pb: 2 }}>
                      {/* Customer */}
                      <Typography sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '1rem', mt: 0.5, mb: 0.5, display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ fontSize: 18, mr: 1 }} /> Customer
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.2 }}>{parcel.customer_name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: '#666' }} />
                        <Typography sx={{ fontSize: '0.97rem', color: '#444' }}>{parcel.phone_number}</Typography>
                      </Box>

                      {/* Package */}
                      <Typography sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '1rem', mt: 0.5, mb: 0.5, display: 'flex', alignItems: 'center' }}>
                        <PackageIcon sx={{ fontSize: 18, mr: 1 }} /> Package
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PackageIcon sx={{ fontSize: 16, mr: 0.5, color: '#f59e0b' }} />
                        <Typography sx={{ fontSize: '0.97rem', color: '#444' }}>{parcel.weight || parcel.package_weight || '—'} kg</Typography>
                      </Box>

                      {/* Status */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getStatusChip(parcel.status)}
                      </Box>

                      {/* Date/Time */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TimeIcon sx={{ fontSize: 16, mr: 0.5, color: '#666' }} />
                        <Typography sx={{ fontSize: '0.97rem', color: '#444' }}>{parcel.delivery_time || formatTime(parcel.created_at)}</Typography>
                      </Box>

                      {/* Address */}
                      <Typography sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '1rem', mt: 0.5, mb: 0.5, display: 'flex', alignItems: 'center' }}>
                        <AddressIcon sx={{ fontSize: 18, mr: 1 }} /> Address
                      </Typography>
                      <Typography sx={{ fontSize: '0.97rem', color: '#444', mb: 0.2 }}>{parcel.delivery_address || parcel.address}</Typography>
                      {parcel.pin_code && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: '#e53935' }} />
                          <Typography sx={{ fontSize: '0.97rem', color: '#444' }}>{parcel.pin_code}</Typography>
                        </Box>
                      )}

                      {/* Coordinates */}
                      <Box sx={{ mb: 1 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>
                          Original: {parcel.originalLat?.toFixed(4)}, {parcel.originalLng?.toFixed(4)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer' }}
                          component="a"
                          href={`https://maps.google.com/?q=${parcel.mapLat},${parcel.mapLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Map: {parcel.mapLat?.toFixed(4)}, {parcel.mapLng?.toFixed(4)} (Adjusted)
                        </Typography>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="small" 
                          startIcon={<PhoneIcon />}
                          href={`tel:${parcel.phone_number}`}
                          sx={{ minWidth: 0, px: 2 }}
                        >
                          Call
                        </Button>
                        <Button
                          variant="outlined"
                          size="small" 
                          startIcon={<NavigationIcon />}
                          href={`https://www.google.com/maps/dir/?api=1&destination=${parcel.mapLat},${parcel.mapLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ minWidth: 0, px: 2 }}
                        >
                          Navigate
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </InfoWindow>
              );
            });
          })}
        </GoogleMap>
      </Box>
    );
  };

  if (mapMode === 'individual' && selectedDriverDetails) {
    return <IndividualDriverMap />;
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 2 }}>
          {alert.message}
        </Alert>
      )}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1f2937', mb: 1 }}>
          🚛 Driver Routes Management
                                  </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Click on any driver card to view their detailed route map with real road directions
                                  </Typography>
                                </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Driver Cards Grid */}
      <Box sx={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        justifyContent: 'flex-start'
      }}>
        {drivers.map((driver) => (
          <Card 
            key={driver.driver_id}
            sx={{ 
              width: {
                xs: '100%',  // Mobile: 1 card per row
                sm: 'calc(50% - 8px)',  // Tablet: 2 cards per row  
                md: 'calc(20% - 19.2px)'  // Desktop: 5 cards per row
              },
              maxWidth: '280px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                borderColor: '#1976d2'
              },
              border: '2px solid transparent'
            }}
            onClick={() => fetchDriverRoutes(driver.driver_id)}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#1976d2', mr: 2, width: 48, height: 48 }}>
                  <PersonIcon />
                              </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem', mb: 0.5, wordBreak: 'break-word' }}>
                    {driver.driver_name}
                                </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    📱 {driver.driver_phone}
                                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#374151', fontWeight: 'medium', mb: 0.5 }}>
                  🚛 {driver.vehicle_details}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.8rem' }}>
                  Status: {driver.is_active ? 'Active' : 'Inactive'}
                                  </Typography>
                                </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PackageIcon sx={{ fontSize: 16, color: '#1976d2', mr: 0.5 }} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    {driver.total_parcels} parcels
                  </Typography>
                </Box>
                {/* Removed active parcels count */}
              </Box>

          <Button 
            variant="contained" 
                fullWidth
                startIcon={<MapIcon />}
                sx={{ 
                  bgcolor: '#1976d2',
                  '&:hover': { bgcolor: '#1565c0' },
                  fontWeight: 'bold',
                  py: 1
                }}
              >
                View Route Map
          </Button>
            </CardContent>
          </Card>
        ))}
      </Box>

      {drivers.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" sx={{ color: '#6b7280', mb: 1 }}>
            No drivers found
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            There are currently no drivers with assigned routes in the system.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default DriverRoutesPage; 