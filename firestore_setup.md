# Firestore Database Setup Guide

## Database Structure

Your Firestore database should have the following structure to support company ID validation:

### Collection: `companies`
This collection contains all registered companies. Each company document should have:

**Document ID**: Company ID (e.g., "COMP001", "ACME_CORP", etc.)

**Document Fields**:
```json
{
  "companyName": "Acme Corporation",
  "createdAt": "2024-01-01T00:00:00Z",
  "status": "active",
  "adminEmail": "admin@acme.com"
}
```

### Subcollection: `companies/{companyId}/users`
This subcollection contains all users for each company.

**Document ID**: Firebase Auth UID

**Document Fields**:
```json
{
  "email": "user@acme.com",
  "employeeId": "EMP001",
  "companyId": "COMP001",
  "location": "New York",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-01T00:00:00Z"
}
```

## How to Set Up

### 1. Create Company Documents
You need to create company documents in the `companies` collection before users can register. You can do this through:

- **Firebase Console**: Go to Firestore Database → Start collection → Collection ID: `companies`
- **Your Website**: Create an admin interface to add companies
- **Direct API calls**: Use Firebase Admin SDK

### 2. Example Company Document
```json
{
  "companyName": "CarbonLens Demo Company",
  "createdAt": "2024-01-01T00:00:00Z",
  "status": "active",
  "adminEmail": "admin@carbonlens.com"
}
```

### 3. Security Rules
Your current Firestore rules are:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

For better security, consider these rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read company info
    match /companies/{companyId} {
      allow read: if request.auth != null;
      allow write: if false; // Only allow admin to create companies
    }
    
    // Allow users to read/write their own user data within their company
    match /companies/{companyId}/users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Testing the System

### 1. Create a Test Company
First, create a company document in Firestore:
- Collection: `companies`
- Document ID: `TEST_COMPANY`
- Fields:
  ```json
  {
    "companyName": "Test Company",
    "createdAt": "2024-01-01T00:00:00Z",
    "status": "active",
    "adminEmail": "test@company.com"
  }
  ```

### 2. Test User Registration
1. Open the app
2. Go to "Sign up"
3. Use Company ID: `TEST_COMPANY`
4. Fill in other details
5. The app should validate the company ID and create the account

### 3. Test User Login
1. Use the same credentials to log in
2. The app should validate both company ID and user credentials

## Important Notes

1. **Company ID Validation**: The app will only allow users to register/login if the company ID exists in the `companies` collection.

2. **Data Isolation**: All user data is stored under their respective company ID, ensuring complete data isolation between companies.

3. **Employee ID Validation**: During login, the app verifies that the employee ID matches the stored data for that user.

4. **Password Reset**: Password reset emails are only sent if the user exists in the specified company.

## Website Integration

Your website should have an admin interface to:
1. Create new companies in the `companies` collection
2. Manage company information
3. View users within each company
4. Handle company-specific settings

This ensures that only authorized companies can use the app and their data remains completely isolated. 