// Territory Run - Configuration

const CONFIG = {
    SUPABASE_URL: 'https://cycowcfrbinxtphgzcxl.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Y293Y2ZyYmlueHRwaGd6Y3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NDQwOTksImV4cCI6MjA4MjQyMDA5OX0.hgF5rR0GKjOmVyX8MedAnR1H-njT0H8IUzveI0aX87E',
    
    MAP: {
        DEFAULT_CENTER: [30.7333, 76.7794], // Chandigarh
        DEFAULT_ZOOM: 13,
        TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ATTRIBUTION: '© OpenStreetMap contributors'
    },
    
    TERRITORY: {
        BUFFER_METERS: 50,
        MIN_POINTS: 3,
        FILL_OPACITY: 0.5,
        STROKE_WEIGHT: 2
    },
    
    GPS: {
        MIN_DISTANCE_METERS: 5, // Minimum distance between points (0.005 km)
        HIGH_ACCURACY: true,
        TIMEOUT: 5000,
        MAX_AGE: 0
    }
};

// Initialize Supabase
const supabase = window.supabase ? 
    window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY) : 
    null;

if (!supabase) {
    console.error('Supabase failed to load');
}
