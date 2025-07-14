# 🧪 QIK Delivery Admin Portal - Testing Guide

## Manager's Testing Requirements

Your manager requested testing similar to Masters section standards:
1. **Add should work with proper validation**
2. **Edit should update with proper validation**  
3. **Add 50 records and verify search and pagination**

## 📋 Test Cases Overview

### 🔧 **Test Environment Setup**
1. **Backend Server**: `http://localhost:3001`
2. **Frontend Server**: `http://localhost:3000`
3. **Database**: MySQL with `qix` database
4. **Test Data**: Use generated CSV files or manual entry

---

## 🚗 **DRIVER MANAGEMENT TESTS**

### **Test Case 1: Add Driver with Validation**

#### ✅ **Valid Data Test**
```
Full Name: Rajesh Kumar
Phone: 9876543210
Vehicle: Honda Activa - DL 01 AB 1234
Status: Active
```
**Expected Result**: ✅ Driver added successfully

#### ❌ **Invalid Data Tests**
| Field | Invalid Input | Expected Error |
|-------|---------------|----------------|
| Full Name | "A" | "Full name must be at least 2 characters long" |
| Full Name | "123 Test" | "Full name can only contain letters and spaces" |
| Phone | "123456789" | "Phone number must be exactly 10 digits" |
| Phone | "5876543210" | "Phone number must start with 6, 7, 8, or 9" |
| Vehicle | "Car" | "Vehicle details must be at least 5 characters long" |

#### 🧪 **Test Steps**:
1. Navigate to Drivers page
2. Click "Add Driver" card
3. Fill form with test data
4. Verify real-time validation
5. Submit and verify success message
6. Check driver appears in list

### **Test Case 2: Edit Driver with Validation**

#### 🧪 **Test Steps**:
1. Click edit icon on existing driver
2. Modify data (valid and invalid)
3. Verify validation messages
4. Submit valid changes
5. Verify updates in driver list

### **Test Case 3: Driver Search and Pagination**

#### 🧪 **Test Steps**:
1. Add 20+ drivers (manually or via script)
2. Test search by:
   - Driver name: "Rajesh"
   - Phone number: "9876"
   - Vehicle: "Honda"
3. Verify pagination:
   - Change rows per page (5, 10, 25)
   - Navigate between pages
   - Verify counts are correct

---

## 📦 **PARCEL MANAGEMENT TESTS**

### **Test Case 4: Add Parcel with Validation**

#### ✅ **Valid Data Test**
```
Customer Name: Priya Sharma
Phone: 9876543211
Weight: 2.5
PIN Code: 110001
Address: 123 MG Road, Delhi
Latitude: 28.6139
Longitude: 77.2090
Status: unassigned
```

#### ❌ **Invalid Data Tests**
| Field | Invalid Input | Expected Error |
|-------|---------------|----------------|
| Customer Name | "P" | "Customer name must be at least 2 characters long" |
| Phone | "1234567890" | "Phone number must start with 6, 7, 8, or 9" |
| Weight | "0" | "Weight must be greater than 0" |
| Weight | "1001" | "Weight must be less than 1000 kg" |
| PIN Code | "12345" | "PIN code must be exactly 6 digits" |
| Address | "Short" | "Address must be at least 10 characters long" |
| Latitude | "100" | "Latitude must be between -90 and 90" |
| Longitude | "200" | "Longitude must be between -180 and 180" |

### **Test Case 5: Edit Parcel with Validation**

#### 🧪 **Test Steps**:
1. Click edit icon on existing parcel
2. Modify each field with valid/invalid data
3. Verify real-time validation
4. Submit changes
5. Verify updates in parcel list

### **Test Case 6: Bulk CSV Upload Test**

#### 📄 **Test CSV Format**:
```csv
customer_name,phone_number,weight,pin_code,address,latitude,longitude,status
"John Doe",9876543210,2.5,110001,"123 Main Street Delhi",28.6139,77.2090,unassigned
"Jane Smith",9876543211,1.8,400001,"456 Park Avenue Mumbai",19.0760,72.8777,unassigned
```

