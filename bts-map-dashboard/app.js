// Configuration
const CONFIG = {
    SPREADSHEET_ID: '1emHCg9TURpaiBueP_yusDcFAdbq3WNYbvmJigJMm90s',
    SHEET_ID: '0',
    MAP_CENTER: [20.5937, 78.9629], // India center
    MAP_ZOOM: 5,
    API_ENDPOINT: 'https://docs.google.com/spreadsheets/d/{id}/export?format=csv&gid={gid}'
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
    baseLayers: {}
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
    
    state.map.setView([lat, lng], 15);
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
    
    // Clear and rebuild all markers on map
    state.markerLayer.clearLayers();
    state.allMarkers.forEach(marker => {
        state.markerLayer.addLayer(marker);
    });
    
    state.filteredMarkers = state.allMarkers;
    
    // Reset bounds
    if (state.allMarkers.length > 0) {
        const group = L.featureGroup(state.allMarkers);
        state.map.fitBounds(group.getBounds(), { padding: [50, 50] });
    }
    
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

// Initialize on page load
window.addEventListener('DOMContentLoaded', initializeApp);
