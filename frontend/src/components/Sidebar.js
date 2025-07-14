import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  Typography, 
  Avatar,
  Divider 
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocalShipping as DriversIcon,
  Inventory as ParcelsIcon,
  Map as MapIcon,
  Timeline as RouteIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

function Sidebar({ onSoftRefresh }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/drivers', label: 'Drivers', icon: <DriversIcon /> },
    { path: '/parcels', label: 'Parcels', icon: <ParcelsIcon /> },
    { path: '/map', label: 'Map View', icon: <MapIcon /> },
    { path: '/driver-routes', label: 'Driver Routes', icon: <RouteIcon /> }
  ];

  const isActive = (path) => location.pathname === path;

  const handleTabClick = (path) => {
    if (location.pathname === path) {
      if (onSoftRefresh) onSoftRefresh(path);
    } else {
      navigate(path);
    }
  };

  return (
    <Drawer 
      variant="permanent" 
      anchor="left"
      sx={{
        width: 260,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 260,
          boxSizing: 'border-box',
          background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
          color: 'white',
          borderRight: 'none',
          boxShadow: '4px 0 15px rgba(0,0,0,0.1)'
        },
      }}
    >
      {/* Logo and Admin Section */}
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Avatar
          sx={{
            width: 60,
            height: 60,
            margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}
        >
          QD
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          QIK DELIVERY
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
          Admin Portal
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mx: 2 }} />

      {/* Admin Profile */}
      <Box sx={{ p: 2, mx: 2, my: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <AdminIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Admin User
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
              Administrator
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Navigation Menu */}
      <List sx={{ px: 2, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            key={item.path}
            button
            onClick={() => handleTabClick(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: 'white',
              textDecoration: 'none',
              backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                transform: 'translateX(4px)',
                transition: 'all 0.2s ease'
              },
              '&.active': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderLeft: '4px solid #fff'
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon 
              sx={{ 
                color: 'white', 
                minWidth: 40,
                opacity: isActive(item.path) ? 1 : 0.8
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.9rem',
                fontWeight: isActive(item.path) ? 600 : 500
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ mt: 'auto', p: 2, textAlign: 'center' }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mb: 2 }} />
        <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.7rem' }}>
          v1.0.0 • © 2025 QIK Delivery
        </Typography>
      </Box>
    </Drawer>
  );
}

export default Sidebar;
