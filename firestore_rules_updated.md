# Updated Firestore Security Rules

## Problem
The current rules require authentication for all operations, but company ID validation happens before user authentication, causing "permission-denied" errors.

## Solution
Update the rules to allow reading the companies collection without authentication, while keeping user data secure.

## Updated Rules

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

## How to Update

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click on "Rules" tab
4. Replace the current rules with the ones above
5. Click "Publish"

## Explanation

- **Companies Collection**: Anyone can read (for validation), but only admin can write
- **User Data**: Users can only access their own data under their company
- **Security**: Maintains data isolation while allowing company ID validation 