const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';

// 25 Drivers Data
const drivers = [
  { full_name: 'Rajesh Kumar', phone_number: '9876543210', vehicle_details: 'TN01AB1234', is_active: 1 },
  { full_name: 'Priya Sharma', phone_number: '9123456789', vehicle_details: 'TN02CD5678', is_active: 1 },
  { full_name: 'Amit Singh', phone_number: '9998887776', vehicle_details: 'TN03EF9012', is_active: 1 },
  { full_name: 'Sunita Devi', phone_number: '9555666777', vehicle_details: 'TN04GH3456', is_active: 1 },
  { full_name: 'Vikram Rao', phone_number: '9444333222', vehicle_details: 'TN05IJ7890', is_active: 1 },
  { full_name: 'Kavitha Nair', phone_number: '9888777666', vehicle_details: 'TN06KL1234', is_active: 1 },
  { full_name: 'Ravi Prasad', phone_number: '9333222111', vehicle_details: 'TN07MN5678', is_active: 1 },
  { full_name: 'Meera Joshi', phone_number: '9777666555', vehicle_details: 'TN08OP9012', is_active: 1 },
  { full_name: 'Suresh Babu', phone_number: '9222111000', vehicle_details: 'TN09QR3456', is_active: 1 },
  { full_name: 'Anjali Gupta', phone_number: '9666555444', vehicle_details: 'TN10ST7890', is_active: 1 },
  { full_name: 'Manoj Kumar', phone_number: '9111000999', vehicle_details: 'TN11UV1234', is_active: 1 },
  { full_name: 'Deepa Reddy', phone_number: '9555444333', vehicle_details: 'TN12WX5678', is_active: 1 },
  { full_name: 'Arjun Patel', phone_number: '9000999888', vehicle_details: 'TN13YZ9012', is_active: 1 },
  { full_name: 'Lakshmi Iyer', phone_number: '9444333111', vehicle_details: 'TN14AB3456', is_active: 1 },
  { full_name: 'Rohit Mehta', phone_number: '9888777555', vehicle_details: 'TN15CD7890', is_active: 1 },
  { full_name: 'Pooja Agarwal', phone_number: '9333222000', vehicle_details: 'TN16EF1234', is_active: 1 },
  { full_name: 'Kiran Kumar', phone_number: '9777666444', vehicle_details: 'TN17GH5678', is_active: 1 },
  { full_name: 'Sushma Rani', phone_number: '9222111888', vehicle_details: 'TN18IJ9012', is_active: 1 },
  { full_name: 'Naveen Reddy', phone_number: '9666555222', vehicle_details: 'TN19KL3456', is_active: 1 },
  { full_name: 'Rekha Devi', phone_number: '9111000777', vehicle_details: 'TN20MN7890', is_active: 1 },
  { full_name: 'Arun Kumar', phone_number: '9555444111', vehicle_details: 'TN21OP1234', is_active: 1 },
  { full_name: 'Geetha Rao', phone_number: '9000999666', vehicle_details: 'TN22QR5678', is_active: 1 },
  { full_name: 'Bharath Singh', phone_number: '9444333000', vehicle_details: 'TN23ST9012', is_active: 1 },
  { full_name: 'Madhavi Nair', phone_number: '9888777333', vehicle_details: 'TN24UV3456', is_active: 1 },
  { full_name: 'Sanjay Gupta', phone_number: '9333222888', vehicle_details: 'TN25WX7890', is_active: 1 }
];

