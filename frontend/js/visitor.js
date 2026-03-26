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

  let visitors = [];
  let page = 1;
  const pageSize = 10;
  let editMode = false;
  let editingId = null;

  function getToken() { return localStorage.getItem('vra_token'); }

  function renderTable(data) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const role = getRole();

    data.forEach(v => {
      const tr = document.createElement('tr');
      const fmt = (ts) => {
        if (!ts) return '';
        const d = new Date(ts);
        if (isNaN(d.getTime())) return ts;
        return d.toLocaleString();
      };

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

      tr.innerHTML = `
        <td>${v.guest_firstname} ${v.guest_lastname}${editedBadge}</td>
        <td><span class="badge-pill">${v.badge_number || '-'}</span></td>
        <td>${fmt(v.check_in_time) || ''}</td>
        <td>${fmt(v.check_out_time) || ''}</td>
        <td>${v.visit_purpose || ''}</td>
        <td>${v.host_name || ''}</td>
        <td class="action-icons">
          ${actions}
        </td>
      `;
      tableBody.appendChild(tr);
    });
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
      document.querySelector('.visitor-log-card').appendChild(paginationContainer);
    }

    paginationContainer.innerHTML = `
      <button id="prevPage" class="btn-secondary" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
      <span>Page ${currentPage} of ${totalPages}</span>
      <button id="nextPage" class="btn-secondary" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    `;

    document.getElementById('prevPage').onclick = () => {
      if (page > 1) { page--; fetchVisitors(); }
    };
    document.getElementById('nextPage').onclick = () => {
      if (page < totalPages) { page++; fetchVisitors(); }
    };
  }

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

  async function fetchVisitors(search = '') {
    // Start by checking if we are on a page with a visitor table
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
      // Build URL with search param if present
      let url = `${API_BASE}/api/visitors/get-visitors?page=${page}&limit=${pageSize}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

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
        // Fallback for non-paginated response
        console.warn('[Visitor.js] Received array response (backend might not be updated). Using client-side pagination.');
        visitors = data;
        renderTable(visitors.slice(0, pageSize)); // Show first page
        // Optional: Render simple pagination or just all
      } else {
        // Paginated response
        visitors = data.data || [];
        renderTable(visitors);
        renderPagination(data.total, data.page, data.pages);
      }
    } catch (err) {
      console.error('Error fetching visitors', err);
    }
  }

  // No host select: users will type the person visited into `host_name`.

  // Only attach global search if we are on the visitor page (tableBody exists)
  if (globalSearch && tableBody) {
    globalSearch.addEventListener('input', debounce((e) => {
      // Reset to page 1 for new searches
      page = 1;
      fetchVisitors(e.target.value);
    }, 500));

    // Allow immediate search on Enter
    globalSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        page = 1;
        fetchVisitors(e.target.value);
      }
    });
  }

  exportBtn?.addEventListener('click', () => {
    if (!visitors || visitors.length === 0) return showAppAlert('No logs to export');
    // build CSV
    const rows = [['Name', 'Check-in', 'Check-out', 'Purpose', 'Host']];
    visitors.forEach(v => rows.push([`${v.guest_firstname} ${v.guest_lastname}`, v.check_in_time || '', v.check_out_time || '', v.visit_purpose || '', v.host_name || '']));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'visitor_logs.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

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
        // populate form for viewing (readonly)
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

        // set inputs readonly
        if (visitorForm) {
          visitorForm.querySelectorAll('input, select, textarea').forEach(i => i.disabled = true);
          // hide submit
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

        // populate form for editing
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

        // enable inputs
        if (visitorForm) {
          visitorForm.querySelectorAll('input, select, textarea').forEach(i => i.disabled = false);
          // show submit
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

  // Initial load inside an async IIFE to handle token checks and data fetching properly.
  (async () => {
    const token = getToken();
    if (!tableBody) {
      // No visitor table on this page (e.g., dashboard); skip fetch/render but keep modal behavior.
      // Temporarily remove disabled to test modal
      // if (!token && openVisitorModalBtn) openVisitorModalBtn.disabled = true;
    } else {
      if (!token) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">You are not logged in. Please log in to view visitor logs.</td></tr>';
      } else {
        await fetchVisitors();
      }
    }

    // Always load hosts if token is present, as it\'s needed for the modal (which is on all pages)
    if (token) {
      await loadHosts();
    }
    // Ensure button is enabled for testing
    if (openVisitorModalBtn) {
      openVisitorModalBtn.disabled = false;
      console.log('[Visitor.js] Button disabled status after init:', openVisitorModalBtn.disabled);
    }
  })();

  // Modal open/close handlers
  openVisitorModalBtn?.addEventListener('click', (e) => {
    console.log('[Visitor.js] Open modal button clicked');
    console.log('[Visitor.js] openVisitorModalBtn:', openVisitorModalBtn);
    console.log('[Visitor.js] visitorModal inside handler:', visitorModal);
    console.log('[Visitor.js] visitorModal type:', typeof visitorModal);

    e.preventDefault();
    editMode = false; editingId = null;
    // enable inputs and show submit
    if (visitorForm) {
      visitorForm.querySelectorAll('input, select, textarea').forEach(i => i.disabled = false);
      const submitBtn = visitorForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.style.display = '';
    }
    if (visitorModal) {
      console.log('[Visitor.js] Setting modal display to flex');
      visitorModal.style.display = 'flex';
    } else {
      console.error('[Visitor.js] Modal element not found! visitorModal is:', visitorModal);
    }
    // prefill next badge number when opening modal
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
      console.log('[Visitor.js] Modal display set to none');
    }
    editMode = false; editingId = null;
    // ensure inputs enabled
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
    if (!token) return showAppshowToast('warning', 'You must be logged in to log a visitor');

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
        // send update
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
          return showAppAlert('Failed to log visitor: ' + (body || res.statusText));
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

  // Load hosts on init
  loadHosts();
});
