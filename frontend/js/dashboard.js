/* ================================
   LibraryPro - Dashboard Module
   ================================ */

async function loadDashboardStats() {
    const result = await api.getDashboardStats();
    if (!result.ok) return;

    const d = result.data;

    // Stat Cards
    animateCount('stat-total-books', d.total_books);
    animateCount('stat-total-members', d.total_members);
    animateCount('stat-active-borrows', d.active_borrows);
    animateCount('stat-overdue', d.overdue_count);

    // Overview
    document.getElementById('ov-total-copies').textContent = d.total_copies;
    document.getElementById('ov-available').textContent = d.available_copies;
    document.getElementById('ov-borrowed').textContent = d.total_copies - d.available_copies;

    // Availability bar
    const pct = d.total_copies > 0 ? Math.round((d.available_copies / d.total_copies) * 100) : 0;
    document.getElementById('availabilityFill').style.width = pct + '%';
    document.getElementById('availabilityPercent').textContent = pct + '% available';

    // Overdue badge
    const badge = document.getElementById('overdueBadge');
    if (badge) {
        if (d.overdue_count > 0) {
            badge.style.display = 'inline';
            badge.textContent = d.overdue_count;
        } else {
            badge.style.display = 'none';
        }
    }
}

async function loadActiveMemberStats() {
    const result = await api.getMemberStats();
    if (!result.ok) return;
    document.getElementById('ov-active-members').textContent = result.data.active_members;
}

async function loadRecentTransactions() {
    const result = await api.getTransactions({ page: 1, per_page: 5 });
    if (!result.ok) return;

    const body = document.getElementById('recentTransactionsBody');
    const { transactions } = result.data;

    if (!transactions.length) {
        body.innerHTML = '<tr><td colspan="5" class="empty-row">No recent transactions</td></tr>';
        return;
    }

    body.innerHTML = transactions.map(t => {
        const overdueDays = t.status !== 'Returned' ? daysOverdue(t.due_date) : 0;
        const status = overdueDays > 0 && t.status !== 'Returned' ? 'Overdue' : t.status;
        return `
        <tr>
            <td><code style="font-size:11px;color:var(--primary-light)">${escapeHtml(t.transaction_id)}</code></td>
            <td><strong style="font-size:13px">${escapeHtml(t.book_title)}</strong></td>
            <td style="font-size:13px">${escapeHtml(t.member_name)}</td>
            <td style="font-size:13px">${formatDate(t.due_date)}</td>
            <td>${statusBadge(status)}</td>
        </tr>
    `}).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function animateCount(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const start = 0;
    const duration = 800;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

async function initDashboard() {
    await Promise.all([
        loadDashboardStats(),
        loadActiveMemberStats(),
        loadRecentTransactions()
    ]);
}
