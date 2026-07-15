/* ================================
   LibraryPro - Login Page Logic
   ================================ */

document.addEventListener('DOMContentLoaded', async () => {
    // If already logged in, redirect to dashboard
    const result = await api.checkAuth();
    if (result.ok && result.data.authenticated) {
        window.location.href = 'dashboard.html';
        return;
    }

    const form = document.getElementById('loginForm');
    const errorEl = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnSpinner = loginBtn.querySelector('.btn-spinner');

    // Password toggle
    document.getElementById('togglePassword')?.addEventListener('click', () => {
        const pwdInput = document.getElementById('password');
        const isText = pwdInput.type === 'text';
        pwdInput.type = isText ? 'password' : 'text';
        document.getElementById('togglePassword').textContent = isText ? '👁' : '🙈';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.classList.add('hidden');

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            errorEl.textContent = 'Please enter username and password.';
            errorEl.classList.remove('hidden');
            return;
        }

        // Show loading
        loginBtn.disabled = true;
        btnText.textContent = 'Signing in...';
        btnSpinner.classList.remove('hidden');

        const result = await api.login(username, password);

        loginBtn.disabled = false;
        btnText.textContent = 'Sign In';
        btnSpinner.classList.add('hidden');

        if (result.ok) {
            window.location.href = 'dashboard.html';
        } else {
            errorEl.textContent = result.error || 'Login failed. Please try again.';
            errorEl.classList.remove('hidden');
            // Shake animation
            form.style.animation = 'none';
            setTimeout(() => {
                form.style.animation = 'shake 0.4s ease';
            }, 10);
        }
    });
});
