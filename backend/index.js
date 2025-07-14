const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection error:', err);
        return;
    }
    console.log('MySQL connected!');
});

// Validation functions
const validateFullName = (name) => {
    if (!name || typeof name !== 'string') {
        return 'Full name is required';
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
        return 'Full name must be at least 2 characters long';
    }
    if (trimmedName.length > 50) {
        return 'Full name must be less than 50 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
        return 'Full name can only contain letters and spaces';
    }
    return null;
};

const validatePhoneNumber = (phone) => {
    if (!phone || typeof phone !== 'string') {
        return 'Phone number is required';
    }
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
        return 'Phone number must be exactly 10 digits';
    }
    return null;
};

const validateVehicleDetails = (vehicle) => {
    if (!vehicle || typeof vehicle !== 'string') {
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
    
    return null;
};

const validateWeight = (weight) => {
    if (weight === undefined || weight === null || weight === '') {
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
    return null;
};

const validatePinCode = (pinCode) => {
    if (!pinCode || typeof pinCode !== 'string') {
        return 'PIN code is required';
    }
    const cleanPin = pinCode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
        return 'PIN code must be exactly 6 digits';
    }
    return null;
};

const validateAddress = (address) => {
    if (!address || typeof address !== 'string') {
        return 'Address is required';
    }
    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 10) {
        return 'Address must be at least 10 characters long';
    }
    if (trimmedAddress.length > 200) {
        return 'Address must be less than 200 characters';
    }
    return null;
};

const validateLatitude = (lat) => {
    if (lat === undefined || lat === null || lat === '') {
        return 'Latitude is required';
    }
    const latNum = parseFloat(lat);
    if (isNaN(latNum)) {
        return 'Latitude must be a valid number';
    }
    if (latNum < -90 || latNum > 90) {
        return 'Latitude must be between -90 and 90';
    }
    return null;
};

const validateLongitude = (lng) => {
    if (lng === undefined || lng === null || lng === '') {
        return 'Longitude is required';
    }
    const lngNum = parseFloat(lng);
    if (isNaN(lngNum)) {
        return 'Longitude must be a valid number';
    }
    if (lngNum < -180 || lngNum > 180) {
        return 'Longitude must be between -180 and 180';
    }
    return null;
};

// Function to generate random Chennai coordinates
const generateChennaiCoordinates = () => {
    // Chennai CITY bounding box (avoiding Bay of Bengal sea): North: 13.25, South: 12.82, East: 80.22, West: 80.10
    const lat = 12.82 + Math.random() * 0.43; // 12.82 to 13.25
    const lng = 80.10 + Math.random() * 0.12; // 80.10 to 80.22
    return {
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6))
    };
};

// Function to validate Chennai coordinates
const validateChennaiCoordinates = (lat, lng) => {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    // Check if coordinates are valid numbers and within Chennai CITY area (avoiding sea)
    return !isNaN(latNum) && !isNaN(lngNum) && 
           latNum >= 12.82 && latNum <= 13.25 &&
           lngNum >= 80.10 && lngNum <= 80.22;
};

// Function to ensure driver has valid coordinates
const ensureValidDriverCoordinates = (driverData) => {
    const { latitude, longitude } = driverData;
    
    // If no coordinates provided or invalid coordinates, generate Chennai coordinates
    if (!validateChennaiCoordinates(latitude, longitude)) {
        const coords = generateChennaiCoordinates();
        console.log(`Generated Chennai coordinates for driver: ${coords.latitude}, ${coords.longitude}`);
        return {
            ...driverData,
            latitude: coords.latitude,
            longitude: coords.longitude
        };
    }
    
    return driverData;
};

// Function to check for duplicate names (excluding current driver during edit)
const checkDuplicateName = (name, excludeId = null) => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT id FROM drivers WHERE LOWER(full_name) = LOWER(?)';
        let params = [name.trim()];
        
        console.log('checkDuplicateName - Query:', query);
        console.log('checkDuplicateName - Params:', params);
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
            console.log('checkDuplicateName - Updated query with excludeId:', query);
            console.log('checkDuplicateName - Updated params:', params);
        }
        
        db.query(query, params, (err, result) => {
            if (err) {
                console.error('checkDuplicateName - Database error:', err);
                reject(err);
            } else {
                console.log('checkDuplicateName - Query result:', result);
                console.log('checkDuplicateName - Result length:', result.length);
                console.log('checkDuplicateName - Returning:', result.length > 0);
                resolve(result.length > 0);
            }
        });
    });
};

// Function to check for duplicate phone numbers (excluding current driver during edit)
const checkDuplicatePhone = (phone, excludeId = null) => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT id FROM drivers WHERE phone_number = ?';
        let params = [phone.replace(/\D/g, '')];
        
        console.log('checkDuplicatePhone - Query:', query);
        console.log('checkDuplicatePhone - Params:', params);
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
            console.log('checkDuplicatePhone - Updated query with excludeId:', query);
            console.log('checkDuplicatePhone - Updated params:', params);
        }
        
        db.query(query, params, (err, result) => {
            if (err) {
                console.error('checkDuplicatePhone - Database error:', err);
                reject(err);
            } else {
                console.log('checkDuplicatePhone - Query result:', result);
                console.log('checkDuplicatePhone - Result length:', result.length);
                console.log('checkDuplicatePhone - Returning:', result.length > 0);
                resolve(result.length > 0);
            }
        });
    });
};

