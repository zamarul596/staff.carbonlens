# Google Cloud Console Setup Guide

## 🚨 **Current Issues**

1. **Directions API not enabled** - Legacy API needs to be activated
2. **Billing not enabled** - Required for all APIs to work
3. **Address geocoding failing** - Need proper address format

## 🔧 **Step-by-Step Setup**

### **1. Enable Billing**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `carbonlens-32147`
3. Go to **Billing** → **Link a billing account**
4. Create a new billing account or link an existing one

### **2. Enable Required APIs**
1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - ✅ **Maps JavaScript API**
   - ✅ **Directions API** (Legacy)
   - ✅ **Geocoding API**
   - ✅ **Places API**

### **3. Enable Legacy APIs**
1. Go to **APIs & Services** → **Library**
2. Search for "Directions API"
3. Click on **Directions API (Legacy)**
4. Click **Enable**

### **4. Set Up Billing Alerts** (Recommended)
1. Go to **Billing** → **Budgets & alerts**
2. Create a budget with alerts at $50, $100, $200
3. This prevents unexpected charges

## 💰 **Cost Information**

- **Free Tier**: $200 credit per month
- **Maps JavaScript API**: $7 per 1,000 map loads
- **Directions API**: $5 per 1,000 requests
- **Geocoding API**: $5 per 1,000 requests

For development, you'll likely stay within the free tier.

## 🔗 **Direct Links**

- [Enable Billing](https://console.cloud.google.com/project/_/billing/enable)
- [API Library](https://console.cloud.google.com/apis/library)
- [Directions API (Legacy)](https://console.cloud.google.com/apis/library/directions-backend.googleapis.com)
- [Billing Dashboard](https://console.cloud.google.com/billing)

## 📍 **Address Format Guide**

### **Good Examples:**
- "Marina Bay Sands, Singapore"
- "Orchard Road, Singapore"
- "Changi Airport, Singapore"
- "123 Main Street, Singapore"

### **Bad Examples:**
- "hitech padu" (too vague)
- "office" (not specific)
- "home" (not specific)

## ✅ **After Setup**

Once all APIs are enabled:
1. Refresh your application
2. Try the location selector again
3. Use specific addresses like "Marina Bay Sands, Singapore"
4. The map should load and route calculation should work

## 🆘 **Troubleshooting**

### **If you still get errors:**

1. **Check API Status:**
   - Go to **APIs & Services** → **Enabled APIs**
   - Ensure all required APIs are listed

2. **Check Billing:**
   - Go to **Billing** → **Overview**
   - Ensure billing account is active

3. **Check API Key:**
   - Go to **APIs & Services** → **Credentials**
   - Ensure API key has access to all enabled APIs

4. **Clear Browser Cache:**
   - Hard refresh (Ctrl+F5)
   - Clear browser cache and cookies

## 📞 **Need More Help?**

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify your API key is correct in `.env` file
3. Ensure all APIs are enabled and billing is active
4. Try with the default addresses provided in the app 