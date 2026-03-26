document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';
    const token = localStorage.getItem('vra_token');
    const tableBody = document.querySelector('.data-table tbody');
    const searchInput = document.getElementById('globalSearch');

    let allContacts = [];
    let page = 1;
    const pageSize = 10;
    let currentSearch = '';


    // Debounce utility
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Function to fetch contacts
    async function loadContacts(search = '') {
        if (!token) return;

        currentSearch = search;

        try {
            const params = new URLSearchParams({
                page,
                limit: pageSize
            });

            if (search.trim()) {
                params.append('search', search.trim());
            }

            const res = await fetch(`${API_BASE}/hosts/get-all?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Failed to fetch contacts');

            const data = await res.json();
            allContacts = data.data || [];
            renderContacts(allContacts);
            renderPagination(data.total, data.page, data.pages);
        } catch (err) {
            console.error('Error loading contacts:', err);
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Failed to load contacts</td></tr>';
        }
    }



    function renderPagination(total, currentPage, totalPages) {
        let paginationContainer = document.querySelector('.pagination-controls');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-controls';
            paginationContainer.style.display = 'flex';
            paginationContainer.style.justifyContent = 'center';
            paginationContainer.style.gap = '10px';
            paginationContainer.style.marginTop = '20px';
            document.querySelector('.card').appendChild(paginationContainer);
        }

        paginationContainer.innerHTML = `
            <button id="prevPage" class="btn-secondary" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
            <span>Page ${currentPage} of ${totalPages}</span>
            <button id="nextPage" class="btn-secondary" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
        `;

        document.getElementById('prevPage').onclick = () => {
            if (page > 1) { page--; loadContacts(currentSearch); }
        };
        document.getElementById('nextPage').onclick = () => {
            if (page < totalPages) { page++; loadContacts(currentSearch); }
        };
    }

    // Function to render table rows
    function renderContacts(contacts) {
        tableBody.innerHTML = '';

        if (contacts.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No contacts found</td></tr>';
            return;
        }

        contacts.forEach(contact => {
            const row = document.createElement('tr');

            const name = contact.host_name || '-';
            const dept = contact.department || '-';
            const avaya = contact.avaya_directory || '-';
            const phone = contact.host_phoneNumber || '-';

            row.innerHTML = `
        <td>${name}</td>
        <td>${dept}</td>
        <td>${avaya}</td>
        <td>${phone}</td>
      `;

            tableBody.appendChild(row);
        });
    }

    // Search functionality
    searchInput?.addEventListener('input', debounce((e) => {
        page = 1;
        currentSearch = e.target.value.trim();
        loadContacts(currentSearch);
    }, 500));

    // Allow immediate search on Enter
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            page = 1;
            loadContacts(e.target.value);
        }
    });

    // Initial load
    loadContacts();
});
