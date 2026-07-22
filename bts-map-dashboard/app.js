// Configuration
const CONFIG = {
    SPREADSHEET_ID: '1emHCg9TURpaiBueP_yusDcFAdbq3WNYbvmJigJMm90s',
    SHEET_ID: '0',
    MAP_CENTER: [20.5937, 78.9629], // India center
    MAP_ZOOM: 5,
    API_ENDPOINT: 'https://docs.google.com/spreadsheets/d/{id}/export?format=csv&gid={gid}',
    CESIUM_ION_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2MzUzYWI5NS1kMDI1LTQxNDQtODQxYS04YTU4OWEzODhkNTAiLCJpZCI6MjE4NzEsInNjb3BlcyI6WyJhc3IiLCJnYzp3ZWIiLCJnYzp3ZWJfcHJpdmF0ZSIsImJhc2ljIl0sImlhdCI6MTY0NzcyOTY4NX0.9UHYxJXLyKJZJf_0o2tWvvJRt5f62eYCQV3DLu_QMcA'
};

// State management
const state = {
    allMarkers: [],
    filteredMarkers: [],
    map: null,
    markerLayer: null,
    selectedMarker: null,
    data: [],
    filters: {
        opco: '',
        technology: ''
    },
    baseLayers: {},
    mapType: '2d',
    cesiumViewer: null,
    cesiumEntities: [],
    is3DMode: false
};

// Initialize map
function initializeMap() {
    state.map = L.map('map').setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);
    
    // Define base layers
    const osmRoads = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        name: 'Roads'
    });
    
    const osmSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
        name: 'Satellite'
    });
    
    const osmTerrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
        maxZoom: 17,
        name: 'Terrain'
    });
    
    // Store base layers
    state.baseLayers = {
        'Roads': osmRoads,
        'Satellite': osmSatellite,
        'Terrain': osmTerrain
    };
    
    // Add default layer
    osmRoads.addTo(state.map);
    
    // Add layer control
    L.control.layers(state.baseLayers, {}).addTo(state.map);
    
    // Create marker layer
    state.markerLayer = L.featureGroup().addTo(state.map);
}

// Initialize Cesium 3D viewer
function initializeCesiumViewer() {
    try {
        Cesium.Ion.defaultAccessToken = CONFIG.CESIUM_ION_TOKEN;
        
        state.cesiumViewer = new Cesium.Viewer('cesium-container', {
            terrainProvider: Cesium.Ion.terrainProvider,
            baseLayerPicker: true,
            geocoder: false,
            homeButton: true,
            sceneModePicker: true,
            selectionIndicator: true,
            timeline: false,
            animation: false,
            fullscreenButton: true
        });
        
        // Set initial view to India
        state.cesiumViewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(78.9629, 20.5937, 2500000),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-90.0),
                roll: 0.0
            }
        });
        
        // Add OSM buildings layer
        try {
            state.cesiumViewer.scene.primitives.add(
                Cesium.Cesium3DTileset.fromUrl(
                    'https://tile.openstreetmap.se/data/buildings/tileset.json'
                )
            );
        } catch (e) {
            console.log('OSM buildings layer not available');
        }
        
    } catch (error) {
        console.error('Error initializing Cesium viewer:', error);
    }
}

// Toggle between 2D and 3D maps
function toggleMapType(mapType) {
    state.mapType = mapType;
    
    if (mapType === '3d') {
        // Switch to 3D
        document.getElementById('map').style.display = 'none';
        document.getElementById('cesium-container').style.display = 'block';
        
        if (!state.cesiumViewer) {
            initializeCesiumViewer();
        }
        
        // Add markers to Cesium viewer
        addCesiumMarkers(state.filteredMarkers.length > 0 ? state.filteredMarkers : state.allMarkers);
        state.is3DMode = true;
    } else {
        // Switch to 2D
        document.getElementById('map').style.display = 'block';
        document.getElementById('cesium-container').style.display = 'none';
        state.is3DMode = false;
        
        // Ensure 2D map is visible
        state.map.invalidateSize();
        
        // Re-fit bounds
        if (state.filteredMarkers.length > 0) {
            const group = L.featureGroup(state.filteredMarkers);
            state.map.fitBounds(group.getBounds(), { padding: [50, 50] });
        } else if (state.allMarkers.length > 0) {
            const group = L.featureGroup(state.allMarkers);
            state.map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }
}

// Add markers to Cesium viewer
function addCesiumMarkers(markers) {
    // Clear existing entities
    state.cesiumEntities.forEach(entity => {
        state.cesiumViewer.entities.remove(entity);
    });
    state.cesiumEntities = [];
    
    markers.forEach(marker => {
        const data = marker.data;
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        
        const entity = state.cesiumViewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
            point: {
                pixelSize: 10,
                color: Cesium.Color.fromCssColorString(getColorByTechnology(data.technology)),
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: data.sitename || 'BTS Site',
                font: '14px sans-serif',
                showBackground: true,
                backgroundColor: Cesium.Color.fromAlpha(Cesium.Color.BLACK, 0.7),
                pixelOffset: new Cesium.Cartesian2(0, -20),
                fillColor: Cesium.Color.WHITE
            },
            description: createPopupContent(data)
        });
        
        state.cesiumEntities.push(entity);
    });
}

