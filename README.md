# QIK DELIVERY EXPRESS Admin Portal

A modern, full-stack delivery management system built with React and Node.js for streamlined parcel tracking, driver management, and delivery operations.

## 🌟 Features

### 📊 Dashboard
- **Real-time Analytics**: View comprehensive parcel statistics
- **Status Tracking**: Monitor unassigned, assigned, in-transit, completed, and pending parcels
- **Driver Overview**: Track active and inactive drivers
- **Recent Activity**: Quick view of latest parcel entries

### 🚚 Driver Management
- **Complete CRUD Operations**: Add, edit, view, and delete drivers
- **Status Management**: Activate/deactivate drivers
- **Vehicle Information**: Track driver and vehicle details
- **Search & Filter**: Find drivers by name, phone, or vehicle
- **Safety Checks**: Prevent deletion of drivers with assigned parcels

### 📦 Parcel Management
- **Individual Parcel Entry**: Add parcels with customer details and GPS coordinates
- **Bulk CSV Upload**: Import multiple parcels via CSV files
- **Driver Assignment**: Assign parcels to available drivers
- **Status Tracking**: Monitor parcel lifecycle from unassigned to delivered
- **Advanced Search**: Filter by status, customer name, phone, or address
- **Pagination**: Handle large datasets efficiently

### 🗺️ Interactive Map View
- **Google Maps Integration**: Real-time parcel location visualization
- **Color-coded Markers**: Status-based marker colors for easy identification
- **Interactive Info Windows**: Detailed parcel information on click
- **Status Filtering**: Filter map view by parcel status
- **Live Tracking**: Animated markers for in-transit parcels
- **Geolocation**: Center map to user's current location

### 🎨 Modern UI/UX
- **Material-UI Design**: Professional, responsive interface
- **Dark/Light Theme**: Gradient-based modern styling
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Real-time Notifications**: Success/error alerts for user actions
- **Loading States**: Smooth user experience with progress indicators

## 🛠️ Technology Stack

### Frontend
- **React 19** with Hooks
- **Material-UI 7** for components and styling
- **React Router DOM** for navigation
- **Google Maps API** for mapping functionality
- **Axios** for HTTP requests

### Backend
- **Node.js** with Express.js
- **MySQL** database with proper relationships
- **Multer** for file uploads
- **CSV Parser** for bulk import functionality
- **CORS** enabled for cross-origin requests

### Database Schema
- **admins**: User authentication (ready for future implementation)
- **drivers**: Driver profiles and vehicle information
- **parcels**: Parcel details with GPS coordinates
- **parcel_assignments**: Assignment history and audit trail

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- Google Maps API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qik-delivery
   ```

2. **Setup Database**
   ```bash
   # Import the database schema
   mysql -u root -p < info/qix.sql
   ```

3. **Configure Backend**
   ```bash
   cd backend
   npm install
   # Update database credentials in index.js if needed
   ```

4. **Configure Frontend**
   ```bash
   cd frontend
   npm install
   # Update Google Maps API key in App.js if needed
   ```

5. **Start the Application**
   
   **Option A: Use the startup script (Windows)**
   ```bash
   start.bat
   ```
   
   **Option B: Manual start**
   ```bash
   # Terminal 1 - Backend
   cd backend
   node index.js
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📋 Usage Guide

### Adding Parcels
1. **Individual Entry**: Click "Add New Parcel" button and fill the form
2. **Bulk Upload**: Use "Choose CSV" to upload multiple parcels
   - Download the template from "Download Template" button
   - Fill the CSV with parcel data
   - Upload and review results

### Managing Drivers
1. Navigate to "Drivers" page
2. Add new drivers with vehicle details
3. Edit existing driver information
4. Activate/deactivate drivers as needed

### Assigning Parcels
1. Go to "Parcels" page
2. Use the dropdown in "Assign Driver" column
3. Select an active driver for each parcel
4. Status automatically updates to "assigned"

### Map Tracking
1. Visit "Map View" page
2. See all parcels with GPS coordinates
3. Filter by status or show unassigned only
4. Click markers for detailed information

## 🔧 Configuration

### Database Configuration
Update `backend/index.js` with your MySQL credentials:
```javascript
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_username',
    password: 'your_password',
    database: 'qix'
});
```

### Google Maps API
Update `frontend/src/App.js` with your API key:
```javascript
<LoadScript googleMapsApiKey="YOUR_API_KEY_HERE">
```

## 📁 File Structure
```
qik-delivery/
├── backend/
│   ├── index.js          # Express server and API routes
│   ├── package.json      # Backend dependencies
│   └── uploads/          # CSV upload temporary storage
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Main application pages
│   │   ├── App.js        # Main React component
│   │   └── App.css       # Global styling
│   ├── public/
│   │   └── sample-parcels.csv  # CSV template
│   └── package.json      # Frontend dependencies
├── info/
│   └── qix.sql          # Database schema
├── start.bat            # Windows startup script
└── README.md            # This file
```

## 🔗 API Endpoints

### Drivers
- `GET /drivers` - Get all drivers
- `POST /drivers` - Add new driver
- `PUT /drivers/:id` - Update driver
- `DELETE /drivers/:id` - Delete driver

### Parcels
- `GET /parcels` - Get all parcels with driver info
- `POST /parcels` - Add new parcel
- `PUT /parcels/:id` - Update parcel
- `DELETE /parcels/:id` - Delete parcel
- `PUT /parcels/:id/assign` - Assign driver to parcel
- `POST /parcels/bulk-assign` - Bulk assign parcels
- `POST /upload-parcels` - Upload CSV file

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics

## 🎯 Future Enhancements

- User authentication and role-based access
- Real-time notifications with WebSocket
- Mobile app for drivers
- Route optimization algorithms
- SMS/Email notifications
- Advanced analytics and reporting
- Multi-tenant support
- Payment integration

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check credentials in `backend/index.js`
   - Ensure database `qix` exists

2. **Google Maps Not Loading**
   - Verify API key is valid
   - Enable required APIs in Google Console
   - Check browser console for errors

3. **CSV Upload Fails**
   - Ensure CSV follows the template format
   - Check file size limits
   - Verify required fields are present

4. **Port Already in Use**
   - Change port in `backend/index.js` (default: 3001)
   - Frontend port can be changed in `package.json`

## 📞 Support

For technical support or questions:
- Check the troubleshooting section above
- Review console logs for error messages
- Ensure all dependencies are properly installed

## 📄 License

This project is developed for educational/internship purposes.

---

**Built with ❤️ for efficient delivery management** 