import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Badge,
  Avatar,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';

function Topbar() {
  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'white',
        borderBottom: '1px solid #e2e8f0',
        color: '#1f2937',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        width: 'calc(100vw - 260px)', // Full width minus sidebar width
        marginLeft: 0, // Remove any left margin
        position: 'fixed',
        top: 0,
        left: '260px', // Start exactly where sidebar ends
        zIndex: 1000
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 3, minHeight: '70px !important' }}>
        {/* Left side - Page title and breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1f2937' }}>
            QIK Delivery Admin Portal
          </Typography>
          <Chip
            label="Live"
            size="small"
            sx={{
              bgcolor: '#10b981',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 20,
              '& .MuiChip-label': {
                px: 1
              }
            }}
          />
        </Box>

        {/* Right side - Actions and user info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* User Profile */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            ml: 1,
            px: 2,
            py: 1,
            borderRadius: 2,
            '&:hover': {
              bgcolor: '#f9fafb',
              cursor: 'pointer'
            },
            transition: 'all 0.2s ease'
          }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: '#667eea',
                fontSize: '0.9rem'
              }}
            >
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                Admin User
              </Typography>
              <Typography variant="caption" sx={{ color: '#6b7280', lineHeight: 1.2 }}>
                Administrator
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;
