document.addEventListener('DOMContentLoaded', () => {
  console.log('[Visitor.js] DOM loaded, initializing...');
  const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';
  const tableBody = document.querySelector('.visitor-log-card tbody');
  const globalSearch = document.getElementById('globalSearch');
  const exportBtn = document.querySelector('.log-actions .btn-secondary');
  const openVisitorModalBtn = document.getElementById('openVisitorModal');
  const closeVisitorModalBtn = document.getElementById('closeVisitorModal');
  const visitorModal = document.getElementById('visitorModal');
  const visitorForm = document.getElementById('visitorForm');

  console.log('[Visitor.js] Elements found:', {
    openVisitorModalBtn: !!openVisitorModalBtn,
    closeVisitorModalBtn: !!closeVisitorModalBtn,
    visitorModal: !!visitorModal,
    visitorForm: !!visitorForm
  });

  function getRole() {
    return (localStorage.getItem('vra_role') || '').toLowerCase();
  }

  // Additional check for modal visibility
  if (visitorModal) {
    console.log('[Visitor.js] Modal initial display style:', visitorModal.style.display);
  }

  let allVisitors = []; // Store all visitors for client-side filtering
  let page = 1;
  const pageSize = 10;
  let editMode = false;
  let editingId = null;
  let currentSearchTerm = ''; // Store current search term
  let dateRangeStart = null;
  let dateRangeEnd = null;

  function getToken() { return localStorage.getItem('vra_token'); }

  // Helper function to format date for searching
  function formatDateForSearch(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString().toLowerCase();
  }

  // Helper function to format time for display
  function formatDateTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString();
  }

  // Enhanced search function - searches across ALL fields
  function searchVisitors(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      // No search term, return all visitors
      return [...allVisitors];
    }

    const term = searchTerm.toLowerCase().trim(); 
    
    return allVisitors.filter(visitor => {
      // Build searchable fields
      const visitorName = `${visitor.guest_firstname || ''} ${visitor.guest_lastname || ''}`.toLowerCase();
      const badgeNumber = (visitor.badge_number || '').toLowerCase();
      const checkInTime = formatDateForSearch(visitor.check_in_time);
      const checkOutTime = formatDateForSearch(visitor.check_out_time);
      const visitPurpose = (visitor.visit_purpose || '').toLowerCase();
      const hostName = (visitor.host_name || '').toLowerCase();
      
      // Search across all fields
      return (
        visitorName.includes(term) ||
        badgeNumber.includes(term) ||
        checkInTime.includes(term) ||
        checkOutTime.includes(term) ||
        visitPurpose.includes(term) ||
        hostName.includes(term)
      );
    });
  }

  // Apply date range filter
  function filterByDateRange(visitors) {
    if (!dateRangeStart && !dateRangeEnd) {
      return visitors;
    }
    
    return visitors.filter(visitor => {
      const checkInDate = new Date(visitor.check_in_time);
      if (dateRangeStart && checkInDate < dateRangeStart) return false;
      if (dateRangeEnd && checkInDate > dateRangeEnd) return false;
      return true;
    });
  }

  // Update the table with all filters applied
  function updateTableWithFilters() {
    // First apply search filter
    let filteredVisitors = searchVisitors(currentSearchTerm);
    // Then apply date range filter
    filteredVisitors = filterByDateRange(filteredVisitors);
    
    // Update pagination based on filtered results
    const totalFiltered = filteredVisitors.length;
    const totalPages = Math.ceil(totalFiltered / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedVisitors = filteredVisitors.slice(startIndex, endIndex);
    
    renderTable(paginatedVisitors);
    renderPagination(totalFiltered, page, totalPages);
    
    // Update search results counter
    updateSearchResultsCount(totalFiltered, allVisitors.length);
  }

  // Update search results counter
  function updateSearchResultsCount(filteredCount, totalCount) {
    const counterElement = document.getElementById('searchResultsCount');
    if (counterElement) {
      if (currentSearchTerm && currentSearchTerm.trim() !== '') {
        if (dateRangeStart || dateRangeEnd) {
          counterElement.textContent = `Showing ${filteredCount} of ${totalCount} visitors (search: "${currentSearchTerm}" + date filter)`;
        } else {
          counterElement.textContent = `Showing ${filteredCount} of ${totalCount} visitors (search: "${currentSearchTerm}")`;
        }
      } else if (dateRangeStart || dateRangeEnd) {
        counterElement.textContent = `Showing ${filteredCount} of ${totalCount} visitors (date filtered)`;
      } else {
        counterElement.textContent = `Total: ${totalCount} visitors`;
      }
    }
  }

  function renderTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const role = getRole();

    if (!data || data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 40px;">
            <i class="fa-solid fa-search" style="font-size: 48px; color: #ccc;"></i>
            <p style="margin-top: 10px; color: #666;">
              ${currentSearchTerm ? 'No visitors match your search.' : 'No visitors found.'}
            </p>
          </td>
        </tr>
      `;
      return;
    }

    data.forEach(v => {
      const tr = document.createElement('tr');
      
      const editedBadge = v.is_edited
        ? `<span class="badge-pill" style="margin-left:8px;">Edited</span>`
        : '';

      let actions = `
        <a href="#" data-id="${v.visitorLog_ID}" class="view" title="View"><i class="fa-solid fa-eye"></i></a>
        <a href="#" data-id="${v.visitorLog_ID}" class="edit" title="Edit"><i class="fa-solid fa-pencil"></i></a>
      `;

      if (role === 'admin') {
        actions += `
          <a href="#" data-id="${v.visitorLog_ID}" class="delete" title="Delete"><i class="fa-solid fa-trash-can"></i></a>
        `;
      }

      const checkOutDisplay = v.check_out_time 
        ? formatDateTime(v.check_out_time)
        : '<span class="badge badge-warning" style="background-color: #f39c12; color: white; padding: 4px 8px; border-radius: 4px;">Active</span>';

      tr.innerHTML = `
        <td><strong>${v.guest_firstname} ${v.guest_lastname}</strong>${editedBadge}</td>
        <td><span class="badge-pill" style="background-color: #3498db; color: white; padding: 4px 8px; border-radius: 4px;">${v.badge_number || '-'}</span></td>
        <td>${formatDateTime(v.check_in_time) || '-'}</td>
        <td>${checkOutDisplay}</td>
        <td>${v.visit_purpose || '-'}</td>
        <td>${v.host_name || '-'}</td>
        <td class="action-icons">
          ${actions}
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function renderPagination(totalItems, currentPage, totalPages) {
    let paginationContainer = document.querySelector('.pagination-controls');
    if (!paginationContainer) {
      paginationContainer = document.createElement('div');
      paginationContainer.className = 'pagination-controls';
      paginationContainer.style.display = 'flex';
      paginationContainer.style.justifyContent = 'center';
      paginationContainer.style.alignItems = 'center';
      paginationContainer.style.gap = '10px';
      paginationContainer.style.marginTop = '20px';
      paginationContainer.style.padding = '10px';
      document.querySelector('.visitor-log-card').appendChild(paginationContainer);
    }

    paginationContainer.innerHTML = `
      <button id="prevPage" class="btn-secondary" ${currentPage === 1 ? 'disabled' : ''} style="padding: 8px 16px; cursor: pointer;">← Previous</button>
      <span style="margin: 0 15px;">Page ${currentPage} of ${totalPages} (${totalItems} items)</span>
      <button id="nextPage" class="btn-secondary" ${currentPage === totalPages ? 'disabled' : ''} style="padding: 8px 16px; cursor: pointer;">Next →</button>
    `;

    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (page > 1) { 
          page--; 
          updateTableWithFilters();
        }
      };
    }
    
    if (nextBtn) {
      nextBtn.onclick = () => {
        const filteredCount = filterByDateRange(searchVisitors(currentSearchTerm)).length;
        const maxPage = Math.ceil(filteredCount / pageSize);
        if (page < maxPage) { 
          page++; 
          updateTableWithFilters();
        }
      };
    }
  }

  // Debounce utility for search
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

  // Initialize date range picker
  function initDateRangePicker() {
    const dateInput = document.getElementById('date-range-picker');
    if (dateInput && typeof flatpickr !== 'undefined') {
      flatpickr(dateInput, {
        mode: "range",
        dateFormat: "Y-m-d",
        onChange: function(selectedDates) {
          if (selectedDates.length === 2) {
            dateRangeStart = selectedDates[0];
            dateRangeEnd = selectedDates[1];
            // Reset to page 1 when applying date filter
            page = 1;
            updateTableWithFilters();
          } else if (selectedDates.length === 0) {
            dateRangeStart = null;
            dateRangeEnd = null;
            page = 1;
            updateTableWithFilters();
          }
        }
      });
    }
  }

  async function fetchVisitors() {
    if (!tableBody) {
      console.log('[Visitor.js] No visitor table found, skipping fetch.');
      return;
    }

    const token = getToken();
    if (!token) {
      console.warn('No token present; visitor fetch skipped');
      return;
    }

    try {
      // Fetch all visitors for client-side filtering
      const url = `${API_BASE}/api/visitors/get-visitors?page=1&limit=1000`;
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        console.error('Failed to fetch visitors', await res.text());
        return;
      }
      const data = await res.json();
      console.log('[Visitor.js] Fetch response:', data);

      if (Array.isArray(data)) {
        allVisitors = data;
      } else {
        allVisitors = data.data || [];
      }
      
      // Reset filters and apply
      currentSearchTerm = '';
      dateRangeStart = null;
      dateRangeEnd = null;
      page = 1;
      
      // Clear search input
      if (globalSearch) {
        globalSearch.value = '';
      }
      
      updateTableWithFilters();
      
    } catch (err) {
      console.error('Error fetching visitors', err);
    }
  }

  // Initialize search functionality
  function initSearch() {
    if (globalSearch && tableBody) {
      // Update placeholder text to reflect multi-field search
      globalSearch.placeholder = "Search by name, badge, time, purpose, host...";
      
      globalSearch.addEventListener('input', debounce((e) => {
        // Reset to page 1 for new searches
        page = 1;
        currentSearchTerm = e.target.value;
        updateTableWithFilters();
      }, 400));
    }
  }

  // Export functionality
  exportBtn?.addEventListener('click', () => {
    // Get filtered data for export
    let dataToExport = searchVisitors(currentSearchTerm);
    dataToExport = filterByDateRange(dataToExport);
    
    if (!dataToExport || dataToExport.length === 0) {
      alert('No logs to export');
      return;
    }
    
    // Build CSV with all fields
    const rows = [
      ['Visitor Name', 'Badge Number', 'Check-in Time', 'Check-out Time', 'Purpose', 'Host', 'Phone Number']
    ];
    
    dataToExport.forEach(v => {
      rows.push([
        `${v.guest_firstname} ${v.guest_lastname}`,
        v.badge_number || '',
        formatDateTime(v.check_in_time) || '',
        formatDateTime(v.check_out_time) || '',
        v.visit_purpose || '',
        v.host_name || '',
        v.guest_phonenumber || ''
      ]);
    });
    
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor_logs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // All your existing event listeners (view, edit, delete) remain unchanged
  tableBody?.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete');
    const viewBtn = e.target.closest('.view');
    const editBtn = e.target.closest('.edit');

    if (viewBtn) {
      e.preventDefault();
      const id = viewBtn.dataset.id;
      const token = getToken();
      if (!token) return alert('You must be logged in');
      try {
        const res = await fetch(`${API_BASE}/api/visitors/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return alert('Failed to load visitor');
        const data = await res.json();
        document.getElementById('guest_firstname').value = data.guest_firstname || '';
        document.getElementById('guest_lastname').value = data.guest_lastname || '';
        document.getElementById('guest_phonenumber').value = data.guest_phonenumber || '';
        document.getElementById('host_name').value = data.host_name || '';
        document.getElementById('visit_purpose').value = data.visit_purpose || '';
        const b = document.getElementById('badge_number'); if (b) b.value = data.badge_number || '';

        const atInput = document.getElementById('arrival_time');
        if (atInput) {
          if (data.check_in_time) {
            const d = new Date(data.check_in_time);
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            atInput.value = `${hours}:${minutes}`;
          } else {
            atInput.value = '';
          }
        }

        if (visitorForm) {
          visitorForm.querySelectorAll('input, select, textarea').forEach(i => i.disabled = true);
          const submit = visitorForm.querySelector('button[type="submit"]');
          if (submit) submit.style.display = 'none';
        }
        if (visitorModal) visitorModal.style.display = 'flex';
      } catch (err) { console.error(err); alert('Failed to load visitor'); }
      return;
    }

    if (editBtn) {
      e.preventDefault();
      const id = editBtn.dataset.id;
      const token = getToken();
      if (!token) return alert('You must be logged in');
      try {
        const res = await fetch(`${API_BASE}/api/visitors/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return alert('Failed to load visitor');
        const data = await res.json();
        await loadHosts();

        document.getElementById('guest_firstname').value = data.guest_firstname || '';
        document.getElementById('guest_lastname').value = data.guest_lastname || '';
        document.getElementById('guest_phonenumber').value = data.guest_phonenumber || '';
        document.getElementById('host_name').value = data.host_name || '';
        document.getElementById('visit_purpose').value = data.visit_purpose || '';
        const b = document.getElementById('badge_number'); if (b) b.value = data.badge_number || '';

        const atInput = document.getElementById('arrival_time');
        if (atInput) {
          if (data.check_in_time) {
            const d = new Date(data.check_in_time);
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            atInput.value = `${hours}:${minutes}`;
          } else {
            atInput.value = '';
          }
        }

        if (visitorForm) {
          visitorForm.querySelectorAll('input, select, textarea').forEach(i => i.disabled = false);
          const submit = visitorForm.querySelector('button[type="submit"]');
          if (submit) submit.style.display = '';
        }
        editMode = true; editingId = id;
        if (visitorModal) visitorModal.style.display = 'flex';
      } catch (err) { console.error(err); alert('Failed to load visitor'); }
      return;
    }
    
    if (deleteBtn) {
      e.preventDefault();

      const role = getRole();
      if (role !== 'admin') {
        return alert('Only admins can delete visitor logs.');
      }

      const id = deleteBtn.dataset.id;
      if (!confirm('Delete this visitor log?')) return;
      const token = getToken();

      try {
        const res = await fetch(`${API_BASE}/api/visitors/delete/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return alert('Delete failed');
        alert('Deleted');
        fetchVisitors();
      } catch (err) {
        console.error(err);
        alert('Delete failed');
      }
    }
  });

  // Initial load
  (async () => {
    const token = getToken();
    if (!tableBody) {
      // No visitor table on this page
    } else {
      if (!token) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">You are not logged in. Please log in to view visitor logs.</td></tr>';
      } else {
        await fetchVisitors();
        initSearch();
        initDateRangePicker();
      }
    }

    if (token) {
      await loadHosts();
    }
    
    if (openVisitorModalBtn) {
      openVisitorModalBtn.disabled = false;
      console.log('[Visitor.js] Button disabled status after init:', openVisitorModalBtn.disabled);
    }
  })();

  // Modal open/close handlers
  openVisitorModalBtn?.addEventListener('click', (e) => {
    console.log('[Visitor.js] Open modal button clicked');
    e.preventDefault();
    editMode = false; editingId = null;
    if (visitorForm) {
      visitorForm.querySelectorAll('input, select, textarea').forEach(i => i.disabled = false);
      const submitBtn = visitorForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.style.display = '';
    }
    if (visitorModal) {
      visitorModal.style.display = 'flex';
    }
    (async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/visitors/next-badge`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        const b = document.getElementById('badge_number');
        if (b && data && data.badge_number) b.value = data.badge_number;
      } catch (err) {
        console.warn('Failed to prefill badge', err);
      }
    })();
  });
  
  closeVisitorModalBtn?.addEventListener('click', (e) => {
    console.log('[Visitor.js] Close modal button clicked');
    e.preventDefault();
    if (visitorModal) {
      visitorModal.style.display = 'none';
    }
    editMode = false; editingId = null;
    if (visitorForm) {
      visitorForm.querySelectorAll('input, select, textarea').forEach(i => i.disabled = false);
      const submitBtn2 = visitorForm.querySelector('button[type="submit"]');
      if (submitBtn2) submitBtn2.style.display = '';
    }
  });

  let hostsList = [];
  const hostsDatalist = document.getElementById('hosts');

  async function loadHosts() {
    try {
      const token = getToken(); if (!token) return;
      const res = await fetch(`${API_BASE}/hosts/get-all`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      console.log('[Visitor.js] loadHosts response:', data);

      if (Array.isArray(data)) {
        hostsList = data;
      } else if (data.data && Array.isArray(data.data)) {
        hostsList = data.data;
      } else {
        hostsList = [];
        console.warn('[Visitor.js] Unexpected hosts response format:', data);
      }

      const hostField = document.getElementById('host_name');

      if (hostField && hostField.tagName === 'SELECT') {
        hostField.innerHTML = '<option value="">Select person visited</option>';
        hostsList.forEach(h => {
          const opt = document.createElement('option');
          opt.value = h.host_name || '';
          opt.textContent = h.host_name || '';
          hostField.appendChild(opt);
        });
      } else if (hostsDatalist) {
        hostsDatalist.innerHTML = '';
        hostsList.forEach(h => {
          const opt = document.createElement('option');
          opt.value = h.host_name || '';
          hostsDatalist.appendChild(opt);
        });
      }
    } catch (err) { console.warn('loadHosts', err); }
  }

  // Submit new visitor
  visitorForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return showAppToast('warning', 'You must be logged in to log a visitor');

    const host_name_val = document.getElementById('host_name')?.value?.trim();
    let host_ID = null;
    let is_staff = 0;

    console.log('[Visitor.js] Validating host:', host_name_val);
    console.log('[Visitor.js] Available hosts:', hostsList);

    if (host_name_val && hostsList.length > 0) {
      const exact = hostsList.find(h => (h.host_name || '').toLowerCase() === host_name_val.toLowerCase());
      if (exact) {
        host_ID = exact.host_ID;
        is_staff = exact.host_type === 'Staff' ? 1 : 0;
        console.log('[Visitor.js] Exact host match found:', exact);
      } else {
        const partial = hostsList.find(h => (h.host_name || '').toLowerCase().includes(host_name_val.toLowerCase()));
        if (partial) {
          host_ID = partial.host_ID;
          is_staff = partial.host_type === 'Staff' ? 1 : 0;
          console.log('[Visitor.js] Partial host match found:', partial);
        }
      }
    }

    if (!host_ID) {
      console.error('[Visitor.js] Host validation failed. Name:', host_name_val, 'Hosts loaded:', hostsList.length);
      return showAppToast('warning', 'Please select a valid host from the list');
    }

    const payload = {
      guest_firstname: document.getElementById('guest_firstname')?.value?.trim(),
      guest_lastname: document.getElementById('guest_lastname')?.value?.trim(),
      guest_phonenumber: document.getElementById('guest_phonenumber')?.value?.trim() || null,
      host_ID: host_ID,
      is_staff: is_staff,
      visit_purpose: document.getElementById('visit_purpose')?.value?.trim() || null,
    };

    if (payload.guest_phonenumber && !/^\d{10}$/.test(payload.guest_phonenumber)) {
      return showAppToast('warning', 'Phone number must be exactly 10 digits');
    }

    if (!payload.guest_firstname || !payload.guest_lastname || !payload.host_ID || !payload.visit_purpose) {
      return showAppToast('warning', 'Please fill the required fields (firstname, lastname, person visited, purpose)');
    }

    try {
      if (editMode && editingId) {
        const res = await fetch(`${API_BASE}/api/visitors/${editingId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const body = await res.text();
          console.error('Failed to update visitor', body);
          return showAppToast('error', 'Failed to update visitor: ' + (body || res.statusText));
        }
        showAppToast('success', 'Visitor updated');
        editMode = false; editingId = null;
      } else {
        const res = await fetch(`${API_BASE}/api/visitors/new-visitor`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const body = await res.text();
          console.error('Failed to create visitor', body);
          return showAppToast('error', 'Failed to log visitor: ' + (body || res.statusText));
        }
        const body = await res.json();
        showAppToast('success', body.message || 'Visitor logged');
      }

      if (visitorModal) visitorModal.style.display = 'none';
      visitorForm.reset();
      fetchVisitors();
    } catch (err) {
      console.error('Error creating/updating visitor', err);
      showAppToast('error', 'Error creating/updating visitor');
    }
  });

  loadHosts();
});