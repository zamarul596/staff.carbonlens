# Google Maps Billing Setup Guide

## 🚨 **Current Issue: Billing Not Enabled**

Your Google Maps API is working but billing is not enabled. This is required for the APIs to function.

## 🔧 **Quick Fix Steps**

### 1. **Enable Billing**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `carbonlens-32147`
3. Go to **Billing** → **Link a billing account**
4. Create a new billing account or link an existing one

### 2. **Enable Required APIs**
1. Go to **APIs & Services** → **Library**
2. Enable these APIs:
   - ✅ **Maps JavaScript API**
   - ✅ **Directions API**
   - ✅ **Geocoding API**
   - ✅ **Places API**

### 3. **Set Up Billing Alerts** (Recommended)
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
- [Billing Dashboard](https://console.cloud.google.com/billing)

## ✅ **After Setup**

Once billing is enabled:
1. Refresh your application
2. Try the location selector again
3. The map should load and route calculation should work

## 🆘 **Need Help?**

If you're still having issues:
1. Check the browser console for errors
2. Verify your API key is correct
3. Ensure all APIs are enabled
4. Check billing account is active 