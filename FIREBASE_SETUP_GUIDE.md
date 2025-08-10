# 🔥 Firebase Setup Guide for CarbonLens

## 📋 Prerequisites
- Firebase project created (you already have this)
- `google-services.json` file in place (✅ Done)
- Firebase dependencies added (✅ Done)

## 🗄️ Firestore Database Setup

### Step 1: Enable Firestore Database
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `carbonlens-32147`
3. Go to **Firestore Database** in the left sidebar
4. Click **Create Database**
5. Choose **Start in test mode** (for development)
6. Select a location (choose the closest to your users)

### Step 2: Create Companies Collection
1. In Firestore Database, click **Start collection**
2. Collection ID: `companies`
3. Click **Next**

### Step 3: Create Your First Company Document
1. Document ID: `TEST_COMPANY` (this will be the Company ID users enter)
2. Add fields:
   ```
   Field: companyName
   Type: string
   Value: "Test Company"
   
   Field: createdAt
   Type: timestamp
   Value: [current timestamp]
   
   Field: status
   Type: string
   Value: "active"
   
   Field: adminEmail
   Type: string
   Value: "admin@testcompany.com"
   ```
3. Click **Save**

### Step 4: Test the Setup
1. Run the test script by temporarily modifying `main.dart`:
   ```dart
   import 'test_firebase_setup.dart';
   
   void main() async {
     WidgetsFlutterBinding.ensureInitialized();
     await Firebase.initializeApp();
     await testFirebaseSetup(); // Add this line
     runApp(const MyApp());
   }
   ```
2. Run the app and check the console output
3. You should see: "✅ Firebase connection successful!" and "Found 1 companies in database"

## 🔐 Security Rules (Optional but Recommended)

Replace your current Firestore rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read company info
    match /companies/{companyId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admin can create companies
    }
    
    // Allow users to read/write their own user data within their company
    match /companies/{companyId}/users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Testing the App

### Test User Registration:
1. Open the app
2. Tap "Sign up"
3. Enter Company ID: `TEST_COMPANY`
4. Fill in other details:
   - Email: `test@example.com`
   - Password: `password123`
   - Employee ID: `EMP001`
   - Location: `Test City`
5. Tap "Create Account"
6. ✅ Should succeed if Company ID exists
7. ❌ Should fail with "Company ID not found" if Company ID doesn't exist

### Test User Login:
1. Use the same credentials to log in
2. ✅ Should succeed and navigate to home screen
3. ❌ Should fail if Company ID or credentials are wrong

## 📊 Database Structure

After successful registration, your Firestore will look like this:

```
companies/
├── TEST_COMPANY/
│   ├── companyName: "Test Company"
│   ├── createdAt: [timestamp]
│   ├── status: "active"
│   └── adminEmail: "admin@testcompany.com"
│   └── users/
│       └── [firebase_auth_uid]/
│           ├── email: "test@example.com"
│           ├── employeeId: "EMP001"
│           ├── companyId: "TEST_COMPANY"
│           ├── location: "Test City"
│           ├── createdAt: [timestamp]
│           └── lastLogin: [timestamp]
```

## 🚀 Production Setup

### For Production, you should:

1. **Create an Admin Website** to manage companies:
   - Add new companies
   - View company users
   - Manage company settings

2. **Use Firebase Admin SDK** on your website:
   ```javascript
   // Example: Adding a new company
   await admin.firestore().collection('companies').doc('NEW_COMPANY').set({
     companyName: 'New Company',
     createdAt: admin.firestore.FieldValue.serverTimestamp(),
     status: 'active',
     adminEmail: 'admin@newcompany.com'
   });
   ```

3. **Implement Proper Security Rules** (see above)

4. **Add Email Verification** for new accounts

## 🔍 Troubleshooting

### Common Issues:

1. **"Company ID not found" error**:
   - Check if company document exists in Firestore
   - Verify the Company ID spelling (case-sensitive)

2. **Firebase connection errors**:
   - Check `google-services.json` is in the right place
   - Verify Firebase project settings
   - Check internet connection

3. **Permission denied errors**:
   - Check Firestore security rules
   - Ensure user is authenticated

### Debug Commands:
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run

# Check Firebase connection
flutter run --verbose
```

## 📱 App Features Summary

✅ **Company ID Validation**: Only registered companies can create accounts
✅ **Data Isolation**: All user data is stored under their company ID
✅ **Employee ID Validation**: Login verifies employee ID matches stored data
✅ **Password Reset**: Works with company ID validation
✅ **Secure Authentication**: Uses Firebase Auth with custom validation

## 🎯 Next Steps

1. Test the app with the provided Company ID
2. Create more company documents for testing
3. Build your admin website for company management
4. Add more features like carbon tracking
5. Implement proper error handling and user feedback

---

**Important**: Remember to remove the test code from `main.dart` after testing! 