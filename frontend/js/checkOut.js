document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';
  const token = () => localStorage.getItem('vra_token');

  const visitorSearch = document.getElementById('visitorSearchCheckout');
  const visitorDatalist = document.getElementById('visitorsCheckout');
  const selectBtn = document.querySelector('.select-visitor-btn');
  const selectedBox = document.querySelector('.selected-visitor-info');
  const confirmBtn = document.getElementById('confirmCheckoutBtn') || document.querySelector('.confirm-checkout-btn');
  const departureInput = document.getElementById('departure-time');
  const notesInput = document.getElementById('notes');
  const cancelBtn = document.getElementById('cancelCheckoutBtn');

  let suggestions = [];
  let selectedVisitorLogId = null;
  const resultsContainer = document.getElementById('checkoutResults');

  async function loadSuggestions() {
    try {
      const t = token(); if (!t) return;
      const res = await fetch(`${API_BASE}/api/visitors/get-visitors`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) return;
      const data = await res.json();
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
      } else {
        console.warn('[checkOut.js] Unexpected response format:', data);
        list = [];
      }
      // filter only currently checked-in (no check_out_time)
      const checkedIn = list.filter(v => !v.check_out_time);
      suggestions = checkedIn;
      if (!visitorDatalist) return;
      visitorDatalist.innerHTML = '';
      // Populate datalist with readable values (name and phone in value)
      checkedIn.forEach(v => {
        const name = `${v.guest_firstname} ${v.guest_lastname}`.trim();
        const display = v.guest_phonenumber ? `${name} | ${v.guest_phonenumber}` : name;
        const opt = document.createElement('option');
        opt.value = display;
        visitorDatalist.appendChild(opt);
      });
      // hide any previous results
      hideResults();
    } catch (err) { console.warn('loadSuggestions', err); }
  }

  function renderResults(list) {
    if (!resultsContainer) return;
    resultsContainer.innerHTML = '';
    if (!list || list.length === 0) { resultsContainer.style.display = 'none'; return; }
    list.forEach(v => {
      const name = `${v.guest_firstname} ${v.guest_lastname}`.trim();
      const phone = v.guest_phonenumber || '-';
      const badge = v.badge_number || '-';
      const checkin = v.check_in_time ? new Date(v.check_in_time).toLocaleString() : '-';
      const item = document.createElement('div');
      item.className = 'result-item';
      item.style.padding = '8px';
      item.style.borderBottom = '1px solid #eee';
      item.style.cursor = 'pointer';
      item.innerHTML = `<strong>${name}</strong> <span style="color:#666">(${badge})</span><br><small style="color:#666">${phone} • ${checkin}</small>`;
      item.dataset.id = v.visitorLog_ID;
      item.addEventListener('click', (e) => {
        e.preventDefault();
        hideResults();
        visitorSearch.value = `${name} | ${phone}`;
        showSelected(v.visitorLog_ID);
      });
      resultsContainer.appendChild(item);
    });
    resultsContainer.style.display = 'block';
  }

  function hideResults() { if (resultsContainer) { resultsContainer.innerHTML = ''; resultsContainer.style.display = 'none'; } }

  async function showSelected(id) {
    selectedVisitorLogId = id;
    try {
      const t = token(); if (!t) return;
      const res = await fetch(`${API_BASE}/api/visitors/${id}`, { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) return alert('Failed to load visitor');
      const data = await res.json();
      // populate selected info
      if (selectedBox) {
        selectedBox.querySelector('.visitor-name').textContent = `${data.guest_firstname} ${data.guest_lastname}`;
        selectedBox.querySelector('.visitor-badge').textContent = `Badge: ${data.badge_number || '-'}`;
        selectedBox.querySelector('.visitor-phone').textContent = `Phone: ${data.guest_phonenumber || '-'}`;
        selectedBox.querySelector('.visitor-host').textContent = `Host: ${data.host_name || '-'}`;
        selectedBox.querySelector('.visitor-purpose').textContent = `Purpose: ${data.visit_purpose || '-'}`;
        selectedBox.querySelector('.visitor-checkin').innerHTML = `<i class="fa-regular fa-clock"></i> Checked In: ${data.check_in_time ? new Date(data.check_in_time).toLocaleString() : '-'}`;
      }
    } catch (err) { console.error('showSelected', err); }
  }

  // select button picks the entry from the input
  // When user clicks Select, try to resolve or show results for multiple matches
  selectBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const val = (visitorSearch?.value || '').trim();
    if (!val) return alert('Enter visitor name or phone');

    const exact = suggestions.find(v => {
      const name = `${v.guest_firstname} ${v.guest_lastname}`.trim();
      const display = v.guest_phonenumber ? `${name} | ${v.guest_phonenumber}` : name;
      return display.toLowerCase() === val.toLowerCase();
    });
    if (exact) return showSelected(exact.visitorLog_ID);

    const byPhone = suggestions.find(v => (v.guest_phonenumber || '').replace(/\s+/g, '') === val.replace(/\s+/g, ''));
    if (byPhone) return showSelected(byPhone.visitorLog_ID);

    const partials = suggestions.filter(v => {
      const name = `${v.guest_firstname} ${v.guest_lastname}`.trim().toLowerCase();
      return name.includes(val.toLowerCase());
    });
    if (partials.length === 1) return showSelected(partials[0].visitorLog_ID);
    if (partials.length > 1) { renderResults(partials); return; }

    alert('No matching visitor found — pick one of the suggestions');
  });

  // Live input: preview single match or show dropdown for multiple
  visitorSearch?.addEventListener('input', (e) => {
    const val = (visitorSearch?.value || '').trim();
    if (!val) { hideResults(); return; }
    const matches = suggestions.filter(v => {
      const name = `${v.guest_firstname} ${v.guest_lastname}`.trim().toLowerCase();
      const phone = (v.guest_phonenumber || '').replace(/\s+/g, '');
      return name.includes(val.toLowerCase()) || phone.includes(val.replace(/\s+/g, ''));
    });
    if (matches.length === 0) { hideResults(); return; }
    if (matches.length === 1) { hideResults(); showSelected(matches[0].visitorLog_ID); return; }
    // multiple matches -> show results dropdown
    renderResults(matches);
  });

  // Hide results when clicking outside
  document.addEventListener('click', (e) => {
    if (!resultsContainer) return;
    if (e.target === resultsContainer || resultsContainer.contains(e.target) || e.target === visitorSearch) return;
    hideResults();
  });

  // confirm checkout
  confirmBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!selectedVisitorLogId) return alert('Select a visitor first');
    try {
      const t = token(); if (!t) return alert('Not logged in');

      // use API that sets check_out_time to now
      const notes = notesInput ? notesInput.value.trim() : '';
      const res = await fetch(`${API_BASE}/api/visitors/checkout/${selectedVisitorLogId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (!res.ok) {
        const body = await res.text();
        return alert('Checkout failed: ' + (body || res.statusText));
      }
      alert('Checked out successfully');
      // clear UI
      visitorSearch.value = '';
      selectedVisitorLogId = null;
      selectedBox.querySelector('.visitor-name').textContent = 'No visitor selected';
      selectedBox.querySelector('.visitor-badge').textContent = 'Badge: -';
      selectedBox.querySelector('.visitor-phone').textContent = 'Phone: -';
      selectedBox.querySelector('.visitor-host').textContent = 'Host: -';
      selectedBox.querySelector('.visitor-purpose').textContent = 'Purpose: -';
      selectedBox.querySelector('.visitor-checkin').innerHTML = `<i class="fa-regular fa-clock"></i> Checked In: -`;
      if (notesInput) notesInput.value = '';
      loadSuggestions();
    } catch (err) { console.error('checkout error', err); alert('Checkout failed'); }
  });

  // Cancel selection/reset
  cancelBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    visitorSearch.value = '';
    selectedVisitorLogId = null;
    if (selectedBox) {
      selectedBox.querySelector('.visitor-name').textContent = 'No visitor selected';
      selectedBox.querySelector('.visitor-badge').textContent = 'Badge: -';
      selectedBox.querySelector('.visitor-phone').textContent = 'Phone: -';
      selectedBox.querySelector('.visitor-host').textContent = 'Host: -';
      selectedBox.querySelector('.visitor-purpose').textContent = 'Purpose: -';
      selectedBox.querySelector('.visitor-checkin').innerHTML = `<i class="fa-regular fa-clock"></i> Checked In: -`;
      if (notesInput) notesInput.value = '';
    }
  });

  // Set default departure time to now
  if (departureInput) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const val = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    departureInput.value = val;
  }

  // init
  loadSuggestions();
});
