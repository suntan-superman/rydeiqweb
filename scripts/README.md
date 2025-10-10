# 🛠️ AnyRyde Admin Scripts

Utility scripts for managing and monitoring the AnyRyde platform.

## 📋 Available Scripts

### 1. `exportUsersAndDriversToCSV.js` - Complete CSV Export ⭐ **NEW!**

**Purpose**: Exports ALL data from both `users` and `driverApplications` collections to CSV files.

**Usage**:
```bash
node scripts/exportUsersAndDriversToCSV.js
```

**What It Does**:
- ✅ Exports all users to `users-export-[timestamp].csv`
- ✅ Exports all driver applications to `driver-applications-export-[timestamp].csv`
- ✅ Creates combined export to `combined-users-drivers-[timestamp].csv`
- ✅ Includes ALL fields from both collections
- ✅ Automatically flattens nested objects
- ✅ Handles Firestore timestamps
- ✅ Escapes CSV special characters
- ✅ Ready for Excel/Google Sheets

**Output Files**:
1. **users-export-[timestamp].csv** - All user data (riders, drivers, admins)
2. **driver-applications-export-[timestamp].csv** - All driver application data
3. **combined-users-drivers-[timestamp].csv** - Merged user + driver data

**Fields Included**:
- **User Data**: Name, email, phone, role, verification status, onboarding, emergency contact, payment info, stats
- **Driver Data**: License info, vehicle info (year, make, model, color, VIN, photos), insurance, specialty type, certifications, documents, status, availability, pricing, metrics, ratings

**Use Cases**:
- Backup all user/driver data
- Import into Excel for analysis
- Share with stakeholders
- Data migration
- Compliance reporting
- Growth tracking

---

### 2. `analyzeDriverCollections.js` - Driver Collections Analysis ⚠️ **RUN THIS FIRST!**

**Purpose**: Analyzes both `drivers` and `driverApplications` collections to identify which is actively used and find duplicates.

**Usage**:
```bash
node scripts/analyzeDriverCollections.js
```

**Features**:
- ✅ Compares both collections
- ✅ Identifies duplicates
- ✅ Shows recent activity
- ✅ Data completeness analysis
- ✅ Provides migration recommendations
- ✅ Sample data comparison

**Why Run This First**:
Your system uses BOTH `drivers` and `driverApplications` collections. This can cause data inconsistency. This script helps you understand which collection to use as the primary source.

---

### 3. `listDrivers.js` - Complete Driver List

**Purpose**: Lists all drivers from BOTH collections with full details.

**Usage**:
```bash
node scripts/listDrivers.js
```

**Features**:
- ✅ Shows drivers from both collections
- ✅ Identifies duplicates
- ✅ Complete vehicle information
- ✅ Specialty service details
- ✅ Online/availability status
- ✅ Rating and ride statistics
- ✅ Color-coded by source collection

**Output Shows**:
- Which collection each driver came from
- Complete vehicle details
- Specialty services
- Current status
- Performance metrics

---

### 4. `listUsers.js` - Detailed User List

**Purpose**: Lists all users with comprehensive details, color-coded output, and CSV export option.

**Usage**:
```bash
node scripts/listUsers.js
```

**Features**:
- ✅ Color-coded terminal output
- ✅ Detailed user information
- ✅ Driver-specific details (vehicle, specialty, status)
- ✅ Profile picture status
- ✅ Email verification status
- ✅ Onboarding completion status
- ✅ Summary statistics
- ✅ CSV export option

**Output Example**:
```
1. John Doe
   Email: john@example.com
   Type: Driver | Role: driver
   Profile Pic: ✓ Yes
   Email Verified: ✓ Yes
   Onboarding: ✓ Yes
   Member Since: 1/15/2024

   Driver Details:
   Vehicle Type: sedan
   Vehicle: 2022 Silver Toyota Camry
   License Plate: ABC-1234
   Vehicle Photo: ✓ Yes
   Specialty Type: None
   Status: active | ✓ Online
   Rating: 4.8 (127 rides)
```

---

### 5. `listUsersTable.js` - Table Format

**Purpose**: Lists all users in a clean table format for quick overview.

