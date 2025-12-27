// Territory Run - Main Application Logic

// Start Run button handler
function handleStartRun() {
    const wantsGPS = confirm(
        'Enable GPS tracking for real runs?\n\n' +
        'Click OK for GPS mode (real running)\n' +
        'Click Cancel for manual mode (click on map)'
    );
    
    if (wantsGPS) {
        const gpsStarted = startGPSTracking();
        if (!gpsStarted) {
            // GPS failed, use manual mode
            useGPS = false;
        }
    }
    
    // Start tracking
    isTracking = true;
    currentPath = [];
    
    // Update UI
    document.getElementById('start-btn').classList.add('hidden');
    document.getElementById('stop-btn').classList.remove('hidden');
    document.getElementById('tracking-indicator').classList.remove('hidden');
    document.getElementById('points-counter').classList.remove('hidden');
    
    console.log('Run started. GPS mode:', useGPS);
}

// Stop Run button handler
async function handleStopRun() {
    console.log('Stopping run. Points collected:', currentPath.length);
    
    // Stop GPS if active
    if (useGPS) {
        stopGPSTracking();
    }
    
    // Process the run
    const success = await processCompletedRun(currentPath);
    
    if (success) {
        // Clear current run data
        isTracking = false;
        currentPath = [];
        pathLayer.clearLayers();
        
        // Update UI
        document.getElementById('start-btn').classList.remove('hidden');
        document.getElementById('stop-btn').classList.add('hidden');
        document.getElementById('tracking-indicator').classList.add('hidden');
        document.getElementById('points-counter').classList.add('hidden');
        
        console.log('Run completed and saved');
    } else {
        // If run wasn't saved (not enough points), reset everything
        isTracking = false;
        currentPath = [];
        pathLayer.clearLayers();
        
        document.getElementById('start-btn').classList.remove('hidden');
        document.getElementById('stop-btn').classList.add('hidden');
        document.getElementById('tracking-indicator').classList.add('hidden');
        document.getElementById('points-counter').classList.add('hidden');
    }
}

// Initialize all event listeners
function initializeEventListeners() {
    // Start button
    document.getElementById('start-btn').addEventListener('click', handleStartRun);
    
    // Stop button
    document.getElementById('stop-btn').addEventListener('click', handleStopRun);
    
    // Leaderboard button
    document.getElementById('leaderboard-btn').addEventListener('click', toggleLeaderboard);
}

// Main initialization function - runs when page loads
function initializeApp() {
    console.log('Territory Run initializing...');
    
    // Initialize authentication
    initializeAuth();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Check if user is already logged in
    checkAuth();
    
    console.log('Territory Run initialized');
}

// Start the app when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