// Function to check for duplicate vehicle details (excluding current driver during edit)
const checkDuplicateVehicle = (vehicle, excludeId = null) => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT id FROM drivers WHERE vehicle_details = ?';
        let params = [vehicle.trim().toUpperCase().replace(/\s/g, '')];
        
        console.log('checkDuplicateVehicle - Query:', query);
        console.log('checkDuplicateVehicle - Params:', params);
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
            console.log('checkDuplicateVehicle - Updated query with excludeId:', query);
            console.log('checkDuplicateVehicle - Updated params:', params);
        }
        
        db.query(query, params, (err, result) => {
            if (err) {
                console.error('checkDuplicateVehicle - Database error:', err);
                reject(err);
            } else {
                console.log('checkDuplicateVehicle - Query result:', result);
                console.log('checkDuplicateVehicle - Result length:', result.length);
                console.log('checkDuplicateVehicle - Returning:', result.length > 0);
                resolve(result.length > 0);
            }
        });
    });
};

// Function to check for duplicate parcel phone numbers (excluding current parcel during edit)
const checkDuplicateParcelPhone = (phone, excludeId = null) => {
    return new Promise((resolve, reject) => {
        let query = 'SELECT id FROM parcels WHERE phone_number = ?';
        let params = [phone.replace(/\D/g, '')];
        
        console.log('checkDuplicateParcelPhone - Query:', query);
        console.log('checkDuplicateParcelPhone - Params:', params);
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
            console.log('checkDuplicateParcelPhone - Updated query with excludeId:', query);
            console.log('checkDuplicateParcelPhone - Updated params:', params);
        }
        
        db.query(query, params, (err, result) => {
            if (err) {
                console.error('checkDuplicateParcelPhone - Database error:', err);
                reject(err);
            } else {
                console.log('checkDuplicateParcelPhone - Query result:', result);
                console.log('checkDuplicateParcelPhone - Result length:', result.length);
                console.log('checkDuplicateParcelPhone - Returning:', result.length > 0);
                resolve(result.length > 0);
            }
        });
    });
};

// Drivers endpoints
app.get('/drivers', (req, res) => {
    db.query('SELECT * FROM drivers ORDER BY created_at DESC', (err, result) => {
        if (err) {
            console.error('Error fetching drivers:', err);
            res.status(500).json({ error: 'Error fetching drivers' });
        } else {
            res.json(result);
        }
    });
});

app.post('/drivers', (req, res) => {
    const { full_name, phone_number, vehicle_details, is_active = 1, latitude, longitude } = req.body;
    
    // Convert is_active to integer (1 or 0) for database
    const isActiveValue = is_active === true || is_active === 1 || is_active === '1' ? 1 : 0;
    
    // Validate all fields
    const nameError = validateFullName(full_name);
    const phoneError = validatePhoneNumber(phone_number);
    const vehicleError = validateVehicleDetails(vehicle_details);
    
    if (nameError || phoneError || vehicleError) {
        const errors = [nameError, phoneError, vehicleError].filter(Boolean);
        return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Format vehicle number consistently
    const formattedVehicle = vehicle_details.trim().toUpperCase().replace(/\s/g, '');
    
    // Ensure driver has valid Chennai coordinates
    const driverData = ensureValidDriverCoordinates({
        full_name: full_name.trim(),
        phone_number: phone_number.replace(/\D/g, ''),
        vehicle_details: formattedVehicle,
        is_active: isActiveValue,
        latitude,
        longitude
    });
    
    // Insert driver with coordinates - database unique constraints will prevent duplicates
    db.query(
        'INSERT INTO drivers (full_name, phone_number, vehicle_details, is_active, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
        [driverData.full_name, driverData.phone_number, driverData.vehicle_details, driverData.is_active, driverData.latitude, driverData.longitude],
        (err, result) => {
            if (err) {
                console.error('Error adding driver:', err);
                console.error('Error code:', err.code);
                console.error('Error message:', err.message);
                console.error('Error SQL state:', err.sqlState);
                
                // Handle duplicate entry errors
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log('Duplicate entry detected, analyzing...');
                    console.log('Error message:', err.message);
                    
                    // Check the error message for the specific constraint violated
                    if (err.message.includes('drivers.unique_vehicle_details') || err.message.includes('unique_vehicle_details')) {
                        console.log('Duplicate vehicle details constraint violated');
                        return res.status(400).json({ error: 'A driver with this vehicle number already exists' });
                    } else if (err.message.includes('drivers.unique_phone_number') || err.message.includes('unique_phone_number')) {
                        console.log('Duplicate phone constraint violated');
                        return res.status(400).json({ error: 'A driver with this phone number already exists' });
                    } else if (err.message.includes('drivers.unique_full_name') || err.message.includes('unique_full_name')) {
                        console.log('Duplicate name constraint violated');
                        return res.status(400).json({ error: 'A driver with this name already exists' });
                    } else {
                        // Fallback - try to determine from the SQL message
                        console.log('Unknown duplicate constraint, using fallback logic');
                        const errorLower = err.message.toLowerCase();
                        if (errorLower.includes('vehicle')) {
                            return res.status(400).json({ error: 'A driver with this vehicle number already exists' });
                        } else if (errorLower.includes('phone')) {
                            return res.status(400).json({ error: 'A driver with this phone number already exists' });
                        } else if (errorLower.includes('name')) {
                            return res.status(400).json({ error: 'A driver with this name already exists' });
                        } else {
                            return res.status(400).json({ error: 'This driver already exists (duplicate information)' });
                        }
                    }
                }
                
                res.status(500).json({ error: 'Error adding driver' });
            } else {
                res.json({ 
                    message: 'Driver added successfully',
                    driverId: result.insertId,
                    coordinates: {
                        latitude: driverData.latitude,
                        longitude: driverData.longitude
                    }
                });
            }
        }
    );
});