// Fetch data from Google Sheets
async function fetchSheetData() {
    try {
        const url = CONFIG.API_ENDPOINT
            .replace('{id}', CONFIG.SPREADSHEET_ID)
            .replace('{gid}', CONFIG.SHEET_ID);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const csvText = await response.text();
        const data = parseCSV(csvText);
        return data;
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        showError('Failed to load data from Google Sheets. Please ensure the sheet is publicly accessible.');
        return [];
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 3) continue; // Skip incomplete rows
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        // Validate latitude and longitude
        const lat = parseFloat(row.latitude);
        const lng = parseFloat(row.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            data.push(row);
        }
    }
    
    return data;
}

// Create markers from data
function createMarkers(data) {
    state.allMarkers = [];
    state.markerLayer.clearLayers();
    
    data.forEach((row, index) => {
        const lat = parseFloat(row.latitude);
        const lng = parseFloat(row.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: getColorByTechnology(row.technology),
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });
            
            marker.data = row;
            marker.on('click', () => onMarkerClick(marker));
            marker.on('mouseover', () => marker.setRadius(10));
            marker.on('mouseout', () => marker.setRadius(8));
            
            const popupContent = createPopupContent(row);
            marker.bindPopup(popupContent);
            
            state.markerLayer.addLayer(marker);
            state.allMarkers.push(marker);
        }
    });
    
    // Fit bounds
    if (state.allMarkers.length > 0) {
        const group = L.featureGroup(state.allMarkers);
        state.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
}

// Get color based on technology
function getColorByTechnology(tech) {
    const colors = {
        '2g': '#e74c3c',
        '3g': '#f39c12',
        '4g': '#27ae60',
        '5g': '#9b59b6',
        'gsm': '#e74c3c',
        'umts': '#f39c12',
        'lte': '#27ae60'
    };
    
    const normalizedTech = (tech || '').toLowerCase();
    for (const [key, color] of Object.entries(colors)) {
        if (normalizedTech.includes(key)) return color;
    }
    
    return '#3498db'; // default color
}

// Create popup content
function createPopupContent(row) {
    return `
        <div class="popup-content">
            <h3>${row.sitename || 'BTS Site'}</h3>
            <p><strong>OPCO:</strong> ${row.opco || 'N/A'}</p>
            <p><strong>Technology:</strong> ${row.technology || 'N/A'}</p>
            <p><strong>Location:</strong> ${row.latitude}, ${row.longitude}</p>
            ${row.address ? `<p><strong>Address:</strong> ${row.address}</p>` : ''}
            ${row.status ? `<p><strong>Status:</strong> ${row.status}</p>` : ''}
        </div>
    `;
}

// Handle marker click
function onMarkerClick(marker) {
    state.selectedMarker = marker;
    updateSidebarForMarker(marker);
    state.map.setView(marker.getLatLng(), 15);
}

// Update sidebar with marker info
function updateSidebarForMarker(marker) {
    const data = marker.data;
    const html = `
        <div class="site-item active">
            <div class="site-name">${data.sitename || 'BTS Site'}</div>
            <div class="site-meta">
                <span><strong>OPCO:</strong> ${data.opco || 'N/A'}</span>
            </div>
            <div class="site-meta">
                <span><strong>Technology:</strong> ${data.technology || 'N/A'}</span>
            </div>
            <div class="site-meta">
                <span><strong>Coordinates:</strong></span>
                <br>${data.latitude}, ${data.longitude}
            </div>
            ${data.address ? `<div class="site-meta"><strong>Address:</strong> ${data.address}</div>` : ''}
            ${data.status ? `<div class="site-meta"><strong>Status:</strong> ${data.status}</div>` : ''}
        </div>
    `;
    
    document.getElementById('siteList').innerHTML = html;
}

// Populate filter options
function populateFilters() {
    const opcos = new Set();
    const techs = new Set();
    
    state.data.forEach(row => {
        if (row.opco) opcos.add(row.opco);
        if (row.technology) techs.add(row.technology);
    });
    
    // Sort and populate OPCO filter
    const opcoSelect = document.getElementById('opcoFilter');
    Array.from(opcos).sort().forEach(opco => {
        const option = document.createElement('option');
        option.value = opco;
        option.textContent = opco;
        opcoSelect.appendChild(option);
    });
    
    // Sort and populate Technology filter
    const techSelect = document.getElementById('techFilter');
    Array.from(techs).sort().forEach(tech => {
        const option = document.createElement('option');
        option.value = tech;
        option.textContent = tech;
        techSelect.appendChild(option);
    });
}

