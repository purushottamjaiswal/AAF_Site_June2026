# BTS Map Dashboard - Setup Guide

## Quick Start

### Step 1: Prepare Your Google Sheet

1. **Create or Locate Your Spreadsheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new sheet or open an existing one
   - Ensure it contains BTS location data

2. **Add Required Columns**
   - Your sheet must have these columns (headers in first row):
     - `sitename` - Name of the BTS site
     - `latitude` - Latitude coordinate
     - `longitude` - Longitude coordinate
     - `opco` - Operator name
     - `technology` - Technology type (2G, 3G, 4G, 5G)
   - Optional columns:
     - `address` - Physical address
     - `status` - Operational status

3. **Sample Data Format**
   ```
   sitename,latitude,longitude,opco,technology,address,status
   BTS-Delhi-01,28.7041,77.1025,Operator1,4G,Delhi,,Active
   BTS-Mumbai-02,19.0760,72.8777,Operator2,5G,Mumbai,Active
   BTS-Bangalore-03,12.9716,77.5946,Operator1,4G,Bangalore,Active
   ```

4. **Make Sheet Public**
   - Click "Share" button
   - Change to "Anyone with the link can view"
   - Copy the share link (you'll need the ID from it)

### Step 2: Extract Your Google Sheet ID

1. **From the URL**
   - The URL format is: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit...`
   - Your SHEET_ID is the long alphanumeric string
   - Example: `1CfG5nG9UCWtowaldd-CR-egIsgnOclflOXT08bBz5s0`

2. **Find the Sheet Tab ID (gid)**
   - The default tab usually has gid=0
   - If using a different tab, right-click the tab name and copy the ID

### Step 3: Configure the Dashboard

1. **Edit app.js**
   - Open `app.js` in a text editor
   - Find the CONFIG section (around line 1)
   - Update with your values:

   ```javascript
   const CONFIG = {
       SPREADSHEET_ID: 'YOUR_SHEET_ID_HERE',  // Replace with your sheet ID
       SHEET_ID: '0',                          // Change if using different tab
       MAP_CENTER: [20.5937, 78.9629],         // Center coordinates (India)
       MAP_ZOOM: 5                             // Initial zoom level
   };
   ```

   **Example with actual values:**
   ```javascript
   const CONFIG = {
       SPREADSHEET_ID: '1CfG5nG9UCWtowaldd-CR-egIsgnOclflOXT08bBz5s0',
       SHEET_ID: '0',
       MAP_CENTER: [28.7041, 77.1025],  // Delhi as center
       MAP_ZOOM: 10
   };
   ```

### Step 4: Deploy

#### Option A: Local Testing
1. Open `index.html` directly in your browser
2. Click "Open" and navigate to the file
3. Wait for data to load from Google Sheets

#### Option B: Web Server
1. Upload files to a web server
2. Access via URL in browser
3. Ensure HTTPS or HTTP access

#### Option C: GitHub Pages
1. Push to GitHub repository
2. Go to Settings → Pages
3. Select main branch as source
4. Access at `https://username.github.io/repo-name/bts-map-dashboard/`

## Verification

### Check if Setup is Working

1. **Open the Dashboard**
   - Load `index.html` in browser
   - You should see:
     - Map centered on configured location
     - Colored markers for BTS sites
     - Filter dropdowns populated
     - Site count displayed

2. **Test Functionality**
   - Try filtering by OPCO
   - Try filtering by Technology
   - Click on markers to see details
   - Click sidebar items to navigate to sites

3. **Debug Issues** (Open browser console - F12)
   - Check for errors
   - Verify data is loading
   - Check network requests

## Troubleshooting

### "Loading BTS data from Google Sheets..." stays forever

**Problem**: Data not fetching

**Solutions**:
1. Check Google Sheet is publicly accessible
2. Verify SPREADSHEET_ID is correct
3. Check browser console for CORS errors
4. Try accessing the CSV export URL directly in browser:
   ```
   https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid={GID}
   ```

### No markers appear on map

**Problem**: Data loaded but no markers visible

**Solutions**:
1. Verify latitude/longitude values are valid numbers
2. Check coordinates are in valid range:
   - Latitude: -90 to 90
   - Longitude: -180 to 180
3. Ensure no blank rows in data
4. Check column names match exactly (case-sensitive)

### Filter dropdowns are empty

**Problem**: No OPCO or Technology options

**Solutions**:
1. Verify sheet has data in `opco` and `technology` columns
2. Check for extra spaces in column names
3. Ensure data rows have values in these columns

### Map shows blank/gray area

**Problem**: OpenStreetMap tiles not loading

**Solutions**:
1. Check internet connection
2. Ensure you're not behind a restrictive firewall
3. Try zooming in/out
4. Clear browser cache

## Advanced Configuration

### Change Map Center and Zoom

Edit MAP_CENTER and MAP_ZOOM in CONFIG:

```javascript
// Delhi
MAP_CENTER: [28.7041, 77.1025]

// Mumbai
MAP_CENTER: [19.0760, 72.8777]

// Bangalore
MAP_CENTER: [12.9716, 77.5946]

// India-wide view
MAP_CENTER: [20.5937, 78.9629]
MAP_ZOOM: 4
```

### Add More Technology Types

Edit the color mapping in `getColorByTechnology()` function:

```javascript
const colors = {
    '2g': '#e74c3c',
    '3g': '#f39c12',
    '4g': '#27ae60',
    '5g': '#9b59b6',
    'gsm': '#e74c3c',
    'umts': '#f39c12',
    'lte': '#27ae60',
    'nr': '#9b59b6',      // New technology
    'custom': '#34495e'   // Custom technology
};
```

### Customize Marker Colors

Edit marker styling in `createMarkers()` function:

```javascript
const marker = L.circleMarker([lat, lng], {
    radius: 8,           // Marker size
    fillColor: color,    // Fill color
    color: '#fff',       // Border color
    weight: 2,          // Border width
    opacity: 1,         // Border opacity
    fillOpacity: 0.8    // Fill opacity
});
```

## Performance Tips

1. **For Large Datasets** (1000+ sites)
   - Use clustering: Install leaflet.markercluster
   - Implement pagination in sidebar
   - Consider splitting data across multiple sheets

2. **Improve Load Time**
   - Cache sheet data locally
   - Use service workers for offline access
   - Compress images

3. **Better Filtering**
   - Add text search
   - Add distance/radius search
   - Add date range filters

## Support Resources

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [OpenStreetMap Wiki](https://wiki.openstreetmap.org/)
- [Browser Console Debugging](https://developer.chrome.com/docs/devtools/)

## Next Steps

1. ✅ Set up basic dashboard
2. ✅ Add your data
3. ✅ Customize appearance
4. ✅ Deploy to production
5. ⏭️ Add analytics
6. ⏭️ Implement real-time updates
7. ⏭️ Build mobile app

---

**Last Updated**: 2026
**Version**: 1.0.0