app.put('/drivers/:id', (req, res) => {
    const driverId = req.params.id;
    const { full_name, phone_number, vehicle_details, is_active = 1, latitude, longitude } = req.body;
    
    console.log('Driver Update Request:', {
        driverId,
        full_name,
        phone_number,
        vehicle_details,
        is_active,
        latitude,
        longitude,
        body: req.body
    });
    
    // Convert is_active to integer (1 or 0) for database
    const isActiveValue = is_active === true || is_active === 1 || is_active === '1' ? 1 : 0;
    
    // Validate all fields
    const nameError = validateFullName(full_name);
    const phoneError = validatePhoneNumber(phone_number);
    const vehicleError = validateVehicleDetails(vehicle_details);
    
    console.log('Validation Results:', {
        nameError,
        phoneError,
        vehicleError,
        isActiveValue
    });
    
    if (nameError || phoneError || vehicleError) {
        const errors = [nameError, phoneError, vehicleError].filter(Boolean);
        console.log('Validation failed:', errors);
        return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Format vehicle number consistently
    const formattedVehicle = vehicle_details.trim().toUpperCase().replace(/\s/g, '');
    
    // Ensure driver has valid Chennai coordinates
    const driverData = ensureValidDriverCoordinates({
        full_name: full_name.trim(),
        phone_number: phone_number.replace(/\D/g, ''),
        vehicle_details: formattedVehicle,
        is_active: isActiveValue,
        latitude,
        longitude
    });
    
    // Check for duplicates before updating
    Promise.all([
        checkDuplicateName(full_name, driverId),
        checkDuplicatePhone(phone_number, driverId),
        checkDuplicateVehicle(formattedVehicle, driverId)
    ]).then(([isDuplicateName, isDuplicatePhone, isDuplicateVehicle]) => {
        // Check all duplicates and return the most specific error
        const errors = [];
        if (isDuplicateName) errors.push('name');
        if (isDuplicatePhone) errors.push('phone');
        if (isDuplicateVehicle) errors.push('vehicle');
        
        if (errors.length > 0) {
            // Return specific error for the field that was actually duplicated
            if (isDuplicateVehicle) {
                return res.status(400).json({ error: 'A driver with this vehicle number already exists' });
            } else if (isDuplicatePhone) {
                return res.status(400).json({ error: 'A driver with this phone number already exists' });
            } else if (isDuplicateName) {
                return res.status(400).json({ error: 'A driver with this name already exists' });
            }
        }
    
    // Update driver with coordinates - database unique constraints will prevent duplicates
    db.query(
        'UPDATE drivers SET full_name = ?, phone_number = ?, vehicle_details = ?, is_active = ?, latitude = ?, longitude = ? WHERE id = ?',
        [driverData.full_name, driverData.phone_number, driverData.vehicle_details, driverData.is_active, driverData.latitude, driverData.longitude, driverId],
        (err, result) => {
            if (err) {
                console.error('Database Error updating driver:', err);
                console.error('Error code:', err.code);
                console.error('Error message:', err.message);
                console.error('Error SQL state:', err.sqlState);
                
                // Handle duplicate entry errors
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log('Duplicate entry detected during update, analyzing...');
                    console.log('Error message:', err.message);
                    
                    // Check the error message for the specific constraint violated
                    if (err.message.includes('drivers.unique_full_name') || err.message.includes('unique_full_name')) {
                        console.log('Duplicate name constraint violated');
                        return res.status(400).json({ error: 'A driver with this name already exists' });
                    } else if (err.message.includes('drivers.unique_phone_number') || err.message.includes('unique_phone_number')) {
                        console.log('Duplicate phone constraint violated');
                        return res.status(400).json({ error: 'A driver with this phone number already exists' });
                        } else if (err.message.includes('drivers.unique_vehicle_details') || err.message.includes('unique_vehicle_details')) {
                            console.log('Duplicate vehicle details constraint violated');
                            return res.status(400).json({ error: 'A driver with this vehicle number already exists' });
                    } else {
                        // Fallback - try to determine from the SQL message
                        console.log('Unknown duplicate constraint, using fallback logic');
                        const errorLower = err.message.toLowerCase();
                        if (errorLower.includes('phone')) {
                            return res.status(400).json({ error: 'A driver with this phone number already exists' });
                        } else if (errorLower.includes('name')) {
                            return res.status(400).json({ error: 'A driver with this name already exists' });
                            } else if (errorLower.includes('vehicle')) {
                                return res.status(400).json({ error: 'A driver with this vehicle number already exists' });
                        } else {
                                return res.status(400).json({ error: 'This driver already exists (duplicate information)' });
                        }
                    }
                }
                
                res.status(500).json({ error: 'Error updating driver' });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Driver not found' });
            } else {
                res.json({ 
                    message: 'Driver updated successfully',
                    coordinates: {
                        latitude: driverData.latitude,
                        longitude: driverData.longitude
                    }
                });
            }
        }
    );
    }).catch(err => {
        console.error('Error checking for duplicates:', err);
        res.status(500).json({ error: 'Error checking for duplicates' });
    });
});

app.delete('/drivers/:id', (req, res) => {
    const driverId = req.params.id;
    
    // First check if driver has assigned parcels
    db.query('SELECT COUNT(*) as count FROM parcels WHERE assigned_driver_id = ?', [driverId], (err, result) => {
        if (err) {
            console.error('Error checking driver assignments:', err);
            return res.status(500).json({ error: 'Error checking driver assignments' });
        }
        
        if (result[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete driver with assigned parcels. Please reassign parcels first.' 
            });
        }
        
        // Safe to delete driver
        db.query('DELETE FROM drivers WHERE id = ?', [driverId], (err, result) => {
            if (err) {
                console.error('Error deleting driver:', err);
                res.status(500).json({ error: 'Error deleting driver' });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Driver not found' });
            } else {
                res.json({ message: 'Driver deleted successfully' });
            }
        });
    });
});

