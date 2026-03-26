// Check-in frontend integration
document.addEventListener('DOMContentLoaded', function () {
  console.log('[Checkin.js] DOM loaded');
  const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';

  // Modal and form elements
  const checkinBtn = document.getElementById('checkinBtn'); // The main "Check-In Visitor" button
  const cancelBtn = document.getElementById('cancelBtn');
  const badgeInput = document.getElementById('checkin_badge_number');
  const arrivalInput = document.getElementById('arrival_time'); // Warning: ID in HTML is 'checkin_arrival_time' or 'arrival_time'? HTML says 'checkin_arrival_time' but let's check
  // Checking HTML: <input id="checkin_arrival_time" ...>
  // So we must use checkin_arrival_time
  const arrivalTimeInput = document.getElementById('checkin_arrival_time');

  const thumbprintBtn = document.getElementById('thumbprintBtn');
  const fingerprintModal = document.getElementById('fingerprintModal');
  const cancelFingerprintBtn = document.getElementById('cancelFingerprintBtn');
  const confirmFingerprintCheckinBtn = document.getElementById('confirmFingerprintCheckinBtn');

  // Form Inputs
  const firstNameInput = document.getElementById('checkin_guest_firstname');
  const lastNameInput = document.getElementById('checkin_guest_lastname');
  const phoneInput = document.getElementById('checkin_guest_phonenumber');
  const hostInput = document.getElementById('checkin_host_name');
  const purposeInput = document.getElementById('checkin_visit_purpose');

  const hostsDatalist = document.getElementById('hosts');
  let hostsList = [];

  // Helper: Get Token
  function getToken() { return localStorage.getItem('vra_token'); }

  // Helper: Show Toast (requires script.js or V.Js loaded, otherwise fallback to alert)
  function showToast(type, msg) {
    if (window.showAppToast) window.showAppToast(type, msg);
    else alert(`${type.toUpperCase()}: ${msg} `);
  }

  // 1. Fetch Next Badge Number
  // 1. Fetch Next Badge Number
  async function fetchNextBadgeNumber() {
    try {
      const token = getToken();
      if (!token) return; // User might not be logged in yet
      console.log('[Checkin.js] Fetching next badge...');
      const res = await fetch(`${API_BASE}/api/visitors/next-badge`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn('Failed to fetch next badge number', errText);
        showToast('error', 'Badge Error: ' + errText);
        return;
      }
      const data = await res.json();
      if (badgeInput && data && data.badge_number) {
        badgeInput.value = data.badge_number;
      }
    } catch (err) {
      console.error('Error fetching badge number:', err);
      showToast('error', 'Network Error (Badge)');
    }
  }

  // 2. Load Hosts for Datalist
  async function loadHosts() {
    try {
      const token = getToken();
      if (!token) return;
      console.log('[Checkin.js] Loading hosts...');
      const res = await fetch(`${API_BASE}/hosts/get-all`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const errText = await res.text();
        console.error('Failed to load hosts', errText);
        try {
          const jsonErr = JSON.parse(errText);
          showToast('error', 'Server Error (Hosts): ' + (jsonErr.error || jsonErr.message));
        } catch (e) {
          showToast('error', 'Server Error (Hosts): ' + errText);
        }
        return;
      }
      const data = await res.json();

      if (Array.isArray(data)) {
        hostsList = data;
      } else if (data.data && Array.isArray(data.data)) {
        hostsList = data.data;
      } else {
        hostsList = [];
      }

      if (hostsDatalist) {
        hostsDatalist.innerHTML = '';
        hostsList.forEach(h => {
          const opt = document.createElement('option');
          opt.value = h.host_name || '';
          hostsDatalist.appendChild(opt);
        });
      }
    } catch (err) { console.warn('loadHosts error', err); }
  }

  // 3. Set Default Arrival Time
  if (arrivalTimeInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    arrivalTimeInput.value = now.toISOString().slice(0, 16);
  }

  // 4. Perform Check-In Logic
  async function performCheckin() {
    console.log('[Checkin.js] Performing check-in...');
    const token = getToken();
    if (!token) return showToast('error', 'You must be logged in.');

    // Validate inputs
    const fname = firstNameInput?.value?.trim();
    const lname = lastNameInput?.value?.trim();
    const hostName = hostInput?.value?.trim();
    const purpose = purposeInput?.value?.trim();
    const phone = phoneInput?.value?.trim();
    const badge = badgeInput?.value?.trim(); // Read-only but sent for record


    if (!fname || !lname || !phone || !hostName || !purpose) {
      return showToast('warning', 'Please fill all required fields (*)');
    }

    if (!/^\d{10}$/.test(phone)) {
      return showToast('warning', 'Phone number must be exactly 10 digits');
    }

    // Resolve Host ID
    let host_ID = null;
    let is_staff = 0;

    console.log('[Checkin.js] Debug - Input Host:', hostName);
    console.log('[Checkin.js] Debug - Available Hosts:', hostsList.length, hostsList);

    if (hostsList.length > 0) {
      const exact = hostsList.find(h => (h.host_name || '').toLowerCase() === hostName.toLowerCase());
      if (exact) {
        console.log('[Checkin.js] Debug - Exact match found:', exact);
        host_ID = exact.host_ID;
        is_staff = exact.host_type === 'Staff' ? 1 : 0;
      } else {
        // Flexible match? For now, demand exact or warn.
        // Let's allow partial if strict mode isn't required, but better to enforce selection.
        // Try partial:
        const partial = hostsList.find(h => (h.host_name || '').toLowerCase().includes(hostName.toLowerCase()));
        if (partial) {
          console.log('[Checkin.js] Debug - Partial match found:', partial);
          host_ID = partial.host_ID;
          is_staff = partial.host_type === 'Staff' ? 1 : 0;
        }
      }
    } else {
      console.warn('[Checkin.js] Debug - hostsList is empty! API might have failed.');
    }

    if (!host_ID) {
      console.error('[Checkin.js] Validation Failed: Host not found in list.');
      return showToast('warning', `Host "${hostName}" not found in list (${hostsList.length} loaded). Check console.`);
    }

    const payload = {
      guest_firstname: fname,
      guest_lastname: lname,
      guest_phonenumber: phone,
      host_ID: host_ID,
      is_staff: is_staff,
      visit_purpose: purpose
    };


    try {
      console.log('[Checkin.js] Sending check-in request...');
      const res = await fetch(`${API_BASE}/api/visitors/new-visitor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Check-in failed:', errText);
        try {
          const errJson = JSON.parse(errText);
          return showToast('error', errJson.message || 'Check-in failed');
        } catch (e) {
          return showToast('error', 'Check-in failed: ' + errText);
        }
      }

      const data = await res.json();
      showToast('success', 'Visitor checked in successfully!');

      // Reset form
      firstNameInput.value = '';
      lastNameInput.value = '';
      phoneInput.value = '';
      hostInput.value = '';
      purposeInput.value = '';

      // Refresh Badge
      fetchNextBadgeNumber();

    } catch (err) {
      console.error('Check-in error:', err);
      showToast('error', 'Network error during check-in.');
    }
  }

  // --- Event Listeners ---

  // 1. Main Check-In Button
  checkinBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    performCheckin();
  });

  // 2. Cancel Button
  cancelBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Clear form?')) {
      firstNameInput.value = '';
      lastNameInput.value = '';
      phoneInput.value = '';
      hostInput.value = '';
      purposeInput.value = '';
    }
  });

  // 3. Fingerprint Modal (Mock)
  thumbprintBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (fingerprintModal) fingerprintModal.style.display = 'flex';
  });

  cancelFingerprintBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (fingerprintModal) fingerprintModal.style.display = 'none';
  });

  confirmFingerprintCheckinBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (fingerprintModal) fingerprintModal.style.display = 'none';
    performCheckin();
  });

  // Initialize
  fetchNextBadgeNumber();
  loadHosts();
});
