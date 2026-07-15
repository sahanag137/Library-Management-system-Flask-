/* ================================
   LibraryPro - Transactions Module
   ================================ */

let txnCurrentPage = 1;
let txnStatusFilter = '';

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadTransactions(page = 1) {
    txnCurrentPage = page;
    const body = document.getElementById('transactionsBody');
    body.innerHTML = '<tr><td colspan="9" class="loading-row">⏳ Loading transactions...</td></tr>';

    const result = await api.getTransactions({ page, per_page: 10, status: txnStatusFilter });
    if (!result.ok) {
        body.innerHTML = `<tr><td colspan="9" class="loading-row">❌ ${result.error}</td></tr>`;
        return;
    }

    const { transactions, pages } = result.data;
    if (!transactions.length) {
        body.innerHTML = '<tr><td colspan="9" class="empty-row">🔄 No transactions found</td></tr>';
        buildPagination('transactionsPagination', 1, 0, loadTransactions);
        return;
    }

    body.innerHTML = transactions.map(t => {
        const overdueDays = t.status === 'Active' || t.status === 'Overdue' ? daysOverdue(t.due_date) : 0;
        const actualStatus = overdueDays > 0 && t.status === 'Active' ? 'Overdue' : t.status;
        return `
        <tr>
            <td><code style="font-size:12px;color:var(--primary-light)">${escapeHtml(t.transaction_id)}</code></td>
            <td><strong>${escapeHtml(t.book_title)}</strong><div style="font-size:11px;color:var(--text-muted)">${escapeHtml(t.book_author)}</div></td>
            <td>
                <strong>${escapeHtml(t.member_name)}</strong>
                <div style="font-size:11px;color:var(--text-muted)">${escapeHtml(t.member_member_id)}</div>
            </td>
            <td>${formatDate(t.borrow_date)}</td>
            <td>${formatDate(t.due_date)}</td>
            <td>${t.return_date ? formatDate(t.return_date) : '<span style="color:var(--text-muted)">-</span>'}</td>
            <td>${t.fine_amount > 0 ? `<span style="color:var(--danger);font-weight:600">${formatCurrency(t.fine_amount)}</span>` : '-'}</td>
            <td>${statusBadge(actualStatus)}</td>
            <td>
                ${t.status !== 'Returned' ? `
                <button class="btn-icon success" title="Return Book" onclick="returnBook(${t.id}, '${escapeHtml(t.book_title)}')">↩️</button>
                ` : '<span style="color:var(--text-muted);font-size:12px">Returned</span>'}
            </td>
        </tr>
    `}).join('');

    buildPagination('transactionsPagination', page, pages, loadTransactions);
}

async function returnBook(transactionId, bookTitle) {
    document.getElementById('confirmMessage').textContent = `Confirm return of "${bookTitle}"?`;
    document.getElementById('confirmDeleteBtn').textContent = '↩️ Confirm Return';
    document.getElementById('confirmDeleteBtn').onclick = async () => {
        const result = await api.returnBook(transactionId);
        document.getElementById('confirmDeleteBtn').textContent = 'Delete';
        if (result.ok) {
            const fine = result.data.fine_amount;
            const msg = fine > 0 ? `Book returned! Fine: ${formatCurrency(fine)}` : 'Book returned successfully!';
            showToast(msg, fine > 0 ? 'warning' : 'success');
            closeModal('confirmModal');
            loadTransactions(txnCurrentPage);
            loadDashboardStats();
        } else {
            showToast(result.error, 'error');
            closeModal('confirmModal');
        }
    };
    openModal('confirmModal');
}

