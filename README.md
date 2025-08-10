# CarbonLens - React Web Application

A modern React web application for tracking and managing carbon footprint, converted from the original Flutter mobile app.

## Features

- **User Authentication**: Secure login/signup with Firebase Authentication
- **Company-based Access**: Multi-tenant system with company ID validation
- **Carbon Footprint Tracking**: 
  - Employee commuting tracking
  - Business travel tracking
  - Real-time emissions calculations
- **Dashboard**: Overview of carbon footprint with visual metrics
- **Settings Management**: User profile and app settings
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager
- Firebase project with Authentication and Firestore enabled

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd carbonlens-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Configuration**
   The Firebase configuration is already set up in `src/firebase/config.js` with the same settings as your Flutter app:
   - Project ID: `carbonlens-32147`
   - Authentication and Firestore are enabled

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthWrapper.js   # Authentication wrapper
│   └── LoadingScreen.js # Loading screen component
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication context
├── firebase/            # Firebase configuration
│   └── config.js        # Firebase setup
├── screens/             # Page components
│   ├── LoginScreen.js
│   ├── CreateAccountScreen.js
│   ├── ForgotPasswordScreen.js
│   ├── HomeScreen.js
│   ├── EmployeeCommutingPage.js
│   ├── BusinessTravelPage.js
│   └── SettingsScreen.js
├── services/            # API and service functions
│   └── firebaseService.js
├── App.js              # Main app component
├── index.js            # Entry point
└── index.css           # Global styles
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (not recommended)

## Features Comparison with Flutter App

| Feature | Flutter App | React Web App |
|---------|-------------|---------------|
| User Authentication | ✅ | ✅ |
| Company ID Validation | ✅ | ✅ |
| Employee Commuting Tracking | ✅ | ✅ |
| Business Travel Tracking | ✅ | ✅ |
| Carbon Footprint Dashboard | ✅ | ✅ |
| Settings Management | ✅ | ✅ |
| Responsive Design | ✅ | ✅ |
| Firebase Integration | ✅ | ✅ |
| Real-time Updates | ✅ | ✅ |

## Key Differences

1. **Platform**: Mobile app → Web application
2. **UI Framework**: Flutter Material → React with Tailwind CSS
3. **Navigation**: Flutter Navigator → React Router
4. **State Management**: Flutter StatefulWidget → React Hooks + Context
5. **Styling**: Flutter Widgets → Tailwind CSS classes

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

### Deploy to Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`

## Environment Variables

Create a `.env` file in the root directory if you need to customize Firebase settings:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