#### 🧪 **Test Steps**:
1. Create CSV with 50 records
2. Upload via bulk upload feature
3. Verify success message
4. Check all records appear in list
5. Test search and pagination with uploaded data

### **Test Case 7: Parcel Search and Pagination (50+ Records)**

#### 🧪 **Test Steps**:
1. Upload 50 records via CSV
2. Test search functionality:
   - Customer name: "John"
   - Phone: "9876"
   - Address: "Delhi"
   - PIN: "110001"
3. Test status filtering:
   - All Status
   - Unassigned
   - Assigned
   - In Transit
   - Completed
   - Pending
4. Test pagination:
   - Verify page navigation
   - Test different page sizes
   - Verify record counts

---

## 🎯 **ADVANCED TESTING SCENARIOS**

### **Test Case 8: Driver Assignment**
1. Create parcels and drivers
2. Test driver assignment dropdown
3. Verify status changes to "assigned"
4. Test bulk assignment
5. Verify driver cannot be deleted with assigned parcels

### **Test Case 9: Real-time Statistics**
1. Add/remove parcels
2. Verify statistics update without refresh
3. Test on all pages (Dashboard, Drivers, Parcels, Map)

### **Test Case 10: Map Functionality**
1. Upload parcels with coordinates
2. Verify markers appear on map
3. Test status filtering on map
4. Test info windows
5. Verify legend accuracy

---

## 🚀 **Quick Test Data Generation**

### **Manual Test Data**
```javascript
// Run this in browser console to generate test data
const testParcels = [
    {name: "Rajesh Kumar", phone: "9876543210", weight: "2.5", pin: "110001", address: "123 MG Road, Delhi", lat: "28.6139", lng: "77.2090"},
    {name: "Priya Sharma", phone: "9876543211", weight: "1.8", pin: "400001", address: "456 Park Avenue, Mumbai", lat: "19.0760", lng: "72.8777"},
    // Add 48 more...
];
```

### **CSV Generation Script**
```bash
# Run the test data generator
node generate-test-data.js
```

---

## ✅ **Expected Results Summary**

### **Validation Tests**
- ✅ All form fields validate in real-time
- ✅ Proper error messages display
- ✅ Submit button disabled with errors
- ✅ Success messages after valid submissions

### **CRUD Operations**
- ✅ Add: Creates new records with validation
- ✅ Edit: Updates existing records with validation
- ✅ Delete: Removes records with confirmation
- ✅ View: Displays all records correctly

### **Search & Pagination**
- ✅ Search works across all relevant fields
- ✅ Pagination handles 50+ records smoothly
- ✅ Page size options work correctly
- ✅ Record counts are accurate

### **Professional Features**
- ✅ Real-time statistics updates
- ✅ Professional UI/UX
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ Confirmation dialogs

---

## 🎓 **Manager Presentation Points**

1. **Robust Validation**: 25+ validation rules across all forms
2. **Professional UI**: Modern design with gradients and animations
3. **Real-time Updates**: Statistics update without page refresh
4. **Scalable**: Handles 50+ records with efficient pagination
5. **Search Functionality**: Multi-field search capabilities
6. **Error Handling**: Comprehensive error messages and user feedback
7. **Mobile Responsive**: Works on all device sizes
8. **Production Ready**: Enterprise-grade features and validation

---

## 🐛 **Common Issues & Solutions**

### Issue: CSV Upload Not Working
**Solution**: Check phone number format (10 digits, starts with 6-9)

### Issue: Validation Not Showing
**Solution**: Ensure all required fields are filled

### Issue: Pagination Not Working
**Solution**: Verify backend is returning correct data count

### Issue: Search Not Working
**Solution**: Check search terms match database fields

---

**📞 Support**: If any test fails, check browser console for errors and verify backend server is running on port 3001. 