// 35 Chennai Parcels Data
const parcels = [
  { customer_name: 'Ramesh Krishnan', phone_number: '9876543201', weight: 2.5, pin_code: '600001', address: 'T Nagar Main Road Chennai', latitude: 13.0827, longitude: 80.2707, status: 'unassigned' },
  { customer_name: 'Sangeetha Ravi', phone_number: '9123456780', weight: 1.8, pin_code: '600002', address: 'Anna Salai Chennai', latitude: 13.0674, longitude: 80.2376, status: 'unassigned' },
  { customer_name: 'Murali Mohan', phone_number: '9998887770', weight: 3.2, pin_code: '600003', address: 'Mount Road Chennai', latitude: 13.0569, longitude: 80.2461, status: 'unassigned' },
  { customer_name: 'Divya Lakshmi', phone_number: '9555666770', weight: 1.5, pin_code: '600004', address: 'Express Avenue Chennai', latitude: 13.0569, longitude: 80.2461, status: 'unassigned' },
  { customer_name: 'Balaji Subramanian', phone_number: '9444333220', weight: 2.1, pin_code: '600005', address: 'Vadapalani Chennai', latitude: 13.0509, longitude: 80.2120, status: 'unassigned' },
  { customer_name: 'Sowmya Narayan', phone_number: '9888777660', weight: 1.9, pin_code: '600006', address: 'Velachery Chennai', latitude: 12.9756, longitude: 80.2207, status: 'unassigned' },
  { customer_name: 'Srinivasan Iyer', phone_number: '9333222110', weight: 2.8, pin_code: '600007', address: 'Adyar Chennai', latitude: 13.0067, longitude: 80.2571, status: 'unassigned' },
  { customer_name: 'Kavya Devi', phone_number: '9777666550', weight: 1.7, pin_code: '600008', address: 'Mylapore Chennai', latitude: 13.0339, longitude: 80.2619, status: 'unassigned' },
  { customer_name: 'Ashwin Kumar', phone_number: '9222111001', weight: 3.0, pin_code: '600009', address: 'Nungambakkam Chennai', latitude: 13.0678, longitude: 80.2376, status: 'unassigned' },
  { customer_name: 'Preethi Srinivas', phone_number: '9666555441', weight: 2.3, pin_code: '600010', address: 'Egmore Chennai', latitude: 13.0732, longitude: 80.2609, status: 'unassigned' },
  { customer_name: 'Venkatesh Rao', phone_number: '9111000991', weight: 1.6, pin_code: '600011', address: 'Central Station Chennai', latitude: 13.0827, longitude: 80.2707, status: 'unassigned' },
  { customer_name: 'Lakshmi Priya', phone_number: '9555444331', weight: 2.9, pin_code: '600012', address: 'Marina Beach Chennai', latitude: 13.0499, longitude: 80.2824, status: 'unassigned' },
  { customer_name: 'Karthik Raj', phone_number: '9000999881', weight: 1.4, pin_code: '600013', address: 'Thiruvanmiyur Chennai', latitude: 12.9820, longitude: 80.2707, status: 'unassigned' },
  { customer_name: 'Deepika Sharma', phone_number: '9444333110', weight: 2.7, pin_code: '600014', address: 'OMR Chennai', latitude: 12.9820, longitude: 80.2707, status: 'unassigned' },
  { customer_name: 'Rajesh Kannan', phone_number: '9888777551', weight: 1.3, pin_code: '600015', address: 'ECR Chennai', latitude: 12.9820, longitude: 80.2707, status: 'unassigned' },
  { customer_name: 'Anitha Kumari', phone_number: '9333222001', weight: 2.4, pin_code: '600016', address: 'Tambaram Chennai', latitude: 12.9249, longitude: 80.1000, status: 'unassigned' },
  { customer_name: 'Gopal Krishna', phone_number: '9777666441', weight: 1.8, pin_code: '600017', address: 'Chrompet Chennai', latitude: 12.9517, longitude: 80.1462, status: 'unassigned' },
  { customer_name: 'Shanti Devi', phone_number: '9222111881', weight: 3.1, pin_code: '600018', address: 'Pallavaram Chennai', latitude: 12.9675, longitude: 80.1491, status: 'unassigned' },
  { customer_name: 'Narayan Murthy', phone_number: '9666555221', weight: 2.2, pin_code: '600019', address: 'GST Road Chennai', latitude: 12.9675, longitude: 80.1491, status: 'unassigned' },
  { customer_name: 'Bharathi Raman', phone_number: '9111000771', weight: 1.9, pin_code: '600020', address: 'Guindy Chennai', latitude: 13.0067, longitude: 80.2206, status: 'unassigned' },
  { customer_name: 'Sudhir Kumar', phone_number: '9555444110', weight: 2.6, pin_code: '600021', address: 'Saidapet Chennai', latitude: 13.0216, longitude: 80.2237, status: 'unassigned' },
  { customer_name: 'Ganga Devi', phone_number: '9000999661', weight: 1.5, pin_code: '600022', address: 'Kodambakkam Chennai', latitude: 13.0521, longitude: 80.2274, status: 'unassigned' },
  { customer_name: 'Praveen Raj', phone_number: '9444332991', weight: 2.8, pin_code: '600023', address: 'Koyambedu Chennai', latitude: 13.0732, longitude: 80.1963, status: 'unassigned' },
  { customer_name: 'Mala Suresh', phone_number: '9888777331', weight: 1.7, pin_code: '600024', address: 'Arumbakkam Chennai', latitude: 13.0794, longitude: 80.2028, status: 'unassigned' },
  { customer_name: 'Chandran Nair', phone_number: '9333222881', weight: 3.3, pin_code: '600025', address: 'Aminjikarai Chennai', latitude: 13.0794, longitude: 80.2028, status: 'unassigned' },
  { customer_name: 'Radha Krishna', phone_number: '9777666331', weight: 2.0, pin_code: '600026', address: 'Kilpauk Chennai', latitude: 13.0868, longitude: 80.2443, status: 'unassigned' },
  { customer_name: 'Vinod Kumar', phone_number: '9222111771', weight: 1.6, pin_code: '600027', address: 'Chetpet Chennai', latitude: 13.0751, longitude: 80.2437, status: 'unassigned' },
  { customer_name: 'Suma Rani', phone_number: '9666555111', weight: 2.9, pin_code: '600028', address: 'Purasaiwalkam Chennai', latitude: 13.0868, longitude: 80.2443, status: 'unassigned' },
  { customer_name: 'Mohan Lal', phone_number: '9111000661', weight: 1.4, pin_code: '600029', address: 'Perambur Chennai', latitude: 13.1143, longitude: 80.2329, status: 'unassigned' },
  { customer_name: 'Shobha Devi', phone_number: '9555443991', weight: 2.5, pin_code: '600030', address: 'Red Hills Chennai', latitude: 13.1943, longitude: 80.1755, status: 'unassigned' },
  { customer_name: 'Anil Verma', phone_number: '9000999551', weight: 1.8, pin_code: '600031', address: 'Avadi Chennai', latitude: 13.1143, longitude: 80.0988, status: 'unassigned' },
  { customer_name: 'Usha Rani', phone_number: '9444332881', weight: 3.0, pin_code: '600032', address: 'Ambattur Chennai', latitude: 13.0988, longitude: 80.1617, status: 'unassigned' },
  { customer_name: 'Bhaskar Reddy', phone_number: '9888777221', weight: 2.1, pin_code: '600033', address: 'Poonamallee Chennai', latitude: 13.0481, longitude: 80.0953, status: 'unassigned' },
  { customer_name: 'Kamala Devi', phone_number: '9333222771', weight: 1.9, pin_code: '600034', address: 'Porur Chennai', latitude: 13.0358, longitude: 80.1564, status: 'unassigned' },
  { customer_name: 'Raman Pillai', phone_number: '9777666221', weight: 2.7, pin_code: '600035', address: 'Maduravoyal Chennai', latitude: 13.0358, longitude: 80.1564, status: 'unassigned' }
];

