/* ================================
   LibraryPro - Members Module
   ================================ */

let membersCurrentPage = 1;
let membersSearch = '';
let membersStatus = '';

async function loadMembers(page = 1) {
    membersCurrentPage = page;
    const body = document.getElementById('membersBody');
    body.innerHTML = '<tr><td colspan="8" class="loading-row">⏳ Loading members...</td></tr>';

    const result = await api.getMembers({ page, per_page: 10, search: membersSearch, status: membersStatus });
    if (!result.ok) {
        body.innerHTML = `<tr><td colspan="8" class="loading-row">❌ ${result.error}</td></tr>`;
        return;
    }

    const { members, pages } = result.data;
    if (!members.length) {
        body.innerHTML = '<tr><td colspan="8" class="empty-row">👥 No members found</td></tr>';
        buildPagination('membersPagination', 1, 0, loadMembers);
        return;
    }

    body.innerHTML = members.map(m => `
        <tr>
            <td><code style="color:var(--primary-light);font-size:12px">${escapeHtml(m.member_id)}</code></td>
            <td><strong>${escapeHtml(m.full_name)}</strong></td>
            <td><a href="mailto:${escapeHtml(m.email)}" style="color:var(--primary-light)">${escapeHtml(m.email)}</a></td>
            <td>${m.phone || '-'}</td>
            <td>${statusBadge(m.membership_type)}</td>
            <td><strong style="color:${m.books_borrowed > 0 ? 'var(--warning)' : 'var(--success)'}">${m.books_borrowed}</strong></td>
            <td>${statusBadge(m.status)}</td>
            <td>
                <div style="display:flex;gap:4px">
                    <button class="btn-icon" title="Edit" onclick="editMember(${m.id})">✏️</button>
                    <button class="btn-icon danger" title="Delete" onclick="deleteMember(${m.id}, '${escapeHtml(m.full_name)}')">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');

    buildPagination('membersPagination', page, pages, loadMembers);
}

function openAddMemberModal() {
    document.getElementById('memberModalTitle').textContent = '➕ Add New Member';
    document.getElementById('memberId').value = '';
    document.getElementById('memberForm').reset();
    document.getElementById('memberStatusGroup').style.display = 'none';
    document.getElementById('memberFormError').classList.add('hidden');
    openModal('memberModal');
}

async function editMember(id) {
    const result = await api.getMember(id);
    if (!result.ok) { showToast('Failed to load member', 'error'); return; }
    const m = result.data.member;

    document.getElementById('memberModalTitle').textContent = '✏️ Edit Member';
    document.getElementById('memberId').value = m.id;
    document.getElementById('memberName').value = m.full_name;
    document.getElementById('memberEmail').value = m.email;
    document.getElementById('memberPhone').value = m.phone || '';
    document.getElementById('memberType').value = m.membership_type;
    document.getElementById('memberAddress').value = m.address || '';
    document.getElementById('memberStatus').value = m.status;
    document.getElementById('memberStatusGroup').style.display = 'block';
    document.getElementById('memberFormError').classList.add('hidden');
    openModal('memberModal');
}

async function deleteMember(id, name) {
    document.getElementById('confirmMessage').textContent = `Delete member "${name}"? This cannot be undone.`;
    document.getElementById('confirmDeleteBtn').onclick = async () => {
        const result = await api.deleteMember(id);
        if (result.ok) {
            showToast('Member deleted', 'success');
            closeModal('confirmModal');
            loadMembers(membersCurrentPage);
        } else {
            showToast(result.error, 'error');
            closeModal('confirmModal');
        }
    };
    openModal('confirmModal');
}

async function handleMemberSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('memberFormError');
    errorEl.classList.add('hidden');

    const id = document.getElementById('memberId').value;
    const data = {
        full_name: document.getElementById('memberName').value.trim(),
        email: document.getElementById('memberEmail').value.trim(),
        phone: document.getElementById('memberPhone').value.trim(),
        membership_type: document.getElementById('memberType').value,
        address: document.getElementById('memberAddress').value.trim(),
    };
    if (id) data.status = document.getElementById('memberStatus').value;

    const btn = document.getElementById('memberSubmitBtn');
    btn.disabled = true; btn.textContent = 'Saving...';

    const result = id ? await api.updateMember(id, data) : await api.createMember(data);
    btn.disabled = false; btn.textContent = 'Save Member';

    if (result.ok) {
        showToast(id ? 'Member updated!' : 'Member added!', 'success');
        closeModal('memberModal');
        loadMembers(membersCurrentPage);
    } else {
        errorEl.textContent = result.error;
        errorEl.classList.remove('hidden');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addMemberBtn')?.addEventListener('click', openAddMemberModal);
    document.getElementById('memberForm')?.addEventListener('submit', handleMemberSubmit);

    const searchInput = document.getElementById('memberSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            membersSearch = searchInput.value.trim();
            loadMembers(1);
        }));
    }
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            membersStatus = statusFilter.value;
            loadMembers(1);
        });
    }
});