**Usage**:
```bash
node scripts/listUsersTable.js
```

**Features**:
- ✅ Clean table format using console.table()
- ✅ Easy to read and scan
- ✅ Includes all key information
- ✅ Summary statistics
- ✅ Driver statistics

**Output Example**:
```
┌─────┬────────────┬───────────┬──────────────────┬────────┬────────────┬────────────┐
│ idx │ First Name │ Last Name │ Email            │ Type   │ Profile... │ Email Ver. │
├─────┼────────────┼───────────┼──────────────────┼────────┼────────────┼────────────┤
│  0  │ John       │ Doe       │ john@example.com │ Driver │ ✓          │ ✓          │
│  1  │ Jane       │ Smith     │ jane@example.com │ Rider  │ ✓          │ ✓          │
└─────┴────────────┴───────────┴──────────────────┴────────┴────────────┴────────────┘
```

---

## 📊 Information Displayed

### All Users
- First Name, Last Name
- Email Address
- User Type (Rider, Driver, Admin, Medical Admin, Super Admin)
- Role (customer, driver, admin, super_admin)
- Profile Picture Status (✓/✗)
- Email Verification Status (✓/✗)
- Onboarding Completion Status (✓/✗)
- Account Creation Date

### Driver-Specific Information
- **Vehicle Details**:
  - Driver Type (standard, suv, luxury, van, etc.)
  - Vehicle Info (year, make, model, color)
  - License Plate Number
  - Vehicle Photo Status (✓/✗)
  
- **Specialty Information**:
  - Specialty Vehicle Type (wheelchair_accessible, medical, etc.)
  - Service Capabilities (wheelchair_transport, medical_transport, etc.)
  
- **Driver Status**:
  - Account Status (pending, active, suspended, etc.)
  - Online Status (✓ Online / ✗ Offline)
  - Rating (average rating)
  - Total Rides Completed

---

## 🚀 Setup

### Prerequisites

Make sure you have:
1. ✅ Firebase Admin SDK installed
2. ✅ `serviceAccountKey.json` in root directory
3. ✅ Node.js installed

### Installation

If `firebase-admin` is not installed:
```bash
yarn add firebase-admin --dev
```

Or globally:
```bash
npm install -g firebase-admin
```

---

## 📖 Usage Examples

### Export All Data to CSV (Recommended)
```bash
node scripts/exportUsersAndDriversToCSV.js
```
Best for: Complete data export, backups, analysis in Excel

### Quick User Check
```bash
node scripts/listUsersTable.js
```
Best for: Quick overview, checking counts

### Detailed User Review
```bash
node scripts/listUsers.js
```
Best for: Detailed analysis, troubleshooting

### Individual Collection Export
```bash
node scripts/listUsers.js
# When prompted: y
# Creates: user-export-2024-01-15T10-30-45.csv
```

### Filter Output (Linux/Mac)
```bash
node scripts/listUsers.js | grep "Driver"
```

### Save to File
```bash
node scripts/listUsers.js > users-report.txt
```

---

## 📈 Summary Statistics

Both scripts provide summary statistics including:

### User Statistics
- Total users
- Users by type (Riders, Drivers, Admins, etc.)
- Email verification rate
- Profile picture completion rate
- Onboarding completion rate

### Driver Statistics
- Vehicle type distribution
- Online drivers count
- Drivers with vehicle photos
- Specialty vehicle counts (wheelchair, medical)
- Average ratings

---

## 💾 CSV Export Format

The CSV export includes all fields:
```csv
First Name,Last Name,Email,Type,Role,Profile Pic,Email Verified,Onboarding Complete,Created At,Driver Type,Vehicle Info,License Plate,Vehicle Photo,Specialty Type,Service Capabilities,Driver Status,Online,Rating,Total Rides
John,Doe,john@example.com,Driver,driver,✓,✓,✓,1/15/2024,sedan,2022 Silver Toyota Camry,ABC-1234,✓,None,,active,✓,4.8,127
```

**Use Cases**:
- Import into Excel/Google Sheets
- Data analysis
- Backup user list
- Share with team
- Track growth over time

---

## 🔐 Security

**Important**: These scripts have full admin access to your database.

