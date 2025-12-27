// Territory Run - Runs Management (Database operations)

let completedRuns = [];
let totalArea = 0;
let totalDistance = 0;

// Load all runs for current user from database
async function loadRuns() {
    if (!supabase || !currentUser) {
        console.error('Cannot load runs: No user or database');
        return;
    }
    
    document.getElementById('loading-indicator').classList.remove('hidden');
    
    try {
        const { data, error } = await supabase
            .from('runs')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        completedRuns = data || [];
        console.log('Loaded runs:', completedRuns.length);
        
        updateStats();
        updateRunsList();
        drawAllTerritories(completedRuns);
        
    } catch (error) {
        console.error('Error loading runs:', error);
        alert('Error loading your runs. Please refresh the page.');
    } finally {
        document.getElementById('loading-indicator').classList.add('hidden');
    }
}

// Save a new run to database
async function saveRun(run) {
    if (!supabase || !currentUser) {
        console.error('Cannot save run: No user or database');
        return null;
    }
    
    try {
        const { data, error } = await supabase
            .from('runs')
            .insert([{
                user_id: currentUser.id,
                path: run.path,
                buffered_area: run.bufferedArea,
                area: run.area,
                distance: run.distance
            }])
            .select();

        if (error) throw error;
        
        console.log('Run saved to database:', data[0]);
        return data[0];
        
    } catch (error) {
        console.error('Error saving run:', error);
        alert('Error saving your run to database.');
        return null;
    }
}

// Update statistics display with animation
function updateStats() {
    // Calculate totals from all runs
    const newArea = completedRuns.reduce((sum, run) => sum + parseFloat(run.area || 0), 0);
    const newDistance = completedRuns.reduce((sum, run) => sum + parseFloat(run.distance || 0), 0);
    
    // Animate number changes
    animateValue('total-area', totalArea, newArea, 500, 3);
    animateValue('total-distance', totalDistance, newDistance, 500, 2);
    animateValue('total-runs', completedRuns.length - 1, completedRuns.length, 300, 0);
    
    // Update leaderboard user area if modal is open
    const leaderboardUserArea = document.getElementById('leaderboard-user-area');
    if (leaderboardUserArea) {
        leaderboardUserArea.textContent = newArea.toFixed(3);
    }
    
    totalArea = newArea;
    totalDistance = newDistance;
    
    console.log('Stats updated:', { totalArea, totalDistance, runs: completedRuns.length });
}

// Animate number counting up
function animateValue(elementId, start, end, duration, decimals) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = current.toFixed(decimals);
    }, 16);
}

// Update the runs list in sidebar
function updateRunsList() {
    const listEl = document.getElementById('runs-list');
    
    if (completedRuns.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-sm">No runs yet. Start your first run!</p>';
        return;
    }
    
    // Show only the 5 most recent runs
    const recentRuns = completedRuns.slice(0, 5);
    
    listEl.innerHTML = recentRuns.map((run, idx) => `
        <div class="bg-gray-700 p-3 rounded-lg text-sm">
            <div class="flex justify-between mb-1">
                <span class="text-gray-300">Run #${completedRuns.length - idx}</span>
                <span class="text-blue-400">${parseFloat(run.area).toFixed(3)} km²</span>
            </div>
            <div class="text-gray-400 text-xs">
                ${parseFloat(run.distance).toFixed(2)} km • ${run.path.length} points
            </div>
        </div>
    `).join('');
}

// Process and save a completed run
async function processCompletedRun(path) {
    if (path.length < CONFIG.TERRITORY.MIN_POINTS) {
        alert(`Need at least ${CONFIG.TERRITORY.MIN_POINTS} points to create a territory!`);
        return false;
    }
    
    // Calculate total distance
    let distance = 0;
    for (let i = 1; i < path.length; i++) {
        distance += calculateDistance(path[i - 1], path[i]);
    }
    
    // Create buffered area and calculate territory
    const bufferedArea = createBufferedPolygon(path);
    const area = bufferedArea ? calculatePolygonArea(bufferedArea) : 0;
    
    // Create run object
    const newRun = {
        path: path.map(p => ({ lat: p.lat, lng: p.lng })),
        bufferedArea: bufferedArea ? bufferedArea.map(p => ({ lat: p.lat, lng: p.lng })) : null,
        area,
        distance
    };
    
    // Save to database
    const savedRun = await saveRun(newRun);
    
    if (savedRun) {
        completedRuns.unshift(savedRun);
        console.log('Run saved successfully');
    } else {
        // Fallback: save locally if database fails
        completedRuns.unshift(newRun);
        console.log('Run saved locally only');
    }
    
    // Update UI
    updateStats();
    updateRunsList();
    drawAllTerritories(completedRuns);
    
    // Force a second update to ensure everything displays
    setTimeout(() => {
        updateStats();
        updateRunsList();
    }, 100);
    
    return true;
}