// Parcels endpoints
app.get('/parcels', (req, res) => {
    const query = `
        SELECT p.*, d.full_name as driver_name 
        FROM parcels p 
        LEFT JOIN drivers d ON p.assigned_driver_id = d.id 
        ORDER BY p.created_at DESC
    `;
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching parcels:', err);
            res.status(500).json({ error: 'Error fetching parcels' });
        } else {
            res.json(result);
        }
    });
});

app.post('/parcels', (req, res) => {
    const { customer_name, phone_number, weight, pin_code, address, latitude, longitude, status = 'unassigned' } = req.body;
    
    // Validate all fields
    const nameError = validateFullName(customer_name);
    const phoneError = validatePhoneNumber(phone_number);
    const weightError = validateWeight(weight);
    const pinError = validatePinCode(pin_code);
    const addressError = validateAddress(address);
    const latError = validateLatitude(latitude);
    const lngError = validateLongitude(longitude);
    
    if (nameError || phoneError || weightError || pinError || addressError || latError || lngError) {
        const errors = [nameError, phoneError, weightError, pinError, addressError, latError, lngError].filter(Boolean);
        return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Check for duplicate phone number before inserting
    checkDuplicateParcelPhone(phone_number).then(isDuplicatePhone => {
        if (isDuplicatePhone) {
            return res.status(400).json({ error: 'A parcel with this phone number already exists' });
        }
        
        // Insert parcel - database unique constraints will prevent duplicates
    db.query(
        'INSERT INTO parcels (customer_name, phone_number, weight, pin_code, address, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
            customer_name.trim(), 
            phone_number.replace(/\D/g, ''), 
            parseFloat(weight), 
            pin_code.replace(/\D/g, ''), 
            address.trim(), 
            parseFloat(latitude), 
            parseFloat(longitude), 
            status
        ],
        (err, result) => {
            if (err) {
                console.error('Error adding parcel:', err);
                    console.error('Error code:', err.code);
                    console.error('Error message:', err.message);
                    
                    // Handle duplicate entry errors
                    if (err.code === 'ER_DUP_ENTRY') {
                        console.log('Duplicate entry detected, analyzing...');
                        console.log('Error message:', err.message);
                        
                        if (err.message.includes('parcels.unique_phone_number') || err.message.includes('unique_phone_number')) {
                            console.log('Duplicate phone constraint violated');
                            return res.status(400).json({ error: 'A parcel with this phone number already exists' });
                        } else {
                            // Fallback - try to determine from the SQL message
                            console.log('Unknown duplicate constraint, using fallback logic');
                            const errorLower = err.message.toLowerCase();
                            if (errorLower.includes('phone')) {
                                return res.status(400).json({ error: 'A parcel with this phone number already exists' });
                            } else {
                                return res.status(400).json({ error: 'This parcel already exists (duplicate information)' });
                            }
                        }
                    }
                    
                res.status(500).json({ error: 'Error adding parcel' });
            } else {
                res.json({ 
                    message: 'Parcel added successfully',
                    parcelId: result.insertId 
                });
            }
        }
    );
    }).catch(err => {
        console.error('Error checking for duplicate phone number:', err);
        res.status(500).json({ error: 'Error checking for duplicate phone number' });
    });
});

app.put('/parcels/:id', (req, res) => {
    const parcelId = req.params.id;
    const { customer_name, phone_number, weight, pin_code, address, latitude, longitude, status } = req.body;
    
    // Validate all fields
    const nameError = validateFullName(customer_name);
    const phoneError = validatePhoneNumber(phone_number);
    const weightError = validateWeight(weight);
    const pinError = validatePinCode(pin_code);
    const addressError = validateAddress(address);
    const latError = validateLatitude(latitude);
    const lngError = validateLongitude(longitude);
    
    if (nameError || phoneError || weightError || pinError || addressError || latError || lngError) {
        const errors = [nameError, phoneError, weightError, pinError, addressError, latError, lngError].filter(Boolean);
        return res.status(400).json({ error: errors.join(', ') });
    }
    
    // Check for duplicate phone number before updating
    checkDuplicateParcelPhone(phone_number, parcelId).then(isDuplicatePhone => {
        if (isDuplicatePhone) {
            return res.status(400).json({ error: 'A parcel with this phone number already exists' });
        }
        
        // Update parcel - database unique constraints will prevent duplicates
    db.query(
        'UPDATE parcels SET customer_name = ?, phone_number = ?, weight = ?, pin_code = ?, address = ?, latitude = ?, longitude = ?, status = ? WHERE id = ?',
        [
            customer_name.trim(), 
            phone_number.replace(/\D/g, ''), 
            parseFloat(weight), 
            pin_code.replace(/\D/g, ''), 
            address.trim(), 
            parseFloat(latitude), 
            parseFloat(longitude), 
            status, 
            parcelId
        ],
        (err, result) => {
            if (err) {
                console.error('Error updating parcel:', err);
                    console.error('Error code:', err.code);
                    console.error('Error message:', err.message);
                    
                    // Handle duplicate entry errors
                    if (err.code === 'ER_DUP_ENTRY') {
                        console.log('Duplicate entry detected during update, analyzing...');
                        console.log('Error message:', err.message);
                        
                        if (err.message.includes('parcels.unique_phone_number') || err.message.includes('unique_phone_number')) {
                            console.log('Duplicate phone constraint violated');
                            return res.status(400).json({ error: 'A parcel with this phone number already exists' });
                        } else {
                            // Fallback - try to determine from the SQL message
                            console.log('Unknown duplicate constraint, using fallback logic');
                            const errorLower = err.message.toLowerCase();
                            if (errorLower.includes('phone')) {
                                return res.status(400).json({ error: 'A parcel with this phone number already exists' });
                            } else {
                                return res.status(400).json({ error: 'This parcel already exists (duplicate information)' });
                            }
                        }
                    }
                    
                res.status(500).json({ error: 'Error updating parcel' });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Parcel not found' });
            } else {
                res.json({ message: 'Parcel updated successfully' });
            }
        }
    );
    }).catch(err => {
        console.error('Error checking for duplicate phone number:', err);
        res.status(500).json({ error: 'Error checking for duplicate phone number' });
    });
});

