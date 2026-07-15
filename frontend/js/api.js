/* ================================
   LibraryPro - API Service
   Handles all communication with Flask backend
   ================================ */

const API_BASE = 'http://127.0.0.1:5000/api';

const api = {
    // ── Auth ──
    async login(username, password) {
        return await request('POST', '/auth/login', { username, password });
    },
    async logout() {
        return await request('POST', '/auth/logout');
    },
    async checkAuth() {
        return await request('GET', '/auth/check');
    },
    async getMe() {
        return await request('GET', '/auth/me');
    },

    // ── Books ──
    async getBooks(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return await request('GET', `/books/?${qs}`);
    },
    async getBook(id) {
        return await request('GET', `/books/${id}`);
    },
    async createBook(data) {
        return await request('POST', '/books/', data);
    },
    async updateBook(id, data) {
        return await request('PUT', `/books/${id}`, data);
    },
    async deleteBook(id) {
        return await request('DELETE', `/books/${id}`);
    },
    async getGenres() {
        return await request('GET', '/books/genres');
    },
    async getBookStats() {
        return await request('GET', '/books/stats');
    },

    // ── Members ──
    async getMembers(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return await request('GET', `/members/?${qs}`);
    },
    async getMember(id) {
        return await request('GET', `/members/${id}`);
    },
    async createMember(data) {
        return await request('POST', '/members/', data);
    },
    async updateMember(id, data) {
        return await request('PUT', `/members/${id}`, data);
    },
    async deleteMember(id) {
        return await request('DELETE', `/members/${id}`);
    },
    async getMemberStats() {
        return await request('GET', '/members/stats');
    },

    // ── Transactions ──
    async getTransactions(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return await request('GET', `/transactions/?${qs}`);
    },
    async borrowBook(data) {
        return await request('POST', '/transactions/borrow', data);
    },
    async returnBook(transactionId) {
        return await request('PUT', `/transactions/return/${transactionId}`);
    },
    async getOverdue() {
        return await request('GET', '/transactions/overdue');
    },
    async getDashboardStats() {
        return await request('GET', '/transactions/dashboard');
    },
    async getTransactionStats() {
        return await request('GET', '/transactions/stats');
    }
};

async function request(method, path, body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const res = await fetch(`${API_BASE}${path}`, options);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return { ok: true, data, status: res.status };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}
