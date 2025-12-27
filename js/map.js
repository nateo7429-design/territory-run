// Territory Run - Map & GPS Logic

let map = null;
let pathLayer = null;
let territoryLayer = null;
let userMarker = null;
let isTracking = false;
let useGPS = false;
let gpsWatchId = null;
let currentPath = [];

// Initialize the map
function initializeMap() {
    if (map) return; // Already initialized
    
    map = L.map('map').setView(CONFIG.MAP.DEFAULT_CENTER, CONFIG.MAP.DEFAULT_ZOOM);
    
    L.tileLayer(CONFIG.MAP.TILE_URL, {
        attribution: CONFIG.MAP.ATTRIBUTION,
        maxZoom: 19
    }).addTo(map);

    pathLayer = L.layerGroup().addTo(map);
    territoryLayer = L.layerGroup().addTo(map);

    // Handle manual clicks (when not using GPS)
    map.on('click', (e) => {
        if (isTracking && !useGPS) {
            currentPath.push(e.latlng);
            updatePath();
        }
    });
}

// Calculate distance between two GPS points (Haversine formula)
function calculateDistance(latlng1, latlng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (latlng2.lat - latlng1.lat) * Math.PI / 180;
    const dLng = (latlng2.lng - latlng1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(latlng1.lat * Math.PI / 180) * Math.cos(latlng2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Calculate area of a polygon (spherical approximation)
function calculatePolygonArea(latlngs) {
    if (latlngs.length < 3) return 0;
    
    const R = 6371;
    let area = 0;
    
    for (let i = 0; i < latlngs.length; i++) {
        const j = (i + 1) % latlngs.length;
        const lat1 = latlngs[i].lat * Math.PI / 180;
        const lat2 = latlngs[j].lat * Math.PI / 180;
        const lng1 = latlngs[i].lng * Math.PI / 180;
        const lng2 = latlngs[j].lng * Math.PI / 180;
        
        area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    
    return Math.abs(area * R * R / 2);
}

// Create buffered polygon around a path (makes it thicker)
function createBufferedPolygon(latlngs, bufferMeters = CONFIG.TERRITORY.BUFFER_METERS) {
    if (latlngs.length < 2) return null;
    
    const buffered = [];
    const metersPerDegree = 111320;
    const buffer = bufferMeters / metersPerDegree;
    
    // Create points on one side of the path
    for (let i = 0; i < latlngs.length; i++) {
        const curr = latlngs[i];
        let perpLat = 0, perpLng = 0;
        
        if (i < latlngs.length - 1) {
            const next = latlngs[i + 1];
            const dLat = next.lat - curr.lat;
            const dLng = next.lng - curr.lng;
            const len = Math.sqrt(dLat * dLat + dLng * dLng);
            if (len > 0) {
                perpLat = -dLng / len * buffer;
                perpLng = dLat / len * buffer;
            }
        }
        
        buffered.push(L.latLng(curr.lat + perpLat, curr.lng + perpLng));
    }
    
    // Create points on the other side (reverse direction)
    for (let i = latlngs.length - 1; i >= 0; i--) {
        const curr = latlngs[i];
        let perpLat = 0, perpLng = 0;
        
        if (i > 0) {
            const prev = latlngs[i - 1];
            const dLat = curr.lat - prev.lat;
            const dLng = curr.lng - prev.lng;
            const len = Math.sqrt(dLat * dLat + dLng * dLng);
            if (len > 0) {
                perpLat = -dLng / len * buffer;
                perpLng = dLat / len * buffer;
            }
        }
        
        buffered.push(L.latLng(curr.lat - perpLat, curr.lng - perpLng));
    }
    
    return buffered;
}

// Update the current path visualization
function updatePath() {
    pathLayer.clearLayers();
    
    if (currentPath.length > 0) {
        // Draw the path line
        L.polyline(currentPath, { 
            color: '#10b981', 
            weight: 4, 
            opacity: 0.8 
        }).addTo(pathLayer);
        
        // Draw point markers
        currentPath.forEach((latlng, idx) => {
            L.circleMarker(latlng, {
                radius: idx === 0 ? 8 : 5,
                fillColor: idx === 0 ? '#10b981' : '#34d399',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(pathLayer);
        });
        
        // Show preview of territory area
        if (currentPath.length > 2) {
            const buffered = createBufferedPolygon(currentPath);
            if (buffered) {
                L.polygon(buffered, {
                    color: '#10b981',
                    weight: 2,
                    fillColor: '#10b981',
                    fillOpacity: 0.2
                }).addTo(pathLayer);
            }
        }
    }
    
    document.getElementById('point-count').textContent = currentPath.length;
}

// Draw all completed territories on the map
function drawAllTerritories(runs) {
    if (!territoryLayer) return;
    territoryLayer.clearLayers();
    
    runs.forEach((run) => {
        const path = run.path.map(p => L.latLng(p.lat, p.lng));
        const bufferedArea = run.buffered_area ? 
            run.buffered_area.map(p => L.latLng(p.lat, p.lng)) : null;
        
        // Draw the territory area
        if (bufferedArea) {
            L.polygon(bufferedArea, {
                color: '#3b82f6',
                weight: CONFIG.TERRITORY.STROKE_WEIGHT,
                fillColor: '#3b82f6',
                fillOpacity: CONFIG.TERRITORY.FILL_OPACITY
            }).addTo(territoryLayer);
        }
        
        // Draw the path line
        L.polyline(path, { 
            color: '#1e40af', 
            weight: 3, 
            opacity: 0.8 
        }).addTo(territoryLayer);
    });
}

// Start GPS tracking
function startGPSTracking() {
    if (!('geolocation' in navigator)) {
        alert('GPS not supported on this device');
        return false;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userPos = [position.coords.latitude, position.coords.longitude];
            map.setView(userPos, 16);
            useGPS = true;
            document.getElementById('gps-indicator').classList.remove('hidden');
            document.getElementById('tracking-text').textContent = 'Recording GPS...';
            
            gpsWatchId = navigator.geolocation.watchPosition(
                handleGPSUpdate,
                handleGPSError,
                {
                    enableHighAccuracy: CONFIG.GPS.HIGH_ACCURACY,
                    timeout: CONFIG.GPS.TIMEOUT,
                    maximumAge: CONFIG.GPS.MAX_AGE
                }
            );
        },
        () => {
            alert('GPS access denied. Using manual mode.');
            return false;
        }
    );
    
    return true;
}

// Handle GPS position updates
function handleGPSUpdate(position) {
    const newPoint = L.latLng(position.coords.latitude, position.coords.longitude);
    
    // Only add point if it's far enough from the last one
    if (currentPath.length === 0 || 
        calculateDistance(currentPath[currentPath.length - 1], newPoint) > CONFIG.GPS.MIN_DISTANCE_METERS / 1000) {
        currentPath.push(newPoint);
        updatePath();
    }
    
    // Update user marker
    if (userMarker) {
        userMarker.setLatLng(newPoint);
    } else {
        userMarker = L.circleMarker(newPoint, {
            radius: 10,
            fillColor: '#10b981',
            color: '#fff',
            weight: 3,
            fillOpacity: 1
        }).addTo(map);
    }
}

// Handle GPS errors
function handleGPSError(error) {
    console.error('GPS Error:', error);
    alert('GPS Error: ' + error.message);
}

// Stop GPS tracking
function stopGPSTracking() {
    if (gpsWatchId) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    useGPS = false;
}