app.delete('/parcels/:id', (req, res) => {
    const parcelId = req.params.id;
    
    db.query('DELETE FROM parcels WHERE id = ?', [parcelId], (err, result) => {
        if (err) {
            console.error('Error deleting parcel:', err);
            res.status(500).json({ error: 'Error deleting parcel' });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Parcel not found' });
        } else {
            res.json({ message: 'Parcel deleted successfully' });
        }
    });
});

app.put('/parcels/:id/assign', (req, res) => {
    const parcelId = req.params.id;
    const { driver_id } = req.body;

    if (!driver_id) {
        return res.status(400).json({ error: 'Driver ID is required' });
    }

    // First verify the driver exists and is active
    db.query('SELECT * FROM drivers WHERE id = ? AND is_active = 1', [driver_id], (err, driverResult) => {
        if (err) {
            console.error('Error checking driver:', err);
            return res.status(500).json({ error: 'Error checking driver' });
        }
        
        if (driverResult.length === 0) {
            return res.status(400).json({ error: 'Driver not found or inactive' });
        }

        // Update parcel assignment
        db.query(
            'UPDATE parcels SET assigned_driver_id = ?, status = "assigned" WHERE id = ?',
            [driver_id, parcelId],
            (err, result) => {
                if (err) {
                    console.error('Error assigning parcel:', err);
                    res.status(500).json({ error: 'Error assigning parcel' });
                } else if (result.affectedRows === 0) {
                    res.status(404).json({ error: 'Parcel not found' });
                } else {
                    // Log the assignment
                    db.query(
                        'INSERT INTO parcel_assignments (parcel_id, driver_id, assigned_by) VALUES (?, ?, ?)',
                        [parcelId, driver_id, 1], // assuming admin ID 1 for now
                        (logErr) => {
                            if (logErr) {
                                console.error('Error logging assignment:', logErr);
                            }
                        }
                    );
                    
                    res.json({ message: 'Driver assigned successfully and status set to assigned' });
                }
            }
        );
    });
});

// Unassign driver from parcel
app.put('/parcels/:id/unassign', (req, res) => {
    const parcelId = req.params.id;
    
    db.query(
        'UPDATE parcels SET assigned_driver_id = NULL, status = "unassigned" WHERE id = ?',
        [parcelId],
        (err, result) => {
            if (err) {
                console.error('Error unassigning parcel:', err);
                res.status(500).json({ error: 'Error unassigning parcel' });
            } else if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Parcel not found' });
            } else {
                res.json({ message: 'Driver unassigned successfully' });
            }
        }
    );
});

