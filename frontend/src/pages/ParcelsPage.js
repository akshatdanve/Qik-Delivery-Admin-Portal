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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Tooltip,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  Assignment as AssignIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as DownloadIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import ParcelStats from '../components/ParcelStats';

function ParcelsPage() {
  const [parcels, setParcels] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filteredParcels, setFilteredParcels] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDriver, setFilterDriver] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [parcelToDelete, setParcelToDelete] = useState(null);
  const [editingParcel, setEditingParcel] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    customer_name: '',
    phone_number: '',
    weight: '',
    pin_code: '',
    address: '',
    latitude: '',
    longitude: '',
    status: 'unassigned'
  });

  // Validation state
  const [formErrors, setFormErrors] = useState({
    customer_name: '',
    phone_number: '',
    weight: '',
    pin_code: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterParcels();
    // Reset pagination to page 1 whenever filters change
    setPage(0);
  }, [parcels, filterStatus, filterDriver, searchTerm]);

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
      showAlert('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterParcels = () => {
    let filtered = parcels;
    
    if (filterStatus !== 'All') {
      filtered = filtered.filter(parcel => 
        parcel.status.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    
    if (filterDriver !== 'All') {
      if (filterDriver === 'Unassigned') {
        filtered = filtered.filter(parcel => !parcel.assigned_driver_id);
      } else {
        filtered = filtered.filter(parcel => 
          parcel.assigned_driver_id && 
          parcel.assigned_driver_id.toString() === filterDriver
        );
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter(parcel =>
        parcel.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.phone_number.includes(searchTerm) ||
        parcel.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parcel.pin_code.includes(searchTerm)
      );
    }
    
    setFilteredParcels(filtered);
  };

  const showAlert = (message, severity = 'success') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'success' }), 4000);
  };

  // Validation functions
  const validateCustomerName = (name) => {
    if (!name.trim()) {
      return 'Customer name is required';
    }
    if (name.trim().length < 2) {
      return 'Customer name must be at least 2 characters long';
    }
    if (name.trim().length > 50) {
      return 'Customer name must be less than 50 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return 'Customer name can only contain letters and spaces';
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

  const validateWeight = (weight) => {
    if (!weight.toString().trim()) {
      return 'Weight is required';
    }
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum)) {
      return 'Weight must be a valid number';
    }
    if (weightNum <= 0) {
      return 'Weight must be greater than 0';
    }
    if (weightNum > 1000) {
      return 'Weight must be less than 1000 kg';
    }
    return '';
  };

  const validatePinCode = (pinCode) => {
    if (!pinCode.trim()) {
      return 'PIN code is required';
    }
    const cleanPin = pinCode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      return 'PIN code must be exactly 6 digits';
    }
    return '';
  };

  const validateAddress = (address) => {
    if (!address.trim()) {
      return 'Address is required';
    }
    if (address.trim().length < 10) {
      return 'Address must be at least 10 characters long';
    }
    if (address.trim().length > 200) {
      return 'Address must be less than 200 characters';
    }
    return '';
  };

  const validateLatitude = (lat) => {
    if (!lat.toString().trim()) {
      return 'Latitude is required';
    }
    const latNum = parseFloat(lat);
    if (isNaN(latNum)) {
      return 'Latitude must be a valid number';
    }
    if (latNum < -90 || latNum > 90) {
      return 'Latitude must be between -90 and 90';
    }
    return '';
  };

  const validateLongitude = (lng) => {
    if (!lng.toString().trim()) {
      return 'Longitude is required';
    }
    const lngNum = parseFloat(lng);
    if (isNaN(lngNum)) {
      return 'Longitude must be a valid number';
    }
    if (lngNum < -180 || lngNum > 180) {
      return 'Longitude must be between -180 and 180';
    }
    return '';
  };

  const validateForm = () => {
    const errors = {
      customer_name: validateCustomerName(formData.customer_name),
      phone_number: validatePhoneNumber(formData.phone_number),
      weight: validateWeight(formData.weight),
      pin_code: validatePinCode(formData.pin_code),
      address: validateAddress(formData.address),
      latitude: validateLatitude(formData.latitude),
      longitude: validateLongitude(formData.longitude)
    };

    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Real-time validation
    if (name === 'customer_name') {
      setFormErrors(prev => ({
        ...prev,
        customer_name: validateCustomerName(value)
      }));
    } else if (name === 'phone_number') {
      // Allow only digits and limit to 10 characters
      const cleanValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        phone_number: cleanValue
      }));
      setFormErrors(prev => ({
        ...prev,
        phone_number: validatePhoneNumber(cleanValue)
      }));
    } else if (name === 'weight') {
      setFormErrors(prev => ({
        ...prev,
        weight: validateWeight(value)
      }));
    } else if (name === 'pin_code') {
      // Allow only digits and limit to 6 characters
      const cleanValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({
        ...prev,
        pin_code: cleanValue
      }));
      setFormErrors(prev => ({
        ...prev,
        pin_code: validatePinCode(cleanValue)
      }));
    } else if (name === 'address') {
      setFormErrors(prev => ({
        ...prev,
        address: validateAddress(value)
      }));
    } else if (name === 'latitude') {
      setFormErrors(prev => ({
        ...prev,
        latitude: validateLatitude(value)
      }));
    } else if (name === 'longitude') {
      setFormErrors(prev => ({
        ...prev,
        longitude: validateLongitude(value)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showAlert('Please fix the validation errors before submitting', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingParcel) {
        await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels/${editingParcel.id}`, formData);
        showAlert('Parcel updated successfully!');
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels`, formData);
        showAlert('Parcel added successfully!');
      }
      resetForm();
      fetchData();
    } catch (error) {
      // Handle backend validation errors
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        console.log('Backend error message for parcel:', errorMessage); // Debug log
        
        // Check if it's a duplicate phone error
        if (errorMessage.includes('phone number already exists')) {
          console.log('Setting phone error in parcel form field');
          setFormErrors(prev => ({
            ...prev,
            phone_number: errorMessage
          }));
          return; // Don't show alert if we set form error
        }
        
        // For other validation errors, show as alert
        showAlert(errorMessage, 'error');
      } else {
        showAlert(`Error ${editingParcel ? 'updating' : 'adding'} parcel`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
        setFormData({
          customer_name: '',
          phone_number: '',
          weight: '',
          pin_code: '',
          address: '',
          latitude: '',
          longitude: '',
          status: 'unassigned'
        });
    setFormErrors({
      customer_name: '',
      phone_number: '',
      weight: '',
      pin_code: '',
      address: '',
      latitude: '',
      longitude: ''
    });
    setEditingParcel(null);
    setOpenDialog(false);
  };

  const handleEdit = (parcel) => {
    setEditingParcel(parcel);
    setFormData({
      customer_name: parcel.customer_name,
      phone_number: parcel.phone_number,
      weight: parcel.weight,
      pin_code: parcel.pin_code,
      address: parcel.address,
      latitude: parcel.latitude,
      longitude: parcel.longitude,
      status: parcel.status
    });
    setFormErrors({
      customer_name: '',
      phone_number: '',
      weight: '',
      pin_code: '',
      address: '',
      latitude: '',
      longitude: ''
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (parcel) => {
    setParcelToDelete(parcel);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!parcelToDelete) return;
    
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels/${parcelToDelete.id}`);
      fetchData();
      showAlert('Parcel deleted successfully!');
    } catch (error) {
      showAlert('Error deleting parcel', 'error');
    } finally {
      setOpenDeleteDialog(false);
      setParcelToDelete(null);
    }
  };

  const handleAssign = async (parcelId, driverId) => {
    try {
      // If driverId is empty, unassign the driver instead
      if (!driverId || driverId === '') {
        await handleUnassign(parcelId);
        return;
      }
      
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels/${parcelId}/assign`, { driver_id: driverId });
      fetchData();
      showAlert('Driver assigned successfully and status set to assigned!');
    } catch (error) {
      if (error.response?.data?.error) {
        showAlert(error.response.data.error, 'error');
      } else {
      showAlert('Error assigning driver', 'error');
      }
    }
  };

  const handleUnassign = async (parcelId) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels/${parcelId}/unassign`);
      fetchData();
      showAlert('Driver unassigned and status set to unassigned!');
    } catch (error) {
      showAlert('Error unassigning driver', 'error');
    }
  };

  const handleStatusUpdate = async (parcelId, newStatus) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/parcels/${parcelId}/status`, { status: newStatus });
      fetchData();
      showAlert(`Status updated to ${newStatus.replace('_', ' ')}!`);
    } catch (error) {
      if (error.response?.data?.error) {
        showAlert(error.response.data.error, 'error');
      } else {
        showAlert('Error updating status', 'error');
      }
    }
  };

  // Helper function to get available status options based on driver assignment
  const getAvailableStatusOptions = (parcel) => {
    const hasDriver = parcel.assigned_driver_id;
    
    if (!hasDriver) {
      // No driver assigned - only allow unassigned and pending
      return [
        { value: 'unassigned', label: 'Unassigned' },
        { value: 'pending', label: 'Pending' }
      ];
    } else {
      // Driver assigned - allow all statuses including unassigned (which will remove driver)
      return [
        { value: 'unassigned', label: 'Unassigned (removes driver)' },
        { value: 'assigned', label: 'Assigned' },
        { value: 'in_transit', label: 'In Transit' },
        { value: 'completed', label: 'Completed' },
        { value: 'pending', label: 'Pending' }
      ];
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      showAlert('Please select a CSV file', 'warning');
      return;
    }

    setUploadProgress(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', csvFile);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/upload-parcels`, uploadFormData);
      const { successCount, errorCount, duplicateCount, duplicatesFileUrl } = response.data;
      
        setCsvFile(null);
      fetchData();
      
      // Create a detailed success message
      let message = `CSV processed successfully! ✅ ${successCount} records added`;
      
      if (errorCount > 0) {
        message += `, ❌ ${errorCount} errors`;
      }
      
      if (duplicateCount > 0) {
        message += `, 🔄 ${duplicateCount} duplicates found`;
        
        // Auto-download the duplicates file if it exists
        if (duplicatesFileUrl) {
          setTimeout(() => {
            const link = document.createElement('a');
            link.href = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${duplicatesFileUrl}`;
            link.download = 'duplicates_export.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showAlert(`📥 Duplicates file downloaded! Found ${duplicateCount} duplicate phone numbers.`, 'warning');
          }, 1000);
        }
      }
      
      showAlert(message, duplicateCount > 0 ? 'warning' : 'success');
    } catch (error) {
      showAlert('Error uploading CSV', 'error');
    } finally {
      setUploadProgress(false);
    }
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

  const paginatedParcels = filteredParcels.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Helper function to clear all filters
  const clearAllFilters = () => {
    setFilterStatus('All');
    setFilterDriver('All');
    setSearchTerm('');
  };

  // Helper function to check if any filters are active
  const hasActiveFilters = () => {
    return filterStatus !== 'All' || filterDriver !== 'All' || searchTerm !== '';
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
          Parcel Management
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Manage all parcels, assignments, and bulk operations
        </Typography>
      </Box>

      {/* Centered Parcel Statistics */}
      <ParcelStats parcelsData={parcels} driversData={drivers} />

      {/* Action Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} justifyContent="center">
        {/* Add Parcel Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, minHeight: '140px', cursor: 'pointer' }} 
                onClick={() => setOpenDialog(true)}>
            <CardContent sx={{ textAlign: 'center', py: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Avatar sx={{ bgcolor: '#667eea', mx: 'auto', mb: 2, width: 40, height: 40 }}>
                <AddIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
                Add New Parcel
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                Create individual parcel entries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* CSV Upload Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, minHeight: '140px' }}>
            <CardContent sx={{ textAlign: 'center', py: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Avatar sx={{ bgcolor: '#10b981', mx: 'auto', mb: 1, width: 40, height: 40 }}>
                <UploadIcon />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '1rem' }}>
                Bulk Upload
              </Typography>
              
              {/* File Selection Area */}
              <Box sx={{ mb: 1, minHeight: '45px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  style={{ display: 'none' }}
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button 
                    variant="outlined" 
                    component="span" 
                    size="small" 
                    sx={{ 
                      minWidth: '120px',
                      height: '32px',
                      fontSize: '0.75rem',
                      padding: '6px 12px',
                      mb: csvFile ? 0.5 : 0
                    }}
                  >
                    {csvFile ? 'Change File' : 'Choose CSV'}
                  </Button>
                </label>
                
                {/* Display selected filename */}
                {csvFile && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#10b981', 
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      maxWidth: '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      mt: 0.5
                    }}
                    title={csvFile.name}
                  >
                    📄 {csvFile.name}
                  </Typography>
                )}
              </Box>
              
              <Button 
                onClick={handleCsvUpload} 
                disabled={!csvFile || uploadProgress}
                size="small"
                variant="contained"
                sx={{
                  minWidth: '80px',
                  height: '32px',
                  fontSize: '0.75rem',
                  padding: '6px 12px'
                }}
              >
                {uploadProgress ? <CircularProgress size={14} /> : 'Upload'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderRadius: 3, 
            minHeight: '140px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent sx={{ textAlign: 'center', py: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, fontSize: '2.5rem' }}>
                {parcels.length}
              </Typography>
              <Typography variant="h6" sx={{ fontSize: '1rem', mb: 0.5 }}>Total Parcels</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.85rem' }}>
                {filteredParcels.length} filtered results
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter Bar */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search parcels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: '#9ca3af', mr: 1 }} />,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Grid>
            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Filter by Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
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
            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Filter by Driver</InputLabel>
                <Select
                  value={filterDriver}
                  label="Filter by Driver"
                  onChange={(e) => setFilterDriver(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All">All Drivers</MenuItem>
                  <MenuItem value="Unassigned">Unassigned</MenuItem>
                  {drivers.map(driver => (
                    <MenuItem key={driver.id} value={driver.id.toString()}>
                      {driver.full_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1, height: '56px' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{ 
                    borderRadius: 2, 
                    height: '56px', 
                    fontSize: '0.875rem',
                    flex: hasActiveFilters() ? 1 : '1 1 100%'
                  }}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/sample-parcels.csv';
                    link.download = 'sample-parcels.csv';
                    link.click();
                  }}
                >
                  Download Template
                </Button>
                {hasActiveFilters() && (
                  <Button
                    variant="outlined"
                    onClick={clearAllFilters}
                    sx={{
                      borderRadius: 2,
                      height: '56px',
                      fontSize: '0.875rem',
                      borderColor: '#667eea',
                      color: '#667eea',
                      flex: 1,
                      '&:hover': {
                        borderColor: '#5a67d8',
                        bgcolor: 'rgba(102, 126, 234, 0.04)'
                      }
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Parcels Table */}
      <Card sx={{ borderRadius: 3 }}>
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid #e2e8f0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Parcels List ({filteredParcels.length})
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {filteredParcels.length !== parcels.length ? 
                `Showing ${filteredParcels.length} of ${parcels.length} parcels` : 
                'Manage and assign parcels to drivers'
              }
              {(filterStatus !== 'All' || filterDriver !== 'All') && (
                <span> • Active filters: {[
                  filterStatus !== 'All' ? `Status: ${filterStatus}` : null,
                  filterDriver !== 'All' ? `Driver: ${filterDriver === 'Unassigned' ? 'Unassigned' : drivers.find(d => d.id.toString() === filterDriver)?.full_name || filterDriver}` : null
                ].filter(Boolean).join(', ')}</span>
              )}
            </Typography>
          </Box>
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
                    <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Weight</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Assign Driver</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedParcels.map((parcel) => {
                    const assignedDriver = drivers.find(driver => driver.id === parcel.assigned_driver_id);
                    return (
                      <TableRow key={parcel.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {parcel.customer_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {parcel.id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{parcel.phone_number}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            PIN: {parcel.pin_code}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: '200px' }}>
                          <Tooltip title={parcel.address}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {parcel.address}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{parcel.weight} kg</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {getStatusChip(parcel.status)}
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                              <Select
                                value={parcel.status}
                                onChange={(e) => handleStatusUpdate(parcel.id, e.target.value)}
                                sx={{ fontSize: '0.75rem', height: '32px' }}
                              >
                                {getAvailableStatusOptions(parcel).map(option => (
                                  <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {!parcel.assigned_driver_id && parcel.status !== 'unassigned' && (
                              <Typography variant="caption" sx={{ color: '#f59e0b', fontSize: '0.7rem' }}>
                                ⚠️ Driver required for this status
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={parcel.assigned_driver_id || ''}
                              onChange={(e) => handleAssign(parcel.id, e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>Select Driver</em>
                              </MenuItem>
                              {drivers.map(driver => (
                                <MenuItem key={driver.id} value={driver.id}>
                                  {driver.full_name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          {assignedDriver && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" sx={{ flex: 1 }}>
                              Assigned: {assignedDriver.full_name}
      </Typography>
                                <Tooltip title="Unassign Driver">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleUnassign(parcel.id)}
                                    sx={{ color: '#ef4444', padding: '2px' }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                          )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit Parcel">
                              <IconButton 
                                onClick={() => handleEdit(parcel)}
                                sx={{ color: '#3b82f6', padding: '6px' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Parcel">
                              <IconButton 
                                onClick={() => handleDeleteClick(parcel)}
                                sx={{ color: '#ef4444', padding: '6px' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filteredParcels.length}
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

      {/* Add Parcel Dialog */}
      <Dialog open={openDialog} onClose={resetForm} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {editingParcel ? 'Edit Parcel' : 'Add New Parcel'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
        <TextField
                  fullWidth
          label="Customer Name"
          name="customer_name"
          value={formData.customer_name}
          onChange={handleChange}
          required
                  margin="normal"
                  error={!!formErrors.customer_name}
                  helperText={formErrors.customer_name}
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
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
        <TextField
                  fullWidth
                  label="Weight (kg)"
          name="weight"
                  type="number"
          value={formData.weight}
          onChange={handleChange}
          required
                  margin="normal"
                  error={!!formErrors.weight}
                  helperText={formErrors.weight || 'Enter weight in kilograms'}
                  inputProps={{
                    min: "0.1",
                    max: "1000",
                    step: "0.1"
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
              <Grid item xs={12} sm={6}>
        <TextField
                  fullWidth
                  label="PIN Code"
          name="pin_code"
          value={formData.pin_code}
          onChange={handleChange}
          required
                  margin="normal"
                  error={!!formErrors.pin_code}
                  helperText={formErrors.pin_code || 'Enter 6-digit PIN code'}
                  inputProps={{
                    maxLength: 6,
                    pattern: '[0-9]*',
                    inputMode: 'numeric'
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
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
                  multiline
                  rows={2}
                  margin="normal"
                  error={!!formErrors.address}
                  helperText={formErrors.address || 'Enter complete delivery address'}
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
              <Grid item xs={12} sm={6}>
        <TextField
                  fullWidth
          label="Latitude"
          name="latitude"
                  type="number"
                  inputProps={{ step: "any" }}
          value={formData.latitude}
          onChange={handleChange}
          required
                  margin="normal"
                  error={!!formErrors.latitude}
                  helperText={formErrors.latitude || 'Enter latitude (-90 to 90)'}
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
              <Grid item xs={12} sm={6}>
        <TextField
                  fullWidth
          label="Longitude"
          name="longitude"
                  type="number"
                  inputProps={{ step: "any" }}
          value={formData.longitude}
          onChange={handleChange}
          required
                  margin="normal"
                  error={!!formErrors.longitude}
                  helperText={formErrors.longitude || 'Enter longitude (-180 to 180)'}
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
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
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
              {loading ? <CircularProgress size={20} /> : (editingParcel ? 'Update Parcel' : 'Add Parcel')}
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
            Delete Parcel
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this parcel?
          </Typography>
          {parcelToDelete && (
            <Box sx={{ 
              bgcolor: '#f8fafc', 
              p: 2, 
              borderRadius: 2,
              border: '1px solid #e2e8f0'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Parcel Details:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Customer:</strong> {parcelToDelete.customer_name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Phone:</strong> {parcelToDelete.phone_number}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Address:</strong> {parcelToDelete.address}
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {parcelToDelete.status}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ mt: 2, color: '#dc2626' }}>
            This action cannot be undone. The parcel will be permanently removed from the system.
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
            Delete Parcel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ParcelsPage;