async function addDrivers() {
  console.log('🚗 Adding 25 drivers...');
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < drivers.length; i++) {
    try {
      const response = await axios.post(`${API_BASE}/drivers`, drivers[i]);
      console.log(`✅ Driver ${i + 1}: ${drivers[i].full_name} added successfully`);
      successCount++;
    } catch (error) {
      console.log(`❌ Driver ${i + 1}: ${drivers[i].full_name} failed - ${error.response?.data?.error || error.message}`);
      errorCount++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n🚗 Drivers Summary: ✅ ${successCount} success, ❌ ${errorCount} errors\n`);
}

async function addParcels() {
  console.log('📦 Adding 35 Chennai parcels...');
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < parcels.length; i++) {
    try {
      const response = await axios.post(`${API_BASE}/parcels`, parcels[i]);
      console.log(`✅ Parcel ${i + 1}: ${parcels[i].customer_name} added successfully`);
      successCount++;
    } catch (error) {
      console.log(`❌ Parcel ${i + 1}: ${parcels[i].customer_name} failed - ${error.response?.data?.error || error.message}`);
      errorCount++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📦 Parcels Summary: ✅ ${successCount} success, ❌ ${errorCount} errors\n`);
}

async function main() {
  console.log('🎯 Starting data addition process...\n');
  
  try {
    // Test server connection
    await axios.get(`${API_BASE}/drivers`);
    console.log('🟢 Server is running and accessible\n');
    
    // Add drivers first
    await addDrivers();
    
    // Add parcels
    await addParcels();
    
    console.log('🎉 Data addition completed! Check your application:');
    console.log('   • Drivers: http://localhost:3000/drivers');
    console.log('   • Parcels: http://localhost:3000/parcels');
    console.log('   • Map: http://localhost:3000/map');
    
  } catch (error) {
    console.error('❌ Error connecting to server:', error.message);
    console.log('💡 Make sure the backend server is running on port 3001');
  }
}

main(); 