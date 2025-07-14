import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent,
  Typography,
  Avatar,
  LinearProgress
} from '@mui/material';
import {
  Inventory,
  Warning,
  LocalShipping,
  CheckCircle,
  Schedule,
  TrendingUp,
  DirectionsCar
} from '@mui/icons-material';

function ParcelStats({ showSecondaryStats = false, parcelsData = null, driversData = null, refreshTrigger = 0 }) {
  const [parcels, setParcels] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (parcelsData && driversData) {
      // Use provided data from parent component
      setParcels(parcelsData);
      setDrivers(driversData);
      setLoading(false);
    } else {
      // Fetch data independently
      fetchData();
    }
  }, [parcelsData, driversData, refreshTrigger]);

  const fetchData = async () => {
    try {
      const [parcelsResponse, driversResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels`),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/drivers`)
      ]);
      setParcels(parcelsResponse.data);
      setDrivers(driversResponse.data);
    } catch (error) {
      console.error('Error fetching stats data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalParcels = parcels.length;
  const assignedParcels = parcels.filter(p => p.status === 'assigned').length;
  const unassignedParcels = parcels.filter(p => p.status === 'unassigned').length;
  const inTransitParcels = parcels.filter(p => p.status === 'in_transit').length;
  const completedParcels = parcels.filter(p => p.status === 'completed').length;
  const pendingParcels = parcels.filter(p => p.status === 'pending').length;
  const activeDrivers = drivers.filter(d => d.is_active).length;

  const StatCard = ({ title, value, subtitle, icon, gradient, progress }) => (
    <Card 
      sx={{ 
        background: gradient,
        color: 'white',
        borderRadius: 3,
        height: '140px',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          transition: 'all 0.3s ease'
        }
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              {subtitle}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
        {progress !== undefined && (
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              mt: 2, 
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'rgba(255,255,255,0.8)'
              }
            }} 
          />
        )}
      </CardContent>
    </Card>
  );

  const SecondaryStatCard = ({ title, value, icon, bgcolor }) => (
    <Card sx={{ borderRadius: 3, height: '100px' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: bgcolor, width: 40, height: 40 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      {/* Main Stats Grid - Always Centered */}
      <Grid container spacing={3} justifyContent="center" sx={{ mb: showSecondaryStats ? 4 : 0 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Parcels"
            value={totalParcels}
            subtitle="All registered parcels"
            icon={<Inventory />}
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            progress={85}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unassigned"
            value={unassignedParcels}
            subtitle="Awaiting assignment"
            icon={<Warning />}
            gradient="linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)"
            progress={totalParcels ? (unassignedParcels / totalParcels) * 100 : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="In Transit"
            value={inTransitParcels}
            subtitle="Currently delivering"
            icon={<LocalShipping />}
            gradient="linear-gradient(135deg, #45b7d1 0%, #96c93d 100%)"
            progress={totalParcels ? (inTransitParcels / totalParcels) * 100 : 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={completedParcels}
            subtitle="Successfully delivered"
            icon={<CheckCircle />}
            gradient="linear-gradient(135deg, #96c93d 0%, #02aab0 100%)"
            progress={totalParcels ? (completedParcels / totalParcels) * 100 : 0}
          />
        </Grid>
      </Grid>

      {/* Secondary Stats - Only shown when requested */}
      {showSecondaryStats && (
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={4} md={3}>
            <SecondaryStatCard
              title="Assigned Parcels"
              value={assignedParcels}
              icon={<Schedule />}
              bgcolor="#f59e0b"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <SecondaryStatCard
              title="Pending Parcels"
              value={pendingParcels}
              icon={<TrendingUp />}
              bgcolor="#8b5cf6"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <SecondaryStatCard
              title="Active Drivers"
              value={activeDrivers}
              icon={<DirectionsCar />}
              bgcolor="#06b6d4"
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}

export default ParcelStats; 