async function openBorrowModal() {
    // Load available books
    const booksResult = await api.getBooks({ per_page: 100 });
    const membersResult = await api.getMembers({ per_page: 100, status: 'Active' });

    const bookSelect = document.getElementById('borrowBookSelect');
    const memberSelect = document.getElementById('borrowMemberSelect');

    bookSelect.innerHTML = '<option value="">-- Select a book --</option>';
    memberSelect.innerHTML = '<option value="">-- Select a member --</option>';

    if (booksResult.ok) {
        booksResult.data.books
            .filter(b => b.available > 0)
            .forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.id;
                opt.textContent = `${b.title} by ${b.author} (${b.available} available)`;
                bookSelect.appendChild(opt);
            });
    }
    if (membersResult.ok) {
        membersResult.data.members.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = `${m.full_name} (${m.member_id})`;
            memberSelect.appendChild(opt);
        });
    }

    document.getElementById('borrowForm').reset();
    document.getElementById('borrowFormError').classList.add('hidden');
    openModal('borrowModal');
}

async function handleBorrowSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('borrowFormError');
    errorEl.classList.add('hidden');

    const book_id = parseInt(document.getElementById('borrowBookSelect').value);
    const member_id = parseInt(document.getElementById('borrowMemberSelect').value);
    const notes = document.getElementById('borrowNotes').value.trim();

    if (!book_id) { errorEl.textContent = 'Please select a book'; errorEl.classList.remove('hidden'); return; }
    if (!member_id) { errorEl.textContent = 'Please select a member'; errorEl.classList.remove('hidden'); return; }

    const result = await api.borrowBook({ book_id, member_id, notes });
    if (result.ok) {
        showToast('Book borrowed successfully!', 'success');
        closeModal('borrowModal');
        loadTransactions(1);
        loadDashboardStats();
    } else {
        errorEl.textContent = result.error;
        errorEl.classList.remove('hidden');
    }
}

async function loadOverdue() {
    const body = document.getElementById('overdueBody');
    body.innerHTML = '<tr><td colspan="7" class="loading-row">⏳ Checking overdue books...</td></tr>';

    const result = await api.getOverdue();
    if (!result.ok) {
        body.innerHTML = `<tr><td colspan="7" class="loading-row">❌ ${result.error}</td></tr>`;
        return;
    }

    const { overdue_transactions } = result.data;
    const badge = document.getElementById('overdueBadge');

    if (!overdue_transactions.length) {
        body.innerHTML = '<tr><td colspan="7" class="empty-row">✅ No overdue books!</td></tr>';
        if (badge) badge.style.display = 'none';
        return;
    }

    if (badge) {
        badge.style.display = 'inline';
        badge.textContent = overdue_transactions.length;
    }

    body.innerHTML = overdue_transactions.map(t => {
        const days = daysOverdue(t.due_date);
        const fine = days * 1.0;
        return `
        <tr>
            <td><code style="font-size:12px;color:var(--danger)">${escapeHtml(t.transaction_id)}</code></td>
            <td><strong>${escapeHtml(t.book_title)}</strong></td>
            <td>${escapeHtml(t.member_name)}<div style="font-size:11px;color:var(--text-muted)">${escapeHtml(t.member_member_id)}</div></td>
            <td><span style="color:var(--danger)">${formatDate(t.due_date)}</span></td>
            <td><span style="color:var(--danger);font-weight:700">${days} days</span></td>
            <td><span style="color:var(--warning);font-weight:600">${formatCurrency(fine)}</span></td>
            <td>
                <button class="btn-icon success" title="Return Book" onclick="returnBook(${t.id}, '${escapeHtml(t.book_title)}')">↩️ Return</button>
            </td>
        </tr>
    `}).join('');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('borrowBookBtn')?.addEventListener('click', openBorrowModal);
    document.getElementById('borrowForm')?.addEventListener('submit', handleBorrowSubmit);
    document.getElementById('refreshOverdueBtn')?.addEventListener('click', loadOverdue);

    const txnFilter = document.getElementById('txnStatusFilter');
    if (txnFilter) {
        txnFilter.addEventListener('change', () => {
            txnStatusFilter = txnFilter.value;
            loadTransactions(1);
        });
    }
});
