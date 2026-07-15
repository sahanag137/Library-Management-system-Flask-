/* ================================
   LibraryPro - Books Module
   ================================ */

let booksCurrentPage = 1;
let booksSearch = '';
let booksGenre = '';

async function loadBooks(page = 1) {
    booksCurrentPage = page;
    const body = document.getElementById('booksBody');
    body.innerHTML = '<tr><td colspan="9" class="loading-row">⏳ Loading books...</td></tr>';

    const result = await api.getBooks({ page, per_page: 10, search: booksSearch, genre: booksGenre });
    if (!result.ok) {
        body.innerHTML = `<tr><td colspan="9" class="loading-row">❌ ${result.error}</td></tr>`;
        return;
    }

    const { books, total, pages } = result.data;
    if (!books.length) {
        body.innerHTML = '<tr><td colspan="9" class="empty-row">📚 No books found</td></tr>';
        buildPagination('booksPagination', 1, 0, loadBooks);
        return;
    }

    body.innerHTML = books.map(b => `
        <tr>
            <td><strong>#${b.id}</strong></td>
            <td>
                <strong>${escapeHtml(b.title)}</strong>
                ${b.description ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escapeHtml(b.description.substring(0, 60))}${b.description.length > 60 ? '...' : ''}</div>` : ''}
            </td>
            <td>${escapeHtml(b.author)}</td>
            <td><code style="font-size:11px;color:var(--primary-light)">${escapeHtml(b.isbn)}</code></td>
            <td>${b.genre ? `<span class="badge badge-standard">${escapeHtml(b.genre)}</span>` : '-'}</td>
            <td>${availabilityPill(b.available, b.quantity)}</td>
            <td>${b.quantity}</td>
            <td>${b.published_year || '-'}</td>
            <td>
                <div style="display:flex;gap:4px">
                    <button class="btn-icon" title="Edit" onclick="editBook(${b.id})">✏️</button>
                    <button class="btn-icon danger" title="Delete" onclick="deleteBook(${b.id}, '${escapeHtml(b.title)}')">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');

    buildPagination('booksPagination', page, pages, loadBooks);
}

async function loadGenres() {
    const result = await api.getGenres();
    if (!result.ok) return;
    const select = document.getElementById('genreFilter');
    result.data.genres.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g; opt.textContent = g;
        select.appendChild(opt);
    });
}

function openAddBookModal() {
    document.getElementById('bookModalTitle').textContent = '➕ Add New Book';
    document.getElementById('bookId').value = '';
    document.getElementById('bookForm').reset();
    document.getElementById('bookIsbn').removeAttribute('readonly');
    document.getElementById('bookFormError').classList.add('hidden');
    openModal('bookModal');
}

async function editBook(id) {
    const result = await api.getBook(id);
    if (!result.ok) { showToast('Failed to load book', 'error'); return; }
    const b = result.data.book;

    document.getElementById('bookModalTitle').textContent = '✏️ Edit Book';
    document.getElementById('bookId').value = b.id;
    document.getElementById('bookTitle').value = b.title;
    document.getElementById('bookAuthor').value = b.author;
    document.getElementById('bookIsbn').value = b.isbn;
    document.getElementById('bookIsbn').setAttribute('readonly', true);
    document.getElementById('bookGenre').value = b.genre || '';
    document.getElementById('bookQuantity').value = b.quantity;
    document.getElementById('bookYear').value = b.published_year || '';
    document.getElementById('bookDescription').value = b.description || '';
    document.getElementById('bookFormError').classList.add('hidden');
    openModal('bookModal');
}

async function deleteBook(id, title) {
    document.getElementById('confirmMessage').textContent = `Delete "${title}"? This cannot be undone.`;
    document.getElementById('confirmDeleteBtn').onclick = async () => {
        const result = await api.deleteBook(id);
        if (result.ok) {
            showToast('Book deleted', 'success');
            closeModal('confirmModal');
            loadBooks(booksCurrentPage);
        } else {
            showToast(result.error, 'error');
            closeModal('confirmModal');
        }
    };
    openModal('confirmModal');
}

async function handleBookSubmit(e) {
    e.preventDefault();
    const errorEl = document.getElementById('bookFormError');
    errorEl.classList.add('hidden');

    const id = document.getElementById('bookId').value;
    const data = {
        title: document.getElementById('bookTitle').value.trim(),
        author: document.getElementById('bookAuthor').value.trim(),
        isbn: document.getElementById('bookIsbn').value.trim(),
        genre: document.getElementById('bookGenre').value.trim(),
        quantity: parseInt(document.getElementById('bookQuantity').value) || 1,
        published_year: parseInt(document.getElementById('bookYear').value) || null,
        description: document.getElementById('bookDescription').value.trim()
    };

    const btn = document.getElementById('bookSubmitBtn');
    btn.disabled = true; btn.textContent = 'Saving...';

    const result = id ? await api.updateBook(id, data) : await api.createBook(data);
    btn.disabled = false; btn.textContent = 'Save Book';

    if (result.ok) {
        showToast(id ? 'Book updated!' : 'Book added!', 'success');
        closeModal('bookModal');
        loadBooks(booksCurrentPage);
        loadGenres(); // refresh genres
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
    document.getElementById('addBookBtn')?.addEventListener('click', openAddBookModal);
    document.getElementById('bookForm')?.addEventListener('submit', handleBookSubmit);

    const searchInput = document.getElementById('bookSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            booksSearch = searchInput.value.trim();
            loadBooks(1);
        }));
    }
    const genreFilter = document.getElementById('genreFilter');
    if (genreFilter) {
        genreFilter.addEventListener('change', () => {
            booksGenre = genreFilter.value;
            loadBooks(1);
        });
    }
});
