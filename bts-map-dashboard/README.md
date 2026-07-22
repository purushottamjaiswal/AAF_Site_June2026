# BTS Site Map Dashboard

A web-based interactive dashboard for visualizing Base Transceiver Station (BTS) locations on an open-source map with filtering capabilities.

## Features

✨ **Core Features:**
- Real-time data fetching from Google Sheets
- Interactive map visualization using Leaflet
- BTS site markers with color-coded technology types
- Filter by OPCO (Operator) and Technology (2G, 3G, 4G, 5G, etc.)
- Responsive sidebar with site information
- Click-to-center functionality for site locations
- Mobile-friendly responsive design

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Map Library**: [Leaflet.js](https://leafletjs.com/) - Open-source map library
- **Tile Provider**: OpenStreetMap - Free map tiles
- **Data Source**: Google Sheets CSV export

## Getting Started

### Prerequisites

1. A Google Sheet with BTS data (see [Data Format](#data-format))
2. Modern web browser with JavaScript enabled
3. Internet connection (for map tiles and data fetching)

### Setup Instructions

1. **Prepare Your Google Sheet**
   - Create or use an existing Google Sheet with BTS site data
   - Make sure the sheet is publicly accessible ("Anyone with the link can view")
   - Add the following columns: `sitename`, `latitude`, `longitude`, `opco`, `technology`, `address`, `status`

2. **Update Configuration**
   - Open `app.js`
   - Update the `CONFIG` object with your Google Sheet ID and Sheet ID:
   ```javascript
   const CONFIG = {
       SPREADSHEET_ID: 'YOUR_SHEET_ID',
       SHEET_ID: '0' // Gid of the sheet tab
   };
   ```

3. **Deploy**
   - Open `index.html` in a web browser
   - Or deploy to a web server/GitHub Pages

## Data Format

Your Google Sheet should have the following columns:

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| sitename | String | Name of the BTS site | Yes |
| latitude | Number | Latitude coordinate | Yes |
| longitude | Number | Longitude coordinate | Yes |
| opco | String | Operator/Company name | Yes |
| technology | String | Technology type (2G, 3G, 4G, 5G) | Yes |
| address | String | Physical address of the site | No |
| status | String | Operational status | No |

**Example Data:**
```
SiteName,Latitude,Longitude,OPCO,Technology,Address,Status
Delhi-Tower-01,28.7041,77.1025,Operator1,4G,123 Main St Delhi,Active
Mumbai-Tower-02,19.0760,72.8777,Operator2,5G,456 Oak Ave Mumbai,Active
```

## Usage

### Basic Navigation
1. **View Map**: All BTS sites are displayed as colored markers on the map
2. **Filter by OPCO**: Select an operator from the OPCO dropdown
3. **Filter by Technology**: Select a technology type from the Technology dropdown
4. **Reset Filters**: Click "Reset Filters" to clear all filters
5. **View Details**: Click on a marker or site in the sidebar to view detailed information

### Marker Color Coding
- 🔴 **Red**: 2G/GSM
- 🟠 **Orange**: 3G/UMTS
- 🟢 **Green**: 4G/LTE
- 🟣 **Purple**: 5G
- 🔵 **Blue**: Unknown/Other

## File Structure

```
bts-map-dashboard/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── app.js              # Application logic
└── README.md           # This file
```

## Configuration

Edit the `CONFIG` object in `app.js` to customize:

```javascript
const CONFIG = {
    SPREADSHEET_ID: '1CfG5nG9UCWtowaldd-CR-egIsgnOclflOXT08bBz5s0',
    SHEET_ID: '0',
    MAP_CENTER: [20.5937, 78.9629], // Default map center
    MAP_ZOOM: 5                      // Default zoom level
};
```

## Troubleshooting

### Data not loading
- Ensure Google Sheet is publicly accessible
- Check browser console for errors (F12 -> Console)
- Verify SPREADSHEET_ID and SHEET_ID are correct
- Ensure column names match exactly (case-sensitive)

### Markers not appearing
- Check that latitude and longitude values are valid numbers
- Verify coordinates are within valid ranges (-90 to 90 for lat, -180 to 180 for lng)
- Ensure at least 3 rows of data exist in the sheet

### Map not loading
- Check internet connection (required for map tiles)
- Try a different browser
- Clear browser cache and reload

## Browser Support

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- IE 11: ⚠️ Limited support

## Performance

- Handles up to 1000+ markers efficiently
- Lazy loads map tiles from OpenStreetMap
- Responsive filtering without page reload

## API References

- [Leaflet.js Documentation](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [Google Sheets Export API](https://docs.google.com/spreadsheets/)

## License

MIT License - Feel free to use and modify for your projects.

## Support

For issues or suggestions, please create an issue in the repository.

## Future Enhancements

- [ ] Heat map visualization
- [ ] Coverage radius display
- [ ] Export data to CSV/GeoJSON
- [ ] Real-time data updates
- [ ] Multiple marker clustering
- [ ] Advanced analytics dashboard
- [ ] Dark mode theme
- [ ] Custom marker icons
- [ ] Radius/circle search
- [ ] Mobile app version

---

**Note**: This project uses open-source and free map services. Please review their terms of service for production use.
