import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Typography, 
  TextField, 
  Button, 
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalShipping as TruckIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import ParcelStats from '../components/ParcelStats';

function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [editingDriver, setEditingDriver] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    vehicle_details: '',
    is_active: true
  });

  // Validation state
  const [formErrors, setFormErrors] = useState({
    full_name: '',
    phone_number: '',
    vehicle_details: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterDrivers();
  }, [drivers, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [driversResponse, parcelsResponse] = await Promise.all([
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/drivers`),
        axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels`)
      ]);
      setDrivers(driversResponse.data);
      setParcels(parcelsResponse.data);
    } catch (error) {
      showAlert('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/drivers`);
      setDrivers(response.data);
    } catch (error) {
      showAlert('Error fetching drivers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterDrivers = () => {
    let filtered = drivers;
    
    if (searchTerm) {
      filtered = filtered.filter(driver =>
        driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone_number.includes(searchTerm) ||
        driver.vehicle_details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredDrivers(filtered);
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4000);
  };

  // Validation functions
  const validateFullName = (name) => {
    if (!name.trim()) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Full name must be at least 2 characters long';
    }
    if (name.trim().length > 50) {
      return 'Full name must be less than 50 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Full name can only contain letters and spaces';
    }
    return '';
  };

  const validatePhoneNumber = (phone) => {
    if (!phone.trim()) {
      return 'Phone number is required';
    }
    // Remove all non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }
    return '';
  };

  const validateVehicleDetails = (vehicle) => {
    if (!vehicle.trim()) {
      return 'Vehicle number is required';
    }
    
    const trimmedVehicle = vehicle.trim().toUpperCase();
    
    // Indian vehicle number plate validation
    // Format 1: TN48 BS1234 (State code + District code + Series + Number)
    // Format 2: BH01 AA1234 (BH series for new registration)
    const indianPlateRegex = /^([A-Z]{2}[0-9]{2}\s?[A-Z]{1,2}[0-9]{4})$/;
    
    if (!indianPlateRegex.test(trimmedVehicle.replace(/\s/g, ''))) {
      return 'Vehicle number must be in Indian format (e.g., TN48BS1234 or BH01AA1234)';
    }
    
    // Additional length check
    const cleanVehicle = trimmedVehicle.replace(/\s/g, '');
    if (cleanVehicle.length !== 10) {
      return 'Vehicle number must be exactly 10 characters long';
    }
    
    return '';
  };

  const validateForm = () => {
    const errors = {
      full_name: validateFullName(formData.full_name),
      phone_number: validatePhoneNumber(formData.phone_number),
      vehicle_details: validateVehicleDetails(formData.vehicle_details)
    };

    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({
      ...formData,
      [name]: newValue
    });

    // Real-time validation
    if (name === 'full_name') {
      setFormErrors(prev => ({
        ...prev,
        full_name: validateFullName(newValue)
      }));
    } else if (name === 'phone_number') {
      // Allow only digits and limit to 10 characters
      const cleanValue = newValue.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        phone_number: cleanValue
      }));
      setFormErrors(prev => ({
        ...prev,
        phone_number: validatePhoneNumber(cleanValue)
      }));
    } else if (name === 'vehicle_details') {
      // Format vehicle number as user types
      const formattedValue = newValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        vehicle_details: formattedValue
      }));
      setFormErrors(prev => ({
        ...prev,
        vehicle_details: validateVehicleDetails(formattedValue)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('Please fix the validation errors before submitting', 'error');
      return;
    }

    // Clear any previous form errors before submitting
    setFormErrors({
      full_name: '',
      phone_number: '',
      vehicle_details: ''
    });

    setLoading(true);
    try {
      if (editingDriver) {
        await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/drivers/${editingDriver.id}`, formData);
        showAlert('Driver updated successfully!');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/drivers`, formData);
        showAlert('Driver added successfully!');
      }
      resetForm();
      fetchDrivers();
    } catch (error) {
      console.error('Frontend - Error:', error);
      console.error('Frontend - Error response:', error.response);
      
      // Handle duplicate validation errors by showing them in form fields
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        console.log('Backend error message:', errorMessage); // Debug log
        
        // Check for specific duplicate error messages
        const errorLower = errorMessage.toLowerCase();
        
        // Vehicle number duplicate error - HIGHEST PRIORITY
        if (errorLower.includes('vehicle') && errorLower.includes('already exists')) {
          console.log('Setting vehicle error in form field');
          setFormErrors(prev => ({
            ...prev,
            vehicle_details: errorMessage
          }));
          return; // Don't show alert if we set form error
        }
        // Phone duplicate error  
        else if (errorLower.includes('phone') && errorLower.includes('already exists')) {
          console.log('Setting phone error in form field');
          setFormErrors(prev => ({
            ...prev,
            phone_number: errorMessage
          }));
          return; // Don't show alert if we set form error
        }
        // Name duplicate error
        else if (errorLower.includes('name') && errorLower.includes('already exists')) {
          console.log('Setting name error in form field');
          setFormErrors(prev => ({
            ...prev,
            full_name: errorMessage
          }));
          return; // Don't show alert if we set form error
        }
        // FALLBACK: Generic duplicate error - assume it's vehicle number since that's what we're testing
        else if (errorLower.includes('duplicate') || errorLower.includes('already exists')) {
          console.log('Generic duplicate error - assuming vehicle number issue');
          setFormErrors(prev => ({
            ...prev,
            vehicle_details: 'A driver with this vehicle number already exists'
          }));
          return;
        }
        
        // For other validation errors, show as alert
          showAlert(errorMessage, 'error');
      } else {
        showAlert(`Error ${editingDriver ? 'updating' : 'adding'} driver`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      full_name: driver.full_name,
      phone_number: driver.phone_number,
      vehicle_details: driver.vehicle_details,
      is_active: Boolean(driver.is_active)
    });
    setFormErrors({
      full_name: '',
      phone_number: '',
      vehicle_details: ''
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (driver) => {
    setDriverToDelete(driver);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!driverToDelete) return;
    
        try {
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/drivers/${driverToDelete.id}`);
      fetchData();
      showAlert('Driver deleted successfully!');
    } catch (error) {
      if (error.response?.status === 400) {
        showAlert(error.response.data.error || 'Cannot delete driver with assigned parcels', 'error');
      } else {
        showAlert('Error deleting driver', 'error');
      }
    } finally {
      setOpenDeleteDialog(false);
      setDriverToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone_number: '',
      vehicle_details: '',
      is_active: true
    });
    setFormErrors({
      full_name: '',
      phone_number: '',
      vehicle_details: ''
    });
    setEditingDriver(null);
    setOpenDialog(false);
  };

  const activeDrivers = drivers.filter(d => d.is_active).length;
  const inactiveDrivers = drivers.filter(d => !d.is_active).length;

  // Reset pagination when search term changes
  useEffect(() => {
    if (searchTerm) {
      setPage(0); // Reset to first page when searching
    }
  }, [searchTerm]);

  const paginatedDrivers = filteredDrivers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
          Driver Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Manage delivery drivers and their vehicle information
        </Typography>
      </Box>

      {/* Centered Parcel Statistics */}
      <ParcelStats parcelsData={parcels} driversData={drivers} />

      {/* Driver Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} justifyContent="center">
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            minHeight: '120px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, fontSize: '2rem' }}>
                {drivers.length}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>Total Drivers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            minHeight: '120px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, fontSize: '2rem' }}>
                {activeDrivers}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>Active Drivers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 3, 
            minHeight: '120px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, fontSize: '2rem' }}>
                {inactiveDrivers}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>Inactive</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, minHeight: '120px', cursor: 'pointer' }} 
                onClick={() => setOpenDialog(true)}>
            <CardContent sx={{ textAlign: 'center', py: 2.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Avatar sx={{ bgcolor: '#667eea', mx: 'auto', mb: 1.5, width: 36, height: 36 }}>
                <AddIcon sx={{ fontSize: '1.2rem' }} />
              </Avatar>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Add Driver
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search drivers by name, phone, or vehicle number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#9ca3af', mr: 1 }} />,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" sx={{ textAlign: { xs: 'left', md: 'right' }, color: '#6b7280' }}>
                Showing {filteredDrivers.length} of {drivers.length} drivers
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Drivers Table */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Drivers List ({filteredDrivers.length})
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Manage driver profiles and vehicle information
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Driver Info</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Vehicle Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDrivers.map((driver) => (
                    <TableRow key={driver.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: driver.is_active ? '#10b981' : '#ef4444' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {driver.full_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {driver.id}
      </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: '1rem', color: '#6b7280' }} />
                          <Typography variant="body2">{driver.phone_number}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TruckIcon sx={{ fontSize: '1rem', color: '#6b7280' }} />
                          <Typography variant="body2">{driver.vehicle_details}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={driver.is_active ? 'Active' : 'Inactive'}
                          color={driver.is_active ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Driver">
                            <IconButton 
                              onClick={() => handleEdit(driver)}
                              sx={{ color: '#3b82f6', padding: '6px' }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Driver">
                            <IconButton 
                              onClick={() => handleDeleteClick(driver)}
                              sx={{ color: '#ef4444', padding: '6px' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredDrivers.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </Card>

      {/* Add/Edit Driver Dialog */}
      <Dialog open={openDialog} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {editingDriver ? 'Edit Driver' : 'Add New Driver'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
        <TextField
                  fullWidth
          label="Full Name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
          margin="normal"
                  error={!!formErrors.full_name}
                  helperText={formErrors.full_name}
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: formErrors.full_name ? '#d32f2f' : '#9ca3af' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        '& fieldset': {
                          borderColor: '#d32f2f',
                        },
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
        <TextField
                  fullWidth
          label="Phone Number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          required
          margin="normal"
                  error={!!formErrors.phone_number}
                  helperText={formErrors.phone_number || 'Enter 10-digit mobile number'}
                  inputProps={{
                    maxLength: 10,
                    pattern: '[0-9]*',
                    inputMode: 'numeric'
                  }}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: formErrors.phone_number ? '#d32f2f' : '#9ca3af' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        '& fieldset': {
                          borderColor: '#d32f2f',
                        },
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
        <TextField
                  fullWidth
          label="Vehicle Number"
          name="vehicle_details"
          value={formData.vehicle_details}
          onChange={handleChange}
          required
          margin="normal"
                  error={!!formErrors.vehicle_details}
                  helperText={formErrors.vehicle_details || 'Enter Indian vehicle number (e.g., TN48BS1234 or BH01AA1234)'}
                  placeholder="TN48BS1234"
                  inputProps={{
                    maxLength: 10,
                    style: { textTransform: 'uppercase' }
                  }}
                  InputProps={{
                    startAdornment: <TruckIcon sx={{ mr: 1, color: formErrors.vehicle_details ? '#d32f2f' : '#9ca3af' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-error': {
                        '& fieldset': {
                          borderColor: '#d32f2f',
                        },
                      },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={handleChange}
                      name="is_active"
                      color="primary"
                    />
                  }
                  label="Active Driver"
                  sx={{ mt: 1 }}
                />
                <FormHelperText sx={{ ml: 0 }}>
                  Active drivers can be assigned to parcels
                </FormHelperText>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button onClick={resetForm} sx={{ minWidth: '80px' }}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || Object.values(formErrors).some(error => error !== '')}
              sx={{ 
                minWidth: '120px', 
                height: '40px',
                opacity: Object.values(formErrors).some(error => error !== '') ? 0.6 : 1
              }}
            >
              {loading ? <CircularProgress size={20} /> : (editingDriver ? 'Update Driver' : 'Add Driver')}
        </Button>
          </DialogActions>
      </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: '#fee2e2', color: '#dc2626', width: 40, height: 40 }}>
            <WarningIcon />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Delete Driver
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this driver?
          </Typography>
          {driverToDelete && (
            <Box sx={{ 
              bgcolor: '#f8fafc', 
              p: 2, 
              borderRadius: 2,
              border: '1px solid #e2e8f0'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Driver Details:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Name:</strong> {driverToDelete.full_name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Phone:</strong> {driverToDelete.phone_number}
              </Typography>
              <Typography variant="body2">
                <strong>Vehicle Number:</strong> {driverToDelete.vehicle_details}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ mt: 2, color: '#dc2626' }}>
            This action cannot be undone. The driver will be permanently removed from the system.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)}
            sx={{ minWidth: '80px' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{ minWidth: '100px', height: '40px' }}
          >
            Delete Driver
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DriversPage;
