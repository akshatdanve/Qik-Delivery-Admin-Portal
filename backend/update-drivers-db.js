const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Function to generate random Chennai coordinates
function generateChennaiCoordinates() {
    // Chennai CITY bounding box (more restrictive to avoid sea):
    // North: 13.25, South: 12.82
    // East: 80.22, West: 80.10 (avoiding Bay of Bengal)
    const lat = 12.82 + Math.random() * 0.43; // 12.82 to 13.25
    const lng = 80.10 + Math.random() * 0.12; // 80.10 to 80.22
    return {
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6))
    };
}

// Update drivers with missing or invalid coordinates
function updateDriverCoordinates() {
    console.log('🔍 Checking drivers with invalid coordinates...');
    
    // Find drivers with NULL, 0, or out-of-Chennai-CITY-range coordinates
    const checkQuery = `
        SELECT id, full_name, latitude, longitude 
        FROM drivers 
        WHERE latitude IS NULL 
           OR longitude IS NULL 
           OR latitude = 0 
           OR longitude = 0
           OR latitude < 12.82 
           OR latitude > 13.25
           OR longitude < 80.10 
           OR longitude > 80.22
    `;
    
    db.query(checkQuery, (err, drivers) => {
        if (err) {
            console.error('❌ Error checking drivers:', err);
            return;
        }
        
        if (drivers.length === 0) {
            console.log('✅ All drivers have valid Chennai CITY coordinates!');
            db.end();
            return;
        }
        
        console.log(`🔧 Found ${drivers.length} drivers with invalid coordinates. Fixing...`);
        console.log('📍 Drivers to fix:');
        drivers.forEach(driver => {
            console.log(`   - ${driver.full_name}: ${driver.latitude}, ${driver.longitude}`);
        });
        console.log('');
        
        let updatedCount = 0;
        
        drivers.forEach((driver) => {
            const coords = generateChennaiCoordinates();
            
            const updateQuery = `
                UPDATE drivers 
                SET latitude = ?, longitude = ? 
                WHERE id = ?
            `;
            
            db.query(updateQuery, [coords.latitude, coords.longitude, driver.id], (err, result) => {
                if (err) {
                    console.error(`❌ Error updating driver ${driver.full_name}:`, err);
                } else {
                    console.log(`✅ Updated ${driver.full_name}: ${driver.latitude}, ${driver.longitude} → ${coords.latitude}, ${coords.longitude}`);
                }
                
                updatedCount++;
                
                if (updatedCount === drivers.length) {
                    console.log(`\n🎉 Successfully updated ${updatedCount} drivers with valid Chennai CITY coordinates!`);
                    console.log('📍 All drivers are now located within Chennai city limits (avoiding sea)');
                    db.end();
                }
            });
        });
    });
}

// Add coordinates validation to future driver inserts
function addCoordinateValidation() {
    console.log('📋 Adding coordinate validation for future driver inserts...');
    
    // You could add database triggers here if needed
    console.log('💡 Note: Frontend and backend now validate coordinates automatically');
}

// Connect and run updates
db.connect(err => {
    if (err) {
        console.error('❌ MySQL connection error:', err);
        return;
    }
    console.log('🔗 Connected to MySQL database');
    
    updateDriverCoordinates();
});

// Export functions for use in other scripts
module.exports = {
    generateChennaiCoordinates,
    updateDriverCoordinates
}; 