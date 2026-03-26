document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';
  const token = () => localStorage.getItem('vra_token');

  const tableBody = document.querySelector('.call-log-card tbody');
  const openModalBtn = document.getElementById('openCallLogModal');
  const modal = document.getElementById('callLogModal');
  const closeModalBtn = document.getElementById('closeCallLogModal');
  const form = document.getElementById('callLogForm');
  const hostsDatalist = document.getElementById('hosts');
  let hostsList = [];

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

  async function loadCalls(search = '') {
    try {
      const t = token();
      if (!t) return;

      const startDate = document.getElementById('start-date')?.value || '';
      const endDate = document.getElementById('end-date')?.value || '';
      const callType = document.getElementById('call-type')?.value || 'all';

      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (callType && callType !== 'all') params.append('callType', callType);

      const url = `${API_BASE}/calls/getall${params.toString() ? `?${params.toString()}` : ''}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (!res.ok) return;

      const list = await res.json();
      if (!tableBody) return;
      tableBody.innerHTML = '';

      if (!list.length) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No records found</td></tr>';
        return;
      }

      list.forEach(c => {
        const tr = document.createElement('tr');
        const time = c.call_time ? new Date(c.call_time).toLocaleString() : '';
        const duration = c.call_duration || '';
        const notes = c.purpose || '';
        const typeBadge =
          c.call_type === 'outgoing'
            ? '<span class="badge badge-outgoing">Outgoing</span>'
            : '<span class="badge badge-incoming">Incoming</span>';

        tr.innerHTML = `
          <td>${c.caller_firstname} ${c.caller_lastname}</td>
          <td>${time}</td>
          <td>${duration}</td>
          <td>${typeBadge}</td>
          <td>${notes}</td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error('loadCalls', err);
    }
  }



  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const callTypeSelect = document.getElementById('call-type');

  startDateInput?.addEventListener('change', () => {
    loadCalls(globalSearch?.value || '');
  });

  endDateInput?.addEventListener('change', () => {
    loadCalls(globalSearch?.value || '');
  });

  callTypeSelect?.addEventListener('change', () => {
    loadCalls(globalSearch?.value || '');
  });


  // Global Search Listener
  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('input', debounce((e) => {
      loadCalls(e.target.value);
    }, 500));

    // Allow immediate search on Enter
    globalSearch.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        loadCalls(e.target.value);
      }
    });
  }

  // Export calls as CSV
  async function exportCalls() {
    try {
      const t = token(); if (!t) return showCustomAlert('You must be logged in to export calls', 'info');
      const res = await fetch(`${API_BASE}/calls/getall`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) return alert('Failed to fetch calls for export');
      const list = await res.json();
      if (!list || list.length === 0) return showCustomAlert('No call records to export', 'info');

      // Build CSV header
      const headers = ['call_log_ID', 'caller_firstname', 'caller_lastname', 'call_time', 'call_duration', 'purpose', 'host_name', 'department'];
      const rows = list.map(r => {
        return headers.map(h => {
          const v = r[h] === null || typeof r[h] === 'undefined' ? '' : String(r[h]);
          // escape quotes
          return `"${v.replace(/"/g, '""')}"`;
        }).join(',');
      });

      const csv = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dt = new Date();
      const filename = `call_logs_${dt.toISOString().slice(0, 10)}.csv`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('exportCalls', err); showCustomAlert('Failed to export calls', 'error'); }
  }

  async function loadHosts() {
    try {
      const t = token(); if (!t) return;
      const res = await fetch(`${API_BASE}/hosts/get-all`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) return;
      const list = await res.json();
      hostsList = list || [];
      if (!hostsDatalist) return;
      hostsDatalist.innerHTML = '';
      // populate datalist with host names (friendly UX). We keep IDs in hostsList.
      list.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.host_name || '';
        hostsDatalist.appendChild(opt);
      });
    } catch (err) { console.warn('loadHosts', err); }
  }

  openModalBtn?.addEventListener('click', () => { if (modal) modal.style.display = 'flex'; });
  closeModalBtn?.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });
  window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const t = token(); if (!t) return showCustomAlert('You must be logged in to export calls', 'info');
      const caller_firstname = document.getElementById('caller_firstname')?.value?.trim();
      const caller_lastname = document.getElementById('caller_lastname')?.value?.trim();
      const call_duration = document.getElementById('call_duration')?.value?.trim() || null;
      const call_type = document.querySelector('input[name="call_type"]:checked')?.value || '';
      const host_val = document.getElementById('host_select')?.value || '';
      // Resolve host_ID:
      // 1) If user picked an item formatted as "Name :: id" (legacy), parse it.
      // 2) Otherwise, match against cached hostsList by exact name (case-insensitive).
      // 3) If no exact match, try a partial (contains) match. If multiple partial matches, ask user to be more specific.
      const contact = document.getElementById('contact')?.value?.trim() || null;
      let host_ID = null;
      let is_staff = 0;

      if (host_val) {
        const parts = host_val.split('::').map(p => p.trim());
        if (parts.length === 2 && parts[1]) {
          host_ID = parts[1];
          // Try to find in list to get is_staff
          const found = hostsList.find(h => h.host_ID == host_ID);
          if (found) is_staff = found.type === 'Staff' ? 1 : 0;
        }
        if (!host_ID && hostsList && hostsList.length > 0) {
          const exact = hostsList.find(h => (h.host_name || '').toLowerCase() === host_val.toLowerCase());
          if (exact) {
            host_ID = exact.host_ID;
            is_staff = exact.type === 'Staff' ? 1 : 0;
          } else {
            const partials = hostsList.filter(h => (h.host_name || '').toLowerCase().includes(host_val.toLowerCase()));
            if (partials.length === 1) {
              host_ID = partials[0].host_ID;
              is_staff = partials[0].type === 'Staff' ? 1 : 0;
            } else if (partials.length > 1) {
              return alert('Multiple hosts match that name — please select one of the suggestions to be specific');
            }
          }
        }
      }

      const purpose = document.getElementById('call_purpose')?.value?.trim() || call_type || '';

      if (!caller_firstname || !caller_lastname) return alert('Please enter caller first and last name');
      if (!purpose) return alert('Please select call type or enter a purpose');
      if (!contact) return alert('Please enter caller contact info');

      // If host_ID is not resolved, we can't proceed because backend requires ID and is_staff
      if (!host_ID) return alert('Please select a valid host');

      const payload = {
        host_ID: Number(host_ID),
        is_staff,
        caller_firstname,
        caller_lastname,
        call_duration,
        purpose,
        contact,
        call_type
      };
      const res = await fetch(`${API_BASE}/calls/add`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(payload) });
      const body = await res.json();
      if (!res.ok) return alert(body.message || 'Failed to log call');
      alert('Call logged');
      if (modal) modal.style.display = 'none';
      form.reset();
      loadCalls();
    } catch (err) { console.error('log call', err); alert('Failed to log call'); }
  });

  // init
  loadHosts();
  loadCalls();
  // attach export button
  const exportBtn = document.getElementById('exportCallsBtn');
  exportBtn?.addEventListener('click', exportCalls);
});