// Apply filters - completely hide non-matching markers
function applyFilters() {
    const opco = document.getElementById('opcoFilter').value;
    const tech = document.getElementById('techFilter').value;
    
    state.filters.opco = opco;
    state.filters.technology = tech;
    
    state.filteredMarkers = state.allMarkers.filter(marker => {
        const data = marker.data;
        
        if (opco && data.opco !== opco) return false;
        if (tech && data.technology !== tech) return false;
        
        return true;
    });
    
    if (state.is3DMode) {
        // Update Cesium markers
        addCesiumMarkers(state.filteredMarkers);
        
        // Fly to filtered markers
        if (state.filteredMarkers.length > 0) {
            const bounds = state.filteredMarkers.map(m => ({
                lat: parseFloat(m.data.latitude),
                lng: parseFloat(m.data.longitude)
            }));
            
            const center = {
                lng: bounds.reduce((sum, b) => sum + b.lng, 0) / bounds.length,
                lat: bounds.reduce((sum, b) => sum + b.lat, 0) / bounds.length
            };
            
            state.cesiumViewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(center.lng, center.lat, 500000)
            });
        }
    } else {
        // Remove all markers from map
        state.markerLayer.clearLayers();
        
        // Add only filtered markers back to map
        state.filteredMarkers.forEach(marker => {
            state.markerLayer.addLayer(marker);
        });
        
        // Update bounds if markers exist
        if (state.filteredMarkers.length > 0) {
            const group = L.featureGroup(state.filteredMarkers);
            state.map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }
    
    // Update counts
    updateCounts();
    updateSiteList();
}

// Update site list in sidebar
function updateSiteList() {
    const siteListDiv = document.getElementById('siteList');
    
    if (state.filteredMarkers.length === 0) {
        siteListDiv.innerHTML = '<p style="padding: 15px; text-align: center; color: #7f8c8d;">No sites found</p>';
        return;
    }
    
    let html = '';
    state.filteredMarkers.forEach(marker => {
        const data = marker.data;
        html += `
            <div class="site-item" onclick="handleSiteItemClick(this)" data-lat="${data.latitude}" data-lng="${data.longitude}">
                <div class="site-name">${data.sitename || 'BTS Site'}</div>
                <div class="site-meta">
                    <span>${data.opco || 'N/A'}</span>
                    <span>${data.technology || 'N/A'}</span>
                </div>
            </div>
        `;
    });
    
    siteListDiv.innerHTML = html;
}

// Handle site item click in sidebar
function handleSiteItemClick(element) {
    const lat = parseFloat(element.getAttribute('data-lat'));
    const lng = parseFloat(element.getAttribute('data-lng'));
    
    if (state.is3DMode) {
        state.cesiumViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lng, lat, 50000)
        });
    } else {
        state.map.setView([lat, lng], 15);
    }
}

// Update counts
function updateCounts() {
    document.getElementById('markerCount').textContent = `Total BTS Sites: ${state.allMarkers.length}`;
    document.getElementById('filteredCount').textContent = `Filtered: ${state.filteredMarkers.length}`;
}

// Reset filters
function resetFilters() {
    document.getElementById('opcoFilter').value = '';
    document.getElementById('techFilter').value = '';
    state.filters = { opco: '', technology: '' };
    
    if (state.is3DMode) {
        addCesiumMarkers(state.allMarkers);
        
        if (state.allMarkers.length > 0) {
            const bounds = state.allMarkers.map(m => ({
                lat: parseFloat(m.data.latitude),
                lng: parseFloat(m.data.longitude)
            }));
            
            const center = {
                lng: bounds.reduce((sum, b) => sum + b.lng, 0) / bounds.length,
                lat: bounds.reduce((sum, b) => sum + b.lat, 0) / bounds.length
            };
            
            state.cesiumViewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(center.lng, center.lat, 2500000)
            });
        }
    } else {
        // Clear and rebuild all markers on map
        state.markerLayer.clearLayers();
        state.allMarkers.forEach(marker => {
            state.markerLayer.addLayer(marker);
        });
        
        // Reset bounds
        if (state.allMarkers.length > 0) {
            const group = L.featureGroup(state.allMarkers);
            state.map.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    }
    
    state.filteredMarkers = state.allMarkers;
    
    updateCounts();
    updateSiteList();
}

// Show error message
function showError(message) {
    const loading = document.getElementById('loading');
    loading.innerHTML = `<p style="color: red;">${message}</p>`;
    loading.style.display = 'block';
}

// Initialize app
async function initializeApp() {
    initializeMap();
    
    const loading = document.getElementById('loading');
    loading.style.display = 'block';
    
    try {
        state.data = await fetchSheetData();
        
        if (state.data.length > 0) {
            createMarkers(state.data);
            populateFilters();
            state.filteredMarkers = state.allMarkers;
            updateCounts();
            updateSiteList();
        } else {
            showError('No valid data found in the spreadsheet.');
        }
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Error initializing the application.');
    } finally {
        loading.style.display = 'none';
    }
}

// Event listeners
document.getElementById('opcoFilter').addEventListener('change', applyFilters);
document.getElementById('techFilter').addEventListener('change', applyFilters);
document.getElementById('resetFilters').addEventListener('click', resetFilters);
document.getElementById('mapTypeSelector').addEventListener('change', (e) => {
    toggleMapType(e.target.value);
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', initializeApp);