// Update parcel status
app.put('/parcels/:id/status', (req, res) => {
    const parcelId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['unassigned', 'assigned', 'in_transit', 'completed', 'pending'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    
    // First, get the current parcel data to check driver assignment
    db.query('SELECT assigned_driver_id FROM parcels WHERE id = ?', [parcelId], (err, parcelResult) => {
        if (err) {
            console.error('Error fetching parcel:', err);
            return res.status(500).json({ error: 'Error fetching parcel data' });
        }
        
        if (parcelResult.length === 0) {
            return res.status(404).json({ error: 'Parcel not found' });
        }
        
        const currentDriverId = parcelResult[0].assigned_driver_id;
        
        // Business logic validation
        if (status === 'unassigned') {
            // If setting to unassigned, remove driver assignment
            db.query(
                'UPDATE parcels SET status = ?, assigned_driver_id = NULL WHERE id = ?',
                [status, parcelId],
                (err, result) => {
                    if (err) {
                        console.error('Error updating parcel status:', err);
                        res.status(500).json({ error: 'Error updating parcel status' });
                    } else {
                        res.json({ message: 'Parcel status updated and driver unassigned' });
                    }
                }
            );
        } else if (status === 'assigned') {
            // For assigned status, a driver must be assigned
            if (!currentDriverId) {
                return res.status(400).json({ 
                    error: 'Cannot set status to "assigned" without a driver. Please assign a driver first.' 
                });
            }
            
            // Update only status since driver is already assigned
            db.query(
                'UPDATE parcels SET status = ? WHERE id = ?',
                [status, parcelId],
                (err, result) => {
                    if (err) {
                        console.error('Error updating parcel status:', err);
                        res.status(500).json({ error: 'Error updating parcel status' });
                    } else {
                        res.json({ message: 'Parcel status updated successfully' });
                    }
                }
            );
        } else if (status === 'in_transit' || status === 'completed') {
            // For in_transit and completed, a driver must be assigned
            if (!currentDriverId) {
                return res.status(400).json({ 
                    error: `Cannot set status to "${status.replace('_', ' ')}" without a driver. Please assign a driver first.` 
                });
            }
            
            // Update status
            db.query(
                'UPDATE parcels SET status = ? WHERE id = ?',
                [status, parcelId],
                (err, result) => {
                    if (err) {
                        console.error('Error updating parcel status:', err);
                        res.status(500).json({ error: 'Error updating parcel status' });
                    } else {
                        res.json({ message: 'Parcel status updated successfully' });
                    }
                }
            );
        } else {
            // For pending or other statuses, just update the status
            db.query(
                'UPDATE parcels SET status = ? WHERE id = ?',
                [status, parcelId],
                (err, result) => {
                    if (err) {
                        console.error('Error updating parcel status:', err);
                        res.status(500).json({ error: 'Error updating parcel status' });
                    } else {
                        res.json({ message: 'Parcel status updated successfully' });
                    }
                }
            );
        }
    });
});

// Bulk parcel assignment endpoint
app.post('/parcels/bulk-assign', (req, res) => {
    const { parcel_ids, driver_id } = req.body;
    
    if (!parcel_ids || !Array.isArray(parcel_ids) || !driver_id) {
        return res.status(400).json({ error: 'Invalid parcel IDs or driver ID' });
    }

    const placeholders = parcel_ids.map(() => '?').join(',');
    const query = `UPDATE parcels SET assigned_driver_id = ?, status = 'assigned' WHERE id IN (${placeholders})`;
    
    db.query(query, [driver_id, ...parcel_ids], (err, result) => {
        if (err) {
            console.error('Error bulk assigning parcels:', err);
            res.status(500).json({ error: 'Error bulk assigning parcels' });
        } else {
            res.json({ 
                message: `${result.affectedRows} parcels assigned successfully`,
                affectedRows: result.affectedRows 
            });
        }
    });
});

// CSV Upload
const upload = multer({ dest: 'uploads/' });
const XLSX = require('xlsx');

app.post('/upload-parcels', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('CSV Upload started:', req.file.filename);
    const results = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            console.log('CSV Row data:', data);
            results.push(data);
        })
        .on('end', async () => {
            console.log(`CSV parsing completed. Total rows: ${results.length}`);
            fs.unlinkSync(req.file.path); // Clean up uploaded file
            
            let successCount = 0;
            let errorCount = 0;
            const duplicateRecords = [];
            const validRecords = [];
            
            // Step 1: Get all existing phone numbers from database
            const getExistingPhones = () => {
                return new Promise((resolve, reject) => {
                    db.query('SELECT phone_number FROM parcels', (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            const existingPhones = new Set(result.map(row => row.phone_number));
                            resolve(existingPhones);
                        }
                    });
                });
            };
            
            try {
                const existingPhones = await getExistingPhones();
                
                // Step 2: First pass - validate all rows and identify phone number patterns
                const processedRows = [];
                const phoneNumberCounts = new Map();
                
                for (let index = 0; index < results.length; index++) {
                const row = results[index];
                console.log(`Processing row ${index + 1}:`, row);
                
                // Clean phone number for validation (remove +91, spaces, dashes)
                    // Only remove country code 91 if phone number is longer than 10 digits
                    let cleanedPhoneNumber = row.phone_number ? row.phone_number.replace(/[\+\-\s]/g, '') : '';
                    if (cleanedPhoneNumber.length > 10 && cleanedPhoneNumber.startsWith('91')) {
                        cleanedPhoneNumber = cleanedPhoneNumber.substring(2);
                    }
                    const finalPhoneNumber = cleanedPhoneNumber.replace(/\D/g, '');
                    console.log(`Original phone: ${row.phone_number}, Cleaned: ${cleanedPhoneNumber}, Final: ${finalPhoneNumber}`);
                
                // Validate all fields using validation functions
                const nameError = validateFullName(row.customer_name);
                const phoneError = validatePhoneNumber(cleanedPhoneNumber);
                const weightError = row.weight ? validateWeight(row.weight) : null;
                const pinError = row.pin_code ? validatePinCode(row.pin_code) : null;
                const addressError = validateAddress(row.address);
                const latError = row.latitude ? validateLatitude(row.latitude) : null;
                const lngError = row.longitude ? validateLongitude(row.longitude) : null;
                
                const validationErrors = [nameError, phoneError, weightError, pinError, addressError, latError, lngError].filter(Boolean);
                
                console.log(`Row ${index + 1} validation:`, {
                    nameError,
                    phoneError,
                    weightError,
                    pinError,
                    addressError,
                    latError,
                    lngError
                });
                
                    // Store processed row data
                    processedRows.push({
                        index: index + 1,
                        originalRow: row,
                        finalPhoneNumber,
                        validationErrors,
                        isValid: validationErrors.length === 0
                    });
                    
                    // Count phone number occurrences (only for valid rows)
                    if (validationErrors.length === 0) {
                        phoneNumberCounts.set(finalPhoneNumber, (phoneNumberCounts.get(finalPhoneNumber) || 0) + 1);
                    }
                }
                
                // Step 3: Second pass - categorize rows based on complete analysis
                const seenPhoneNumbers = new Set(); // Track which phone numbers we've already processed
                
                for (const processedRow of processedRows) {
                    const { index, originalRow, finalPhoneNumber, validationErrors, isValid } = processedRow;
                    
                    // Check for validation errors first
                    if (!isValid) {
                        const errorMsg = `Row ${index}: ${validationErrors.join(', ')}`;
                    console.log('Validation failed:', errorMsg);
                    errors.push(errorMsg);
                    errorCount++;
                        continue;
                    }
                    
                    // Check for duplicate phone numbers
                    const isDuplicateInDB = existingPhones.has(finalPhoneNumber);
                    const isDuplicateInCSV = phoneNumberCounts.get(finalPhoneNumber) > 1;
                    const isFirstOccurrenceInCSV = !seenPhoneNumbers.has(finalPhoneNumber);
                    
                    if (isDuplicateInDB) {
                        // Phone exists in database - always mark as duplicate
                        console.log(`Row ${index}: Duplicate phone number detected (exists in DB) - ${finalPhoneNumber}`);
                        
                        duplicateRecords.push({
                            row_number: index,
                            customer_name: originalRow.customer_name,
                            phone_number: originalRow.phone_number,
                            weight: originalRow.weight,
                            pin_code: originalRow.pin_code,
                            address: originalRow.address,
                            latitude: originalRow.latitude,
                            longitude: originalRow.longitude,
                            status: originalRow.status,
                            duplicate_reason: 'Phone number already exists in database'
                        });
                        
                        errorCount++;
                        continue;
                    }
                    
                    if (isDuplicateInCSV && !isFirstOccurrenceInCSV) {
                        // Phone appears multiple times in CSV, but this is NOT the first occurrence
                        console.log(`Row ${index}: Duplicate phone number detected (within CSV) - ${finalPhoneNumber}`);
                        
                        duplicateRecords.push({
                            row_number: index,
                            customer_name: originalRow.customer_name,
                            phone_number: originalRow.phone_number,
                            weight: originalRow.weight,
                            pin_code: originalRow.pin_code,
                            address: originalRow.address,
                            latitude: originalRow.latitude,
                            longitude: originalRow.longitude,
                            status: originalRow.status,
                            duplicate_reason: 'Duplicate phone number within CSV file'
                        });
                        
                        errorCount++;
                        continue;
                    }
                    
                    // Mark this phone number as seen and add to valid records
                    seenPhoneNumbers.add(finalPhoneNumber);
                    validRecords.push({
                        customer_name: originalRow.customer_name.trim(),
                        phone_number: finalPhoneNumber,
                        weight: originalRow.weight ? parseFloat(originalRow.weight) : null,
                        pin_code: originalRow.pin_code ? originalRow.pin_code.replace(/\D/g, '') : null,
                        address: originalRow.address.trim(),
                        latitude: originalRow.latitude ? parseFloat(originalRow.latitude) : null,
                        longitude: originalRow.longitude ? parseFloat(originalRow.longitude) : null,
                        status: originalRow.status ? originalRow.status.toLowerCase() : 'unassigned'
                    });
                }
                
                // Step 3: Insert valid records into database
                console.log(`Valid records to insert: ${validRecords.length}, Duplicates found: ${duplicateRecords.length}`);
                
                const insertPromises = validRecords.map(record => {
                    return new Promise((resolve, reject) => {
                db.query(
                    'INSERT INTO parcels (customer_name, phone_number, weight, pin_code, address, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                            [record.customer_name, record.phone_number, record.weight, record.pin_code, record.address, record.latitude, record.longitude, record.status],
                    (err, result) => {
                        if (err) {
                                    console.error('Error inserting record:', err);
                                    reject(err);
                        } else {
                                    console.log('Record inserted successfully with ID:', result.insertId);
                                    resolve(result);
                                }
                            }
                        );
                    });
                });
                
                try {
                    await Promise.all(insertPromises);
                    successCount = validRecords.length;
                } catch (insertError) {
                    console.error('Error during bulk insert:', insertError);
                    errors.push('Some records failed to insert due to database errors');
                    successCount = validRecords.length - 1; // Approximate
                }
                
                // Step 4: Create Excel file for duplicates if any exist
                let duplicatesFileUrl = null;
                if (duplicateRecords.length > 0) {
                    try {
                        const worksheet = XLSX.utils.json_to_sheet(duplicateRecords);
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, 'Duplicates');
                        
                        const timestamp = Date.now();
                        const duplicatesFileName = `duplicates_${timestamp}.xlsx`;
                        const duplicatesFilePath = `uploads/${duplicatesFileName}`;
                        
                        XLSX.writeFile(workbook, duplicatesFilePath);
                        duplicatesFileUrl = `/download-duplicates/${duplicatesFileName}`;
                        
                        console.log(`Duplicates Excel file created: ${duplicatesFilePath}`);
                    } catch (excelError) {
                        console.error('Error creating Excel file:', excelError);
                        errors.push('Failed to create duplicates Excel file');
                    }
                }
                
                // Step 5: Send response
                console.log(`CSV processing completed. Success: ${successCount}, Errors: ${errorCount}, Duplicates: ${duplicateRecords.length}`);
                
                res.json({
                    message: 'CSV processing completed',
                    successCount,
                    errorCount,
                    duplicateCount: duplicateRecords.length,
                    duplicatesFileUrl,
                    errors: errors.slice(0, 10) // Return first 10 errors
                });
                
            } catch (dbError) {
                console.error('Database error during CSV processing:', dbError);
                res.status(500).json({ error: 'Database error during processing' });
            }
        })
        .on('error', (err) => {
            console.error('CSV parsing error:', err);
            fs.unlinkSync(req.file.path);
            res.status(400).json({ error: 'Invalid CSV format' });
        });
});

