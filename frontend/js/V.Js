// Apply stored profile avatar to header icons
const storedAvatar = localStorage.getItem('profilePicture');
if (storedAvatar) {
  const icons = document.querySelectorAll('.profile-icon, .profile-circle');
  icons.forEach(el => { if (el) el.style.backgroundImage = `url(${storedAvatar})`; });
}

// --- Profile Dropdown Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const profileIcon = document.querySelector('.header-actions .profile-icon');

  if (profileIcon) {
    // 1. Create Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'profile-wrapper';

    // 2. Insert wrapper before profileIcon
    profileIcon.parentNode.insertBefore(wrapper, profileIcon);

    // 3. Move profileIcon into wrapper
    wrapper.appendChild(profileIcon);

    // 4. Create Dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';

    // Get user data
    let userName = 'User';
    let userEmail = '';
    const profileData = localStorage.getItem('profileData');
    if (profileData) {
      try {
        const pd = JSON.parse(profileData);
        if (pd.fullName) userName = pd.fullName;
        if (pd.email) userEmail = pd.email;
      } catch (e) {
        console.error('Error parsing profile data', e);
      }
    }

    dropdown.innerHTML = `
      <div class="dropdown-header">
        <strong>${userName}</strong>
        ${userEmail ? `<span>${userEmail}</span>` : ''}
      </div>
      <a href="settings.html"><i class="fa-solid fa-gear"></i> Settings</a>
      <hr>
      <a href="#" id="logoutAction"><i class="fa-solid fa-right-from-bracket"></i> Log Out</a>
    `;

    wrapper.appendChild(dropdown);

    // 5. Toggle Event
    profileIcon.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // 6. Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    // 7. Logout Logic
    const logoutBtn = dropdown.querySelector('#logoutAction');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Clear credentials
        localStorage.removeItem('vra_token');
        localStorage.removeItem('profilePicture');
        localStorage.removeItem('profileData');
        localStorage.removeItem('vra_role');
        localStorage.removeItem('vra_email'); // Optional: keep if "Remember me" logic requires it, but usually standard logout clears session. 
        // Actually, "Remember me" usually persists email in a separate key or cookie, but let's clear session data.

        // Redirect
        window.location.href = 'login.html';
      });
    }
  }
});

// --- Sidebar Navigation ---
const allNavLinks = document.querySelectorAll('.sidebar-nav a, .sidebar-bottom-nav a');
const currentPath = window.location.pathname.split('/').pop();

allNavLinks.forEach(link => {
  const linkPath = link.getAttribute('href');

  // Remove 'active' class from all links initially
  link.classList.remove('active');

  // Add 'active' class if the link's href matches the current page
  if (linkPath === currentPath) {
    link.classList.add('active');
  }

  link.addEventListener('click', function (e) {
    // Optional: Log to console which page we are "navigating" to
    const linkText = this.querySelector('span').textContent;
    console.log(`Navigating to ${linkText}`);
  });
});



// --- Search Functionality ---
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('globalSearch');
  const tableRows = document.querySelectorAll('tbody tr');

  /* 
  // Disable legacy client-side search to allow server-side search in specific modules
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase().trim();

      tableRows.forEach(row => {
        const visitorName = row.cells[0].textContent.toLowerCase();
        if (visitorName.includes(searchTerm)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }
  */

  // Visitor search for check-in page
  const visitorSearchInput = document.getElementById('visitorSearch');
  const selectedVisitorBox = document.querySelector('.selected-visitor-box');
  const visitorNameSpan = selectedVisitorBox ? selectedVisitorBox.querySelector('.visitor-name') : null;

  if (visitorSearchInput && visitorNameSpan) {
    visitorSearchInput.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase().trim();
      const datalist = document.getElementById('visitors');
      if (!datalist) return; // no datalist to search
      const options = datalist.querySelectorAll('option');

      const matches = Array.from(options).filter(option => option.value.toLowerCase().includes(searchTerm));
      if (matches.length === 1) {
        visitorNameSpan.textContent = matches[0].value;
      } else if (matches.length > 1) {
        visitorNameSpan.textContent = `${matches.length} matches — pick from suggestions`;
      } else if (searchTerm !== '') {
        visitorNameSpan.textContent = 'No visitor found';
      } else {
        visitorNameSpan.textContent = '';
      }
    });
  }

  // Visitor search for check-out page
  const visitorSearchCheckoutInput = document.getElementById('visitorSearchCheckout');
  const selectedVisitorInfo = document.querySelector('.selected-visitor-info');
  const visitorNameSpanCheckout = selectedVisitorInfo ? selectedVisitorInfo.querySelector('.visitor-name') : null;

  if (visitorSearchCheckoutInput && visitorNameSpanCheckout) {
    visitorSearchCheckoutInput.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase().trim();
      const datalist = document.getElementById('visitorsCheckout');
      if (!datalist) return; // no datalist present
      const options = datalist.querySelectorAll('option');

      const matches = Array.from(options).filter(option => option.value.toLowerCase().includes(searchTerm));
      if (matches.length === 1) {
        visitorNameSpanCheckout.textContent = matches[0].value;
      } else if (matches.length > 1) {
        visitorNameSpanCheckout.textContent = `${matches.length} matches — refine search or pick one`;
      } else if (searchTerm !== '') {
        visitorNameSpanCheckout.textContent = 'No visitor found';
      } else {
        visitorNameSpanCheckout.textContent = '';
      }
    });
  }
});

// --- Modal Popup Logic ---
// Note: Visitor modal (#visitorModal) is now handled in visitor.js for better form management
// This avoids duplicate event listeners and allows proper form reset, validation, and badge prefilling

// --- Call Log Modal Popup Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const callLogModal = document.getElementById('callLogModal');
  const openCallLogBtn = document.getElementById('openCallLogModal');
  const closeCallLogBtn = document.getElementById('closeCallLogModal');

  if (callLogModal && openCallLogBtn && closeCallLogBtn) {
    // Open popup
    openCallLogBtn.addEventListener('click', () => {
      callLogModal.style.display = 'flex';
    });

    // Close popup with cancel button
    closeCallLogBtn.addEventListener('click', () => {
      callLogModal.style.display = 'none';
    });

    // Close when clicking outside the box
    window.addEventListener('click', (e) => {
      if (e.target === callLogModal) {
        callLogModal.style.display = 'none';
      }
    });
  }
});

// Function to apply theme globally
function applyTheme(theme) {
  document.body.classList.remove('light-theme', 'dark-theme', 'gold-theme', 'royal-theme');
  document.body.classList.add(`${theme}-theme`);
}

// --- Custom Toast / Alert Logic ---
window.showAppToast = function (type, message) {
  let container = document.getElementById('customAlertContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'customAlertContainer';
    container.className = 'custom-alert-container';
    document.body.appendChild(container);
  }

  const alertDiv = document.createElement('div');
  // map type to class
  let typeClass = 'alert-info';
  if (type === 'success') typeClass = 'alert-success';
  if (type === 'error' || type === 'warning') typeClass = 'alert-error';

  alertDiv.className = `custom-alert ${typeClass}`;
  alertDiv.textContent = message;

  container.appendChild(alertDiv);

  // Trigger reflow to enable transition
  void alertDiv.offsetWidth;
  alertDiv.classList.add('show');

  // Remove after 3 seconds
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => {
      if (alertDiv.parentNode) alertDiv.parentNode.removeChild(alertDiv);
    }, 300); // wait for transition
  }, 3000);
};

// Alias for compatibility if needed
window.showAppAlert = function (message) {
  window.showAppToast('error', message);
};
