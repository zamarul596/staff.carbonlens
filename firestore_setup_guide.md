# Firestore Database Setup Guide

## Step 1: Update Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `carbonlens-32147`
3. Click on "Firestore Database" in the left sidebar
4. Click on the "Rules" tab
5. Replace the current rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reading companies collection without authentication (for company ID validation)
    match /companies/{companyId} {
      allow read: if true;  // Anyone can read company IDs to validate them
      allow write: if false; // Only allow writes through admin/website
    }
    
    // User data - requires authentication and company ID match
    match /companies/{companyId}/users/{userId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == userId
        && exists(/databases/$(database)/documents/companies/$(companyId));
    }
    
    // Default rule - deny everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click "Publish"

## Step 2: Create Test Company in Firestore

1. In Firestore Database, click on "Start collection" (if no collections exist)
2. Collection ID: `companies`
3. Click "Next"
4. Document ID: `TEST001` (or any company ID you want to test with)
5. Add a field:
   - Field: `name`
   - Type: `string`
   - Value: `Test Company`
6. Click "Save"

## Step 3: Test the App

1. Run the app: `flutter run -d chrome`
2. Try to create an account with:
   - Company ID: `TEST001` (the one you just created)
   - Any email and password
3. The app should now work without permission errors

## Step 4: Verify Data Structure

Your Firestore should look like this:

```
companies/
  TEST001/
    name: "Test Company"
    users/
      [user-uid]/
        email: "user@example.com"
        employeeId: "EMP001"
        companyId: "TEST001"
        location: "Jakarta"
        createdAt: [timestamp]
        lastLogin: [timestamp]
```

## Troubleshooting

### If you still get permission errors:

1. **Check Rules**: Make sure the rules are published correctly
2. **Check Collection**: Verify the `companies` collection exists
3. **Check Document**: Verify the company ID document exists
4. **Clear Cache**: Try `flutter clean && flutter pub get`
5. **Check Console**: Look for any JavaScript errors in browser console

### Common Issues:

- **Collection doesn't exist**: Create the `companies` collection first
- **Document doesn't exist**: Create a document with your company ID
- **Rules not published**: Make sure to click "Publish" after updating rules
- **Wrong project**: Ensure you're in the correct Firebase project

## Testing Different Scenarios

1. **Valid Company ID**: Should work
2. **Invalid Company ID**: Should show "Company ID not found" error
3. **Existing User**: Should be able to log in
4. **New User**: Should be able to create account under valid company 