// Endpoint to download duplicates Excel file
app.get('/download-duplicates/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = `uploads/${filename}`;
    
    // Security check - ensure filename is safe
    if (!filename.match(/^duplicates_\d+\.xlsx$/)) {
        return res.status(400).json({ error: 'Invalid file name' });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, `duplicates_export.xlsx`, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(500).json({ error: 'Error downloading file' });
        } else {
            // Optionally delete the file after download
            setTimeout(() => {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Temporary file deleted: ${filePath}`);
                } catch (deleteError) {
                    console.error('Error deleting temporary file:', deleteError);
                }
            }, 5000); // Delete after 5 seconds
        }
        });
});

// Dashboard statistics endpoint
app.get('/dashboard/stats', (req, res) => {
    const statsQuery = `
        SELECT 
            COUNT(*) as total_parcels,
            SUM(CASE WHEN status = 'unassigned' THEN 1 ELSE 0 END) as unassigned,
            SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
            SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
        FROM parcels
    `;
    
    const driversQuery = `
        SELECT 
            COUNT(*) as total_drivers,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_drivers
        FROM drivers
    `;
    
    db.query(statsQuery, (err, parcelStats) => {
        if (err) {
            console.error('Error fetching parcel stats:', err);
            return res.status(500).json({ error: 'Error fetching statistics' });
        }
        
        db.query(driversQuery, (err, driverStats) => {
            if (err) {
                console.error('Error fetching driver stats:', err);
                return res.status(500).json({ error: 'Error fetching statistics' });
            }
            
            res.json({
                parcels: parcelStats[0],
                drivers: driverStats[0]
            });
        });
    });
});

// Driver routes endpoints
app.get('/driver-routes', (req, res) => {
    const query = `
        SELECT 
            d.id as driver_id,
            d.full_name as driver_name,
            d.phone_number as driver_phone,
            d.vehicle_details,
            d.latitude as driver_latitude,
            d.longitude as driver_longitude,
            d.is_active,
            COUNT(p.id) as total_parcels,
            SUM(CASE WHEN p.status = 'assigned' THEN 1 ELSE 0 END) as assigned_parcels,
            SUM(CASE WHEN p.status = 'in_transit' THEN 1 ELSE 0 END) as in_transit_parcels,
            SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_parcels
        FROM drivers d
        LEFT JOIN parcels p ON d.id = p.assigned_driver_id
        WHERE d.is_active = 1
        GROUP BY d.id, d.full_name, d.phone_number, d.vehicle_details, d.latitude, d.longitude, d.is_active
        ORDER BY total_parcels DESC, d.full_name
    `;
    
    db.query(query, (err, result) => {
        if (err) {
            console.error('Error fetching driver routes data:', err);
            res.status(500).json({ error: 'Error fetching driver routes data' });
        } else {
            res.json(result);
        }
    });
});

app.get('/driver-routes/:driverId', (req, res) => {
    const driverId = req.params.driverId;
    
    // Get driver details and their assigned parcels
    const driverQuery = `
        SELECT 
            d.id,
            d.full_name as driver_name,
            d.phone_number as driver_phone,
            d.vehicle_details,
            d.latitude as driver_latitude,
            d.longitude as driver_longitude,
            d.is_active
        FROM drivers d
        WHERE d.id = ? AND d.is_active = 1
    `;
    
    const parcelsQuery = `
        SELECT 
            p.id,
            p.customer_name,
            p.phone_number,
            p.weight,
            p.pin_code,
            p.address,
            p.latitude,
            p.longitude,
            p.status,
            p.created_at
        FROM parcels p
        WHERE p.assigned_driver_id = ?
        ORDER BY p.created_at ASC
    `;
    
    db.query(driverQuery, [driverId], (err, driverResult) => {
        if (err) {
            console.error('Error fetching driver details:', err);
            return res.status(500).json({ error: 'Error fetching driver details' });
        }
        
        if (driverResult.length === 0) {
            return res.status(404).json({ error: 'Driver not found or inactive' });
        }
        
        const driver = driverResult[0];
        
        db.query(parcelsQuery, [driverId], (err, parcelsResult) => {
            if (err) {
                console.error('Error fetching driver parcels:', err);
                return res.status(500).json({ error: 'Error fetching driver parcels' });
            }
            
            // Organize parcels into routes (groups of 3-4 parcels each)
            const routes = organizeIntoRoutes(parcelsResult);
            
            res.json({
                driver: driver,
                parcels: parcelsResult,
                routes: routes,
                totalParcels: parcelsResult.length,
                totalRoutes: routes.length
            });
        });
    });
});

// Helper function to organize parcels into routes
function organizeIntoRoutes(parcels) {
    const routes = [];
    const routeSizes = [4, 3, 3]; // First route has 4, then 3, then 3, etc.
    let currentIndex = 0;
    let routeNumber = 1;
    
    while (currentIndex < parcels.length) {
        const routeSize = routeSizes[(routeNumber - 1) % routeSizes.length];
        const routeParcels = parcels.slice(currentIndex, currentIndex + routeSize);
        
        if (routeParcels.length > 0) {
            routes.push({
                routeId: routeNumber,
                routeName: `Route ${routeNumber}`,
                parcels: routeParcels,
                parcelCount: routeParcels.length,
                totalWeight: routeParcels.reduce((sum, parcel) => sum + parseFloat(parcel.weight || 0), 0),
                routeColor: getRouteColor(routeNumber)
            });
        }
        
        currentIndex += routeSize;
        routeNumber++;
    }
    
    return routes;
}

// Helper function to get route colors
function getRouteColor(routeNumber) {
    const colors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#96CEB4', // Green
        '#FECA57', // Yellow
        '#FF9FF3', // Pink
        '#54A0FF', // Light Blue
        '#5F27CD', // Purple
        '#00D2D3', // Cyan
        '#FF9F43'  // Orange
    ];
    return colors[(routeNumber - 1) % colors.length];
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});



