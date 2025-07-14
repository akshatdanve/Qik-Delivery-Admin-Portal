import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar
} from '@mui/material';
import {
  TrendingUp,
  LocalShipping,
  Inventory,
  CheckCircle,
  Schedule,
  Warning
} from '@mui/icons-material';
import ParcelStats from '../components/ParcelStats';

function DashboardPage() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels`);
      setParcels(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'unassigned': '#ef4444',
      'assigned': '#3b82f6',
      'in_transit': '#f59e0b',
      'completed': '#10b981',
      'pending': '#f97316'
    };
    return colors[status] || '#6b7280';
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



  const recentParcels = parcels.slice(-5).reverse();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1f2937', mb: 1 }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Welcome back! Here's what's happening with your deliveries today.
        </Typography>
      </Box>

      {/* Centered Parcel Statistics */}
      <ParcelStats showSecondaryStats={true} />

      {/* Recent Parcels Table */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Recent Parcels
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Latest parcel entries in the system
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Weight</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentParcels.map((parcel) => (
                <TableRow key={parcel.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell sx={{ fontWeight: 500 }}>{parcel.customer_name}</TableCell>
                  <TableCell>{parcel.phone_number}</TableCell>
                  <TableCell sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {parcel.address}
                  </TableCell>
                  <TableCell>{getStatusChip(parcel.status)}</TableCell>
                  <TableCell>{parcel.weight} kg</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

export default DashboardPage;
