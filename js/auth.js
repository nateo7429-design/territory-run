// Territory Run - Authentication

let currentUser = null;

// Check authentication state
async function checkAuth() {
    if (!supabase) {
        console.error('Supabase not initialized');
        return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
}

function showApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('user-email').textContent = currentUser.email;
    initializeMap();
    loadRuns();
}

// Toggle between login and signup forms
function toggleAuthForms() {
    document.getElementById('show-signup').addEventListener('click', () => {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
    });

    document.getElementById('show-login').addEventListener('click', () => {
        document.getElementById('signup-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });
}

// Handle login
async function handleLogin(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        showApp();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Handle signup
async function handleSignup(email, password) {
    try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        currentUser = data.user;
        showApp();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Handle logout
async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    if (map) {
        map.remove();
        map = null;
    }
    showAuth();
}

// Initialize auth event listeners
function initializeAuth() {
    toggleAuthForms();
    
    // Login form
    document.getElementById('login-form-element').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        const result = await handleLogin(email, password);
        if (!result.success) {
            errorEl.textContent = result.error;
            errorEl.classList.remove('hidden');
        }
    });

    // Signup form
    document.getElementById('signup-form-element').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const errorEl = document.getElementById('signup-error');

        const result = await handleSignup(email, password);
        if (!result.success) {
            errorEl.textContent = result.error;
            errorEl.classList.remove('hidden');
        }
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
}