### Best Practices:
1. ✅ Keep `serviceAccountKey.json` secure and private
2. ✅ Never commit to version control (already in `.gitignore`)
3. ✅ Only run on trusted machines
4. ✅ Limit access to authorized personnel only
5. ✅ Review output before sharing

### Permissions:
These scripts have **read-only** access and do NOT modify any data.

---

## 🎨 Color Coding (listUsers.js)

- 🔴 **Red**: Super Admins
- 🟡 **Yellow**: Admins
- 🔵 **Blue**: Drivers
- 🟢 **Green**: Riders
- 🔷 **Cyan**: Medical Admins

### Status Indicators:
- ✓ **Green**: Verified, Complete, Online, Available
- ✗ **Gray**: Not verified, Incomplete, Offline
- 🟡 **Yellow**: Pending, Warnings

---

## 🧪 Testing

### Test the Scripts
```bash
# Test table format
node scripts/listUsersTable.js

# Test detailed format
node scripts/listUsers.js

# Export CSV
node scripts/listUsers.js
# Answer 'y' when prompted
# Check for CSV file in root directory
```

### Sample Output Verification
- ✅ All users displayed
- ✅ Driver info shows for drivers
- ✅ Specialty info shows if applicable
- ✅ Statistics are accurate
- ✅ CSV exports correctly

---

## 🆘 Troubleshooting

### Error: "Cannot find module 'firebase-admin'"
```bash
yarn add firebase-admin --dev
```

### Error: "serviceAccountKey.json not found"
- Make sure the file exists in the root directory
- Check the path in the script
- Verify file permissions

### Error: "Permission denied"
- Check Firebase Admin SDK permissions
- Verify serviceAccountKey.json is valid
- Ensure Firestore rules allow admin access

### No users showing
- Check Firestore database name
- Verify collection names ('users', 'drivers')
- Check Firebase project configuration

---

## 📝 Customization

### Add More Fields

Edit the `formatUser` function to include additional fields:

```javascript
function formatUser(userData, driverData = null) {
  const user = {
    // Add your custom fields here
    customField: userData.customField || 'N/A',
    // ...
  };
  return user;
}
```

### Change Output Format

Modify the `printUser` function to customize the display:

```javascript
function printUser(user, index, isDriver = false) {
  // Customize output format here
}
```

### Filter Users

Add filtering before display:

```javascript
// Only show drivers
const filteredUsers = users.filter(u => getUserType(u) === 'Driver');

// Only show verified users
const filteredUsers = users.filter(u => u.emailVerified);

// Only show incomplete onboarding
const filteredUsers = users.filter(u => !u.onboardingCompleted);
```

---

## 🔮 Future Enhancements

Potential additions:
- [ ] Filter by user type
- [ ] Search by email/name
- [ ] Date range filtering
- [ ] Excel export with formatting
- [ ] JSON export
- [ ] Interactive CLI menu
- [ ] Real-time monitoring mode
- [ ] Email reports
- [ ] Slack/Discord notifications
- [ ] Data visualization

---

## 📞 Support

For issues or feature requests:
1. Check this README
2. Verify Firebase configuration
3. Test with sample data
4. Review script comments
5. Contact development team

---

## 🎯 Use Cases

### Regular Operations
- **Daily**: Check new user signups
- **Weekly**: Review onboarding completion rates
- **Monthly**: Export for analysis and reporting

### Troubleshooting
- Verify user data after registration
- Check profile completion
- Debug onboarding issues
- Verify driver vehicle information

### Analysis
- Track user growth
- Monitor driver acquisition
- Analyze completion rates
- Identify issues or patterns

### Reporting
- Generate user reports
- Share statistics with team
- Create backup lists
- Document platform growth

---

## ✅ Quick Reference

### Run Detailed List
```bash
node scripts/listUsers.js
```

### Run Table Format
```bash
node scripts/listUsersTable.js
```

### Export CSV
```bash
node scripts/listUsers.js
# Answer: y
```

### Make Executable (Linux/Mac)
```bash
chmod +x scripts/listUsers.js
./scripts/listUsers.js
```

---

**Happy user management!** 🎉

