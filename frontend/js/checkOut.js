document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';
  const token = () => localStorage.getItem('vra_token');

  const visitorSearch = document.getElementById('visitorSearchCheckout');
  const selectBtn = document.querySelector('.select-visitor-btn');
  const selectedBox = document.querySelector('.selected-visitor-info');
  const confirmBtn = document.getElementById('confirmCheckoutBtn') || document.querySelector('.confirm-checkout-btn');
  const departureInput = document.getElementById('departure-time');
  const notesInput = document.getElementById('notes');
  const cancelBtn = document.getElementById('cancelCheckoutBtn');

  let suggestions = [];
  let selectedVisitorLogId = null;

  // Create dropdown container
  let dropdownContainer = document.getElementById('visitorDropdown');
  if (!dropdownContainer) {
    dropdownContainer = document.createElement('div');
    dropdownContainer.id = 'visitorDropdown';
    dropdownContainer.className = 'visitor-autocomplete-dropdown';
    dropdownContainer.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-height: 320px;
      overflow-y: auto;
      z-index: 1000;
      display: none;
      width: 100%;
      min-width: 300px;
    `;
    const searchWrapper = document.querySelector('.search-bar');
    if (searchWrapper) {
      searchWrapper.style.position = 'relative';
      searchWrapper.appendChild(dropdownContainer);
    }
  }

  async function loadSuggestions() {
    try {
      const t = token(); 
      if (!t) return;
      
      const res = await fetch(`${API_BASE}/api/visitors/get-visitors?page=1&limit=1000`, { 
        headers: { Authorization: `Bearer ${t}` } 
      });
      
      if (!res.ok) return;
      
      const data = await res.json();
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (data.data && Array.isArray(data.data)) {
        list = data.data;
      }
      
      // Filter only checked-in visitors (no check_out_time)
      suggestions = list.filter(v => !v.check_out_time);
      
      // Sort by check-in time (most recent first)
      suggestions.sort((a, b) => new Date(b.check_in_time) - new Date(a.check_in_time));
      
    } catch (err) { 
      console.warn('loadSuggestions', err); 
    }
  }

  // Helper to format "time ago" for check-in times
  function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  // Render dropdown with visitor results
  function renderDropdown(results) {
    if (!dropdownContainer) return;
    
    dropdownContainer.innerHTML = '';
    
    if (!results || results.length === 0) {
      dropdownContainer.style.display = 'none';
      return;
    }
    
    results.forEach(visitor => {
      const fullName = `${visitor.guest_firstname || ''} ${visitor.guest_lastname || ''}`.trim();
      const badge = visitor.badge_number || 'No badge';
      const phone = visitor.guest_phonenumber || 'No phone';
      const host = visitor.host_name || 'Unknown';
      const purpose = visitor.visit_purpose || 'No purpose';
      const timeAgo = formatTimeAgo(visitor.check_in_time);
      const checkInTime = visitor.check_in_time ? new Date(visitor.check_in_time).toLocaleString() : 'Unknown';
      
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.style.cssText = `
        padding: 12px 15px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.2s;
      `;
      
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            <strong style="font-size: 16px; color: #2c3e50;">${escapeHtml(fullName)}</strong>
            <span style="display: inline-block; background: #3498db; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-left: 8px;">${escapeHtml(badge)}</span>
          </div>
          <span style="font-size: 11px; color: #27ae60;">Checked in ${timeAgo}</span>
        </div>
        <div style="display: flex; gap: 15px; margin-top: 6px; font-size: 12px; color: #7f8c8d;">
          <span><i class="fa-solid fa-phone"></i> ${escapeHtml(phone)}</span>
          <span><i class="fa-solid fa-user"></i> Host: ${escapeHtml(host)}</span>
        </div>
        <div style="margin-top: 4px; font-size: 12px; color: #7f8c8d;">
          <i class="fa-solid fa-clipboard"></i> ${escapeHtml(purpose)}
        </div>
        <div style="margin-top: 4px; font-size: 11px; color: #95a5a6;">
          <i class="fa-regular fa-clock"></i> Checked in: ${checkInTime}
        </div>
      `;
      
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideDropdown();
        showSelected(visitor.visitorLog_ID);
        visitorSearch.value = fullName;
      });
      
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f8f9fa';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.background = '';
      });
      
      dropdownContainer.appendChild(item);
    });
    
    dropdownContainer.style.display = 'block';
  }

  // Hide dropdown
  function hideDropdown() {
    if (dropdownContainer) {
      dropdownContainer.style.display = 'none';
    }
  }

  // Filter suggestions based on search term and show dropdown
  function filterAndShowDropdown(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      hideDropdown();
      return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const matches = suggestions.filter(visitor => {
      const fullName = `${visitor.guest_firstname || ''} ${visitor.guest_lastname || ''}`.toLowerCase();
      const phone = (visitor.guest_phonenumber || '').toLowerCase();
      const badge = (visitor.badge_number || '').toLowerCase();
      const host = (visitor.host_name || '').toLowerCase();
      const purpose = (visitor.visit_purpose || '').toLowerCase();
      
      return fullName.includes(term) || 
             phone.includes(term) || 
             badge.includes(term) || 
             host.includes(term) ||
             purpose.includes(term);
    });
    
    if (matches.length > 0) {
      renderDropdown(matches);
    } else {
      hideDropdown();
    }
  }

  // Show selected visitor details in the UI
  async function showSelected(id) {
    selectedVisitorLogId = id;
    try {
      const t = token(); 
      if (!t) return;
      
      const res = await fetch(`${API_BASE}/api/visitors/${id}`, { 
        headers: { Authorization: `Bearer ${t}` } 
      });
      
      if (!res.ok) return alert('Failed to load visitor');
      
      const data = await res.json();
      
      if (selectedBox) {
        selectedBox.querySelector('.visitor-name').textContent = `${data.guest_firstname} ${data.guest_lastname}`;
        selectedBox.querySelector('.visitor-badge').textContent = `Badge: ${data.badge_number || '-'}`;
        selectedBox.querySelector('.visitor-phone').textContent = `Phone: ${data.guest_phonenumber || '-'}`;
        selectedBox.querySelector('.visitor-host').textContent = `Host: ${data.host_name || '-'}`;
        selectedBox.querySelector('.visitor-purpose').textContent = `Purpose: ${data.visit_purpose || '-'}`;
        selectedBox.querySelector('.visitor-checkin').innerHTML = `<i class="fa-regular fa-clock"></i> Checked In: ${data.check_in_time ? new Date(data.check_in_time).toLocaleString() : '-'}`;
        
        // Add highlight effect
        selectedBox.style.transition = 'all 0.3s';
        selectedBox.style.backgroundColor = '#e8f4ff';
        setTimeout(() => {
          selectedBox.style.backgroundColor = '';
        }, 500);
      }
      
      hideDropdown();
      
    } catch (err) { 
      console.error('showSelected', err); 
    }
  }

  // Event: Typing - just filters dropdown, does not autocomplete
  visitorSearch?.addEventListener('input', (e) => {
    const val = e.target.value;
    filterAndShowDropdown(val);
  });

  // Event: Focus - show recent visitors if input is empty
  visitorSearch?.addEventListener('focus', () => {
    if (visitorSearch.value === '' && suggestions.length > 0) {
      renderDropdown(suggestions.slice(0, 8));
    }
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdownContainer) return;
    if (e.target === visitorSearch || dropdownContainer.contains(e.target)) return;
    hideDropdown();
  });

  // Select button - does NOT auto-select, just shows dropdown
  selectBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const val = (visitorSearch?.value || '').trim();
    if (val) {
      filterAndShowDropdown(val);
    } else if (suggestions.length > 0) {
      renderDropdown(suggestions.slice(0, 8));
    } else {
      alert('No visitors currently checked in');
    }
  });

  // Confirm checkout with simple alert
  confirmBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (!selectedVisitorLogId) {
      alert('Please select a visitor from the dropdown first');
      return;
    }
    
    try {
      const t = token(); 
      if (!t) {
        alert('Not logged in');
        return;
      }
      
      const notes = notesInput ? notesInput.value.trim() : '';
      const departureTime = departureInput ? departureInput.value : new Date().toISOString().slice(0, 16);
      
      const res = await fetch(`${API_BASE}/api/visitors/checkout/${selectedVisitorLogId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${t}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ notes, checkoutTime: departureTime })
      });
      
      if (!res.ok) {
        const body = await res.text();
        return alert('Checkout failed: ' + (body || res.statusText));
      }
      
      // Simple alert success message
      alert('✓ Visitor checked out successfully!');
      
      // Clear UI
      visitorSearch.value = '';
      selectedVisitorLogId = null;
      hideDropdown();
      
      if (selectedBox) {
        selectedBox.querySelector('.visitor-name').textContent = 'No visitor selected';
        selectedBox.querySelector('.visitor-badge').textContent = 'Badge: -';
        selectedBox.querySelector('.visitor-phone').textContent = 'Phone: -';
        selectedBox.querySelector('.visitor-host').textContent = 'Host: -';
        selectedBox.querySelector('.visitor-purpose').textContent = 'Purpose: -';
        selectedBox.querySelector('.visitor-checkin').innerHTML = `<i class="fa-regular fa-clock"></i> Checked In: -`;
      }
      
      if (notesInput) notesInput.value = '';
      
      // Reload suggestions
      await loadSuggestions();
      
    } catch (err) { 
      console.error('checkout error', err); 
      alert('Checkout failed: ' + err.message);
    }
  });

  // Cancel selection
  cancelBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    visitorSearch.value = '';
    selectedVisitorLogId = null;
    hideDropdown();
    
    if (selectedBox) {
      selectedBox.querySelector('.visitor-name').textContent = 'No visitor selected';
      selectedBox.querySelector('.visitor-badge').textContent = 'Badge: -';
      selectedBox.querySelector('.visitor-phone').textContent = 'Phone: -';
      selectedBox.querySelector('.visitor-host').textContent = 'Host: -';
      selectedBox.querySelector('.visitor-purpose').textContent = 'Purpose: -';
      selectedBox.querySelector('.visitor-checkin').innerHTML = `<i class="fa-regular fa-clock"></i> Checked In: -`;
    }
    
    if (notesInput) notesInput.value = '';
  });

  // Set default departure time to now
  if (departureInput) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const val = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    departureInput.value = val;
  }

  // Helper function to escape HTML
  // Prevents XSS in dropdown items
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initialize
  loadSuggestions();
});