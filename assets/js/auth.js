// Simple Auth Logic
const USERS = {
    'admin': 'admin',
    'user': '1234',
    'nek': 'nek123'
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

function login(user, pass) {
    const errorMsg = document.getElementById('login-error');
    if (USERS[user] && USERS[user] === pass) {
        localStorage.setItem('nek_user', user);
        errorMsg.innerText = '';
        checkSession();
    } else {
        errorMsg.innerText = 'Usuário ou senha incorretos';
        // Shake animation could go here
    }
}

function logout() {
    localStorage.removeItem('nek_user');
    checkSession();
}

function checkSession() {
    const user = localStorage.getItem('nek_user');
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const userDisplay = document.getElementById('user-display');

    if (user) {
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        if(userDisplay) userDisplay.innerText = user;
        // Trigger app load if needed
        if(window.loadApp) window.loadApp();
    } else {
        loginScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
    }
}
