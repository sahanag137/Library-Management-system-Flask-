/* ================================
   LibraryPro - Main App Controller
   Handles routing, auth, and navigation
   ================================ */

const PAGES = ['dashboard', 'books', 'members', 'transactions', 'overdue'];

// ── Auth Check ──
async function checkAuthentication() {
    const result = await api.checkAuth();
    if (!result.ok || !result.data.authenticated) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// ── Navigation ──
function navigateTo(page) {
    if (!PAGES.includes(page)) return;

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Update pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.toggle('active', p.id === `page-${page}`);
    });

    // Update page title
    const titles = {
        dashboard: '📊 Dashboard',
        books: '📖 Books',
        members: '👥 Members',
        transactions: '🔄 Transactions',
        overdue: '⏰ Overdue Books'
    };
    document.getElementById('pageTitle').textContent = titles[page] || page;

    // Load page data
    switch (page) {
        case 'dashboard':
            initDashboard();
            break;
        case 'books':
            loadBooks(1);
            loadGenres();
            break;
        case 'members':
            loadMembers(1);
            break;
        case 'transactions':
            loadTransactions(1);
            break;
        case 'overdue':
            loadOverdue();
            break;
    }

    // Update URL hash
    window.location.hash = page;
}

// ── Load Admin Info ──
async function loadAdminInfo() {
    const result = await api.getMe();
    if (result.ok) {
        const admin = result.data.admin;
        document.getElementById('adminName').textContent = admin.full_name || admin.username;
        document.getElementById('adminInfo').querySelector('.admin-avatar').textContent = 
            (admin.full_name || admin.username)[0].toUpperCase();
    }
}

// ── Logout ──
async function handleLogout() {
    await api.logout();
    window.location.href = 'index.html';
}

// ── Sidebar Toggle ──
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebarToggle');
    let collapsed = localStorage.getItem('sidebar-collapsed') === 'true';

    function applyState() {
        sidebar.classList.toggle('collapsed', collapsed);
        localStorage.setItem('sidebar-collapsed', collapsed);
    }
    applyState();

    toggle?.addEventListener('click', () => {
        collapsed = !collapsed;
        applyState();
    });
}

// ── Navigation Events ──
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    // Stat cards navigation
    document.querySelector('.stat-books')?.addEventListener('click', () => navigateTo('books'));
    document.querySelector('.stat-members')?.addEventListener('click', () => navigateTo('members'));
    document.querySelector('.stat-borrowed')?.addEventListener('click', () => navigateTo('transactions'));
    document.querySelector('.stat-overdue')?.addEventListener('click', () => navigateTo('overdue'));
}

// ── App Init ──
async function initApp() {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;

    initSidebar();
    initNavigation();
    startClock();
    loadAdminInfo();

    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Determine initial page from hash
    const hash = window.location.hash.replace('#', '');
    const initialPage = PAGES.includes(hash) ? hash : 'dashboard';
    navigateTo(initialPage);
}

document.addEventListener('DOMContentLoaded', initApp);
