// Territory Run - Leaderboard

let leaderboardData = [];
let userRank = null;

// Load leaderboard data from database
async function loadLeaderboard() {
    if (!supabase) {
        console.error('Cannot load leaderboard: No database');
        return;
    }
    
    try {
        // Get all users with their total area
        const { data, error } = await supabase
            .from('runs')
            .select('user_id, area');

        if (error) throw error;

        // Group by user_id and sum their areas
        const userTotals = {};
        data.forEach(run => {
            if (!userTotals[run.user_id]) {
                userTotals[run.user_id] = 0;
            }
            userTotals[run.user_id] += parseFloat(run.area);
        });

        // Convert to array and sort by area (descending)
        leaderboardData = Object.entries(userTotals)
            .map(([user_id, totalArea]) => ({
                user_id,
                totalArea
            }))
            .sort((a, b) => b.totalArea - a.totalArea);

        // Find current user's rank
        userRank = leaderboardData.findIndex(u => u.user_id === currentUser.id) + 1;

        updateLeaderboardUI();
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

// Update leaderboard UI
function updateLeaderboardUI() {
    const listEl = document.getElementById('leaderboard-list');
    
    if (leaderboardData.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-sm">No data yet. Be the first!</p>';
        return;
    }
    
    // Show top 10
    const top10 = leaderboardData.slice(0, 10);
    
    listEl.innerHTML = top10.map((user, idx) => {
        const rank = idx + 1;
        const isCurrentUser = user.user_id === currentUser.id;
        
        return `
            <div class="flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-blue-900 border-2 border-blue-500' : 'bg-gray-700'}">
                <div class="flex items-center gap-3">
                    <span class="text-2xl font-bold ${rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}">
                        ${rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </span>
                    <div>
                        <div class="font-semibold ${isCurrentUser ? 'text-blue-300' : 'text-white'}">
                            ${isCurrentUser ? 'You' : `User ${user.user_id.substring(0, 8)}`}
                        </div>
                        <div class="text-xs text-gray-400">Rank #${rank}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-blue-400">${user.totalArea.toFixed(3)} km²</div>
                </div>
            </div>
        `;
    }).join('');
    
    // Update user rank display
    if (userRank) {
        document.getElementById('user-rank').textContent = `#${userRank}`;
    }
}

// Toggle leaderboard visibility
function toggleLeaderboard() {
    const modal = document.getElementById('leaderboard-modal');
    const isHidden = modal.classList.contains('hidden');
    
    if (isHidden) {
        modal.classList.remove('hidden');
        loadLeaderboard(); // Refresh data when opening
    } else {
        modal.classList.add('hidden');
    }
}
