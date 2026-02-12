// Simple Auth Logic with Roles
const DEFAULT_USERS = {
    'admin': { pass: 'admin', role: 'admin' },
    'user': { pass: '1234', role: 'user' },
    'nek': { pass: 'nek123', role: 'user' }
};

document.addEventListener('DOMContentLoaded', () => {
    checkSession();

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            login(u, p);
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
});

function getUsers() {
    const stored = JSON.parse(localStorage.getItem('nek_users') || '{}');
    return { ...DEFAULT_USERS, ...stored };
}

function login(user, pass) {
    const users = getUsers();
    const errorMsg = document.getElementById('login-error');

    if (users[user] && users[user].pass === pass) {
        localStorage.setItem('nek_user', user);
        localStorage.setItem('nek_role', users[user].role);
        errorMsg.innerText = '';
        checkSession();
    } else {
        errorMsg.innerText = 'Usuário ou senha incorretos';
    }
}

function logout() {
    localStorage.removeItem('nek_user');
    localStorage.removeItem('nek_role');
    checkSession();
}


function checkSession() {
    const user = localStorage.getItem('nek_user');
    let role = localStorage.getItem('nek_role');

    // Auto-recover role if missing (migration fix)
    if (user && !role) {
        const users = getUsers();
        if (users[user]) {
            role = users[user].role;
            localStorage.setItem('nek_role', role);
        }
    }

    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const userDisplay = document.getElementById('user-display');
    const adminPanel = document.getElementById('admin-panel');

    if (user) {
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        if (userDisplay) userDisplay.innerText = `${user} (${role === 'admin' ? 'Admin' : 'Rep'})`;

        // Show/Hide Admin Panel
        if (role === 'admin' && adminPanel) {
            adminPanel.classList.remove('hidden');
        } else if (adminPanel) {
            adminPanel.classList.add('hidden');
        }

        // Trigger app load if needed (avoid double init)
        if (window.loadApp && !window.appInitialized) {
            window.loadApp();
            window.appInitialized = true;
        }
    } else {
        loginScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
        window.appInitialized = false;
    }
}

// Admin Functions
function registerUser(username, password, role = 'user') {
    const stored = JSON.parse(localStorage.getItem('nek_users') || '{}');
    if (DEFAULT_USERS[username] || stored[username]) {
        return { success: false, message: 'Usuário já existe' };
    }

    stored[username] = { pass: password, role };
    localStorage.setItem('nek_users', JSON.stringify(stored));
    return { success: true, message: 'Usuário cadastrado com sucesso' };
}

// Expose admin function to window
window.registerUser = registerUser;

