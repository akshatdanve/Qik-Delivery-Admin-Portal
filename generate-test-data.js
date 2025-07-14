const fs = require('fs');

// Generate test data for parcels
function generateTestParcels(count = 50) {
    const firstNames = ['Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Kavita', 'Suresh', 'Meera', 'Rahul', 'Anita', 'Deepak', 'Pooja', 'Sanjay', 'Ritu', 'Manoj', 'Sunita', 'Arun', 'Geeta', 'Vinod', 'Shanti'];
    const lastNames = ['Sharma', 'Gupta', 'Singh', 'Verma', 'Kumar', 'Patel', 'Shah', 'Jain', 'Agarwal', 'Bansal', 'Mehta', 'Malhotra', 'Chopra', 'Kapoor', 'Sinha', 'Joshi', 'Tiwari', 'Mishra', 'Pandey', 'Saxena'];
    
    const cities = [
        { name: 'Delhi', pin: '110001', lat: 28.6139, lng: 77.2090 },
        { name: 'Mumbai', pin: '400001', lat: 19.0760, lng: 72.8777 },
        { name: 'Bangalore', pin: '560001', lat: 12.9716, lng: 77.5946 },
        { name: 'Chennai', pin: '600001', lat: 13.0827, lng: 80.2707 },
        { name: 'Kolkata', pin: '700001', lat: 22.5726, lng: 88.3639 },
        { name: 'Hyderabad', pin: '500001', lat: 17.3850, lng: 78.4867 },
        { name: 'Pune', pin: '411001', lat: 18.5204, lng: 73.8567 },
        { name: 'Ahmedabad', pin: '380001', lat: 23.0225, lng: 72.5714 },
        { name: 'Jaipur', pin: '302001', lat: 26.9124, lng: 75.7873 },
        { name: 'Lucknow', pin: '226001', lat: 26.8467, lng: 80.9462 }
    ];
    
    const streets = ['MG Road', 'Park Street', 'Main Street', 'Gandhi Road', 'Nehru Street', 'Station Road', 'Market Street', 'Civil Lines', 'Model Town', 'Sector 5'];
    const statuses = ['unassigned', 'assigned', 'in_transit', 'completed', 'pending'];
    
    const parcels = [];
    
    for (let i = 1; i <= count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const street = streets[Math.floor(Math.random() * streets.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Generate phone number starting with 6-9
        const phoneStart = Math.floor(Math.random() * 4) + 6; // 6, 7, 8, or 9
        const phoneRest = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        const phoneNumber = phoneStart + phoneRest;
        
        // Generate weight between 0.5 and 50 kg
        const weight = (Math.random() * 49.5 + 0.5).toFixed(1);
        
        // Add some variation to coordinates
        const latVariation = (Math.random() - 0.5) * 0.1; // ±0.05 degrees
        const lngVariation = (Math.random() - 0.5) * 0.1;
        
        parcels.push({
            customer_name: `${firstName} ${lastName}`,
            phone_number: phoneNumber,
            weight: weight,
            pin_code: city.pin,
            address: `${Math.floor(Math.random() * 999) + 1} ${street}, ${city.name}`,
            latitude: (city.lat + latVariation).toFixed(6),
            longitude: (city.lng + lngVariation).toFixed(6),
            status: status
        });
    }
    
    return parcels;
}

// Generate test data for drivers
function generateTestDrivers(count = 20) {
    const firstNames = ['Ravi', 'Sunil', 'Prakash', 'Mahesh', 'Dinesh', 'Ramesh', 'Mukesh', 'Naresh', 'Rajesh', 'Umesh', 'Kamal', 'Anil', 'Ashok', 'Vinay', 'Ajay', 'Sanjay', 'Vijay', 'Manoj', 'Santosh', 'Devendra'];
    const lastNames = ['Kumar', 'Singh', 'Sharma', 'Yadav', 'Prasad', 'Mishra', 'Tiwari', 'Gupta', 'Verma', 'Pandey'];
    
    const vehicles = [
        'Honda Activa - DL 01 AB',
        'TVS Jupiter - MH 02 CD',
        'Bajaj Pulsar - KA 03 EF',
        'Hero Splendor - TN 04 GH',
        'Yamaha FZ - WB 05 IJ',
        'Royal Enfield - RJ 06 KL',
        'Suzuki Access - GJ 07 MN',
        'Honda City - UP 08 OP',
        'Maruti Swift - HR 09 QR',
        'Hyundai i20 - PB 10 ST'
    ];
    
    const drivers = [];
    
    for (let i = 1; i <= count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        
        // Generate phone number starting with 6-9
        const phoneStart = Math.floor(Math.random() * 4) + 6;
        const phoneRest = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        const phoneNumber = phoneStart + phoneRest;
        
        // Add vehicle number
        const vehicleNumber = Math.floor(Math.random() * 9000) + 1000;
        const vehicleDetails = `${vehicle} ${vehicleNumber}`;
        
        drivers.push({
            full_name: `${firstName} ${lastName}`,
            phone_number: phoneNumber,
            vehicle_details: vehicleDetails,
            is_active: Math.random() > 0.2 // 80% active drivers
        });
    }
    
    return drivers;
}

// Generate CSV files
function generateCSVFiles() {
    // Generate parcels CSV
    const parcels = generateTestParcels(50);
    const parcelHeaders = 'customer_name,phone_number,weight,pin_code,address,latitude,longitude,status\n';
    const parcelRows = parcels.map(p => 
        `"${p.customer_name}",${p.phone_number},${p.weight},${p.pin_code},"${p.address}",${p.latitude},${p.longitude},${p.status}`
    ).join('\n');
    
    fs.writeFileSync('test-parcels-50.csv', parcelHeaders + parcelRows);
    console.log('✅ Generated test-parcels-50.csv with 50 records');
    
    // Generate drivers CSV (if needed)
    const drivers = generateTestDrivers(20);
    const driverHeaders = 'full_name,phone_number,vehicle_details,is_active\n';
    const driverRows = drivers.map(d => 
        `"${d.full_name}",${d.phone_number},"${d.vehicle_details}",${d.is_active}`
    ).join('\n');
    
    fs.writeFileSync('test-drivers-20.csv', driverHeaders + driverRows);
    console.log('✅ Generated test-drivers-20.csv with 20 records');
    
    console.log('\n📋 Test Data Generated Successfully!');
    console.log('Files created:');
    console.log('- test-parcels-50.csv (50 parcel records)');
    console.log('- test-drivers-20.csv (20 driver records)');
    console.log('\n🧪 Use these files to test:');
    console.log('1. CSV upload functionality');
    console.log('2. Search functionality');
    console.log('3. Pagination with large datasets');
    console.log('4. Filtering by status');
    console.log('5. Driver assignment');
}

// Run the generator
if (require.main === module) {
    generateCSVFiles();
}

module.exports = { generateTestParcels, generateTestDrivers, generateCSVFiles }; 