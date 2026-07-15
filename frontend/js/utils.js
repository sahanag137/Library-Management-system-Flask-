/* ================================
   LibraryPro - Utility Functions
   ================================ */

// ── Toast Notifications ──
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Date Formatting ──
function formatDate(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function daysOverdue(dueDateStr) {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const now = new Date();
    const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
}

// ── Status Badge HTML ──
function statusBadge(status) {
    const map = {
        'Active':    'badge-active',
        'Returned':  'badge-returned',
        'Overdue':   'badge-overdue',
        'Suspended': 'badge-suspended',
        'Expired':   'badge-expired',
        'Standard':  'badge-standard',
        'Premium':   'badge-premium',
        'Student':   'badge-student'
    };
    const cls = map[status] || 'badge-standard';
    return `<span class="badge ${cls}">${status}</span>`;
}

// ── Availability Pill ──
function availabilityPill(available, total) {
    const pct = total > 0 ? (available / total) * 100 : 0;
    const color = pct === 0 ? 'danger' : pct < 50 ? 'warning' : 'success';
    const colors = { danger: '#ef4444', warning: '#f59e0b', success: '#10b981' };
    return `<span style="color:${colors[color]};font-weight:600">${available}/${total}</span>`;
}

// ── Modal Controls ──
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}
function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

// Close modals via close buttons and overlay click
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal || btn.closest('.modal-overlay')?.id;
            if (modalId) closeModal(modalId);
        });
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });
});

// ── Pagination Builder ──
function buildPagination(containerId, currentPage, totalPages, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageChange(currentPage - 1);
    container.appendChild(prevBtn);

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `page-btn${i === currentPage ? ' active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => onPageChange(i);
        container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => onPageChange(currentPage + 1);
    container.appendChild(nextBtn);
}

// ── Clock ──
function startClock() {
    const el = document.getElementById('topbarTime');
    if (!el) return;
    const update = () => {
        const now = new Date();
        el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };
    update();
    setInterval(update, 1000);
}

// ── Debounce ──
function debounce(fn, delay = 350) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ── Currency ──
function formatCurrency(amount) {
    return amount > 0 ? `₹${parseFloat(amount).toFixed(2)}` : '-';
}
