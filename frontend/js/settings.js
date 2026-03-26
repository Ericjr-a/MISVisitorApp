const sidebar = document.querySelector('.sidebar');
const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';
const toggleBtn = document.getElementById('sidebarToggle');
const body = document.body;

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    window.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });
}



// Profile Modal Functionality
const profileModal = document.getElementById('profileModal');
const profileSection = document.getElementById('profileSection');
const profileCircle = document.querySelector('.profile-circle');
const closeProfileModal = document.getElementById('closeProfileModal');
const profileForm = document.getElementById('profileForm');
const emailInput = document.getElementById('email');
const roleInput = document.getElementById('role');
const fullNameInput = document.getElementById('fullName');
const summaryName = document.querySelector('.text-content h3');
const summaryEmail = document.querySelector('.text-content p');

// Change Password Modal Functionality
const changePasswordModal = document.getElementById('changePasswordModal');
const changePasswordSection = document.getElementById('changePasswordSection');
const closePasswordModal = document.getElementById('closePasswordModal');
const changePasswordForm = document.getElementById('changePasswordForm');

// User & Role Management Modal Functionality
const userRoleModal = document.getElementById('userRoleModal');



const userRoleSection = document.getElementById('userRoleSection');

async function loadProfile() {
    try {
        const token = localStorage.getItem('vra_token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/users/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();
        const role = (data.role_name || '').toLowerCase();



        const wrapper = userRoleSection?.closest('.settings-section');
        if (wrapper) {
            wrapper.style.display = role === 'admin' ? '' : 'none';
        }

        if (fullNameInput) fullNameInput.value = data.username || '';
        if (emailInput) emailInput.value = data.email || '';
        if (roleInput) roleInput.value = data.role_name || '';

        if (summaryName) summaryName.textContent = data.username || 'Preferred Name';
        if (summaryEmail) summaryEmail.textContent = `Email: ${data.email || ''}`;


    } catch (err) {
        console.error('Error loading profile:', err);
    }
}



const newUserBtn = document.getElementById('newUserBtn');

// Hide User & Role Management for Receptionists
/*const userRole = localStorage.getItem('vra_role');

if (userRole && userRole.toLowerCase() === 'receptionist' && userRoleSection) {
    const parentSection = userRoleSection.closest('.settings-section');
    if (parentSection) {
        parentSection.style.display = 'none';
    } else {
        userRoleSection.style.display = 'none';
    }
}*/

// Open profile modal when profile section is clicked
if (profileSection) {
    profileSection.addEventListener('click', function () {
        profileModal.style.display = 'flex';
        loadProfileData();
    });
}

// Open change password modal when change password section is clicked
if (changePasswordSection) {
    changePasswordSection.addEventListener('click', function () {
        changePasswordModal.style.display = 'flex';
        // Clear form fields
        if (changePasswordForm) {
            changePasswordForm.reset();
        }
    });
}

// Open user & role management modal when section is clicked
if (userRoleSection) {
    userRoleSection.addEventListener('click', function () {
        userRoleModal.style.display = 'flex';
        loadUsers();
    });
}

// Close profile modal when cancel button is clicked
if (closeProfileModal) {
    closeProfileModal.addEventListener('click', function () {
        profileModal.style.display = 'none';
    });
}

// Close change password modal when cancel button is clicked
if (closePasswordModal) {
    closePasswordModal.addEventListener('click', function () {
        changePasswordModal.style.display = 'none';
    });
}

// Close modals when clicking outside the modal content
window.addEventListener('click', function (event) {
    if (event.target === profileModal) {
        profileModal.style.display = 'none';
    }
    if (event.target === changePasswordModal) {
        changePasswordModal.style.display = 'none';
    }
    if (event.target === userRoleModal) {
        userRoleModal.style.display = 'none';
    }
});

// New User Modal Functionality
const newUserModal = document.getElementById('newUserModal');
const newUserForm = document.getElementById('newUserForm');
const closeNewUserModal = document.getElementById('closeNewUserModal');

// Handle New User button click
if (newUserBtn) {
    newUserBtn.addEventListener('click', function () {
        newUserModal.style.display = 'flex';
        newUserForm.reset();
    });
}

// Close new user modal when cancel button is clicked
if (closeNewUserModal) {
    closeNewUserModal.addEventListener('click', function () {
        newUserModal.style.display = 'none';
    });
}

// Close new user modal when clicking outside the modal content
window.addEventListener('click', function (event) {
    if (event.target === newUserModal) {
        newUserModal.style.display = 'none';
    }
});

// Handle new user form submission
if (newUserForm) {
    newUserForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const name = document.getElementById('newUserName').value.trim();
        const role = document.getElementById('newUserRole').value;
        const email = document.getElementById('newUserEmail').value.trim();
        const password = document.getElementById('newUserPassword')?.value || '';

        // Validate inputs
        if (!name || !role || !email) {
            alert('Please fill in all fields');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        const token = localStorage.getItem('vra_token');
        if (!token) return alert('You must be logged in as admin to add users');

        fetch(API_BASE + '/users/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ username: name, email, passwordd: password, role_name: role })
        })
            .then(async (r) => {
                const body = await r.json().catch(() => ({}));

                if (!r.ok) {
                    return alert(body.message || 'Failed to add user');
                }

                newUserModal.style.display = 'none';
                loadUsers();
                alert(body.message || 'New user added successfully!');
            })
            .catch(err => {
                console.error('add user', err);
                alert('Failed to add user');
            });
    });
}

// Function to add new user to table
function addNewUserToTable(name, role, email) {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;

    const newRow = document.createElement('tr');

    newRow.innerHTML = `
        <td>${name}</td>
        <td>${role}</td>
        <td><span class="status-badge active">Active</span></td>
        <td class="action-icons">
            <i class="fa-solid fa-pen-to-square edit-icon" title="Edit"></i>
            <i class="fa-solid fa-trash delete-icon" title="Delete"></i>
        </td>
    `;

    tableBody.appendChild(newRow);
}

// Load users from backend and populate table
function loadUsers() {
    const token = localStorage.getItem('vra_token');
    if (!token) return;
    fetch(API_BASE + '/users/get-users', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(list => {
            const tableBody = document.getElementById('userTableBody');
            if (!tableBody) return;
            tableBody.innerHTML = '';
            list.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                        <td>${u.username || u.email}</td>
                        <td>${u.role_name || ''}</td>
                        <td><span class="status-badge active">Active</span></td>
                        <td class="action-icons">
                            <i class="fa-solid fa-pen-to-square edit-icon" 
                               data-id="${u.user_ID}" 
                               data-username="${u.username || ''}" 
                               data-email="${u.email}" 
                               data-role="${u.role_name || ''}"></i> 
                            <i class="fa-solid fa-trash delete-icon" data-id="${u.user_ID}"></i>
                        </td>
                    `;
                tableBody.appendChild(tr);
            });
        }).catch(err => console.error('loadUsers', err));
}

// Edit User Modal Elements
const editUserModal = document.getElementById('editUserModal');
const editUserForm = document.getElementById('editUserForm');
const closeEditUserModal = document.getElementById('closeEditUserModal');

// Handle Edit icon clicks
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('edit-icon')) {
        const userId = event.target.getAttribute('data-id');
        const username = event.target.getAttribute('data-username');
        const email = event.target.getAttribute('data-email');
        const role = event.target.getAttribute('data-role');

        openEditUserModal(userId, username, email, role);
    }
});

function openEditUserModal(id, name, email, role) {
    if (!editUserModal) return;
    document.getElementById('editUserId').value = id;
    document.getElementById('editUserName').value = name;
    document.getElementById('editUserEmail').value = email;

    // Enhanced role selection logic
    const roleSelect = document.getElementById('editUserRole');
    if (roleSelect) {
        // Try exact match first (trimming whitespace)
        const cleanRole = role ? role.trim() : '';
        roleSelect.value = cleanRole;

        // If not selected (and cleanRole is not empty), try case-insensitive match
        if (!roleSelect.value && cleanRole) {
            for (let i = 0; i < roleSelect.options.length; i++) {
                if (roleSelect.options[i].value.toLowerCase() === cleanRole.toLowerCase()) {
                    roleSelect.selectedIndex = i;
                    roleSelect.value = roleSelect.options[i].value; // set explicitly
                    break;
                }
            }
        }

        // If still not matched, maybe log a warning or select default?
        // keeping empty if no match found.
    }

    editUserModal.style.display = 'flex';
}

// Close edit user modal
if (closeEditUserModal) {
    closeEditUserModal.addEventListener('click', () => {
        editUserModal.style.display = 'none';
    });
}

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target === editUserModal) editUserModal.style.display = 'none';
});

// Handle Edit User Form Submission
if (editUserForm) {
    editUserForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const id = document.getElementById('editUserId').value;
        const username = document.getElementById('editUserName').value;
        const email = document.getElementById('editUserEmail').value;
        const role_name = document.getElementById('editUserRole').value;

        const token = localStorage.getItem('vra_token');
        if (!token) return alert('Not authorized');

        fetch(API_BASE + `/users/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username, email, role_name })
        })
            .then(r => r.json())
            .then(data => {
                if (data.message === 'User updated successfully') {
                    alert('User updated successfully');
                    editUserModal.style.display = 'none';
                    loadUsers(); // Refresh table
                } else {
                    alert(data.message || 'Update failed');
                }
            })
            .catch(err => {
                console.error('Update user error:', err);
                alert('Failed to update user');
            });
    });
}

// Handle Delete icon clicks
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('delete-icon')) {
        const row = event.target.closest('tr');
        const userName = row.cells[0].textContent;
        const userId = event.target.getAttribute('data-id');
        if (!userId) {
            if (confirm(`Are you sure you want to delete user: ${userName}?`)) { row.remove(); alert(`User ${userName} deleted successfully`); }
            return;
        }
        if (!confirm(`Are you sure you want to delete user: ${userName}?`)) return;
        const token = localStorage.getItem('vra_token');
        if (!token) return alert('Not authorized');
        fetch(API_BASE + `/users/delete/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(b => { if (b && b.message) { row.remove(); alert(b.message); } else { alert('Delete failed'); } })
            .catch(err => { console.error('delete user', err); alert('Delete failed'); });
    }
});

// Load profile data from localStorage
function loadProfileData() {
    const token = localStorage.getItem('vra_token');
    const profileAvatar = document.querySelector('.profile-avatar');
    if (!token) {
        // fallback to localStorage values
        const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
        document.getElementById('fullName').value = profileData.fullName || '';
        document.getElementById('email').value = profileData.email || '';
        document.getElementById('phone').value = profileData.phone || '';
        const savedPicture = localStorage.getItem('profilePicture');
        if (savedPicture && profileAvatar) {
            const existingImg = profileAvatar.querySelector('img'); if (existingImg) existingImg.remove();
            const img = document.createElement('img'); img.src = savedPicture; profileAvatar.appendChild(img);
            const icon = profileAvatar.querySelector('i'); if (icon) icon.style.display = 'none';
        }
        return;
    }

    // fetch profile from backend
    fetch(API_BASE + '/users/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (!r.ok) throw new Error('Failed to fetch profile'); return r.json(); })
        .then(profile => {
            document.getElementById('fullName').value = profile.username || '';
            document.getElementById('email').value = profile.email || '';
            document.getElementById('role').value = profile.role_name || '';
            if (profile.avatar && profileAvatar) {
                const existingImg = profileAvatar.querySelector('img'); if (existingImg) existingImg.remove();
                const img = document.createElement('img'); img.src = API_BASE + profile.avatar; profileAvatar.appendChild(img);
                const icon = profileAvatar.querySelector('i'); if (icon) icon.style.display = 'none';
                // save to localStorage for other pages
                localStorage.setItem('profilePicture', API_BASE + profile.avatar);
            }
            // persist basic profile locally
            localStorage.setItem('profileData', JSON.stringify({
                fullName: profile.username || '',
                email: profile.email || '',
                role: profile.role_name || ''
            }));

            updateProfileDisplay({
                fullName: profile.username || '',
                email: profile.email || ''
            });
        }).catch(() => {
            // fallback to localStorage earlier
        });
}

// Handle Upload Photo button click
const profilePicInput = document.getElementById('profilePicture');
const profileAvatarEl = document.querySelector('.profile-avatar');
let selectedAvatarFile = null;

if (profileAvatarEl && profilePicInput) {
    profileAvatarEl.addEventListener('click', function () { profilePicInput.click(); });

    profilePicInput.addEventListener('change', function (event) {
        const file = event.target.files[0];
        selectedAvatarFile = file || null;

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function (e) {
                const profileAvatar = document.querySelector('.profile-avatar');
                if (profileAvatar) {
                    // Remove existing image if any
                    const existingImg = profileAvatar.querySelector('img');
                    if (existingImg) {
                        existingImg.remove();
                    }

                    // Create and add new image
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    profileAvatar.appendChild(img);

                    // Hide the icon
                    const icon = profileAvatar.querySelector('i');
                    if (icon) icon.style.display = 'none';
                }
            };

            reader.readAsDataURL(file);
        }
    });
}

// Handle profile form submission
if (profileForm) {
    profileForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const profileData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value
        };
        // If image present, include base64
        const profileAvatar = document.querySelector('.profile-avatar');
        const img = profileAvatar ? profileAvatar.querySelector('img') : null;
        const avatarBase64 = img && img.src && img.src.startsWith('data:') ? img.src : null;

        const token = localStorage.getItem('vra_token');
        if (!token) {
            // offline fallback
            localStorage.setItem('profileData', JSON.stringify(profileData));
            if (img && img.src) localStorage.setItem('profilePicture', img.src);
            updateProfileDisplay(profileData);
            profileModal.style.display = 'none';
            return alert('Profile updated locally (login to sync)');
        }

        // Send JSON payload
        fetch(API_BASE + '/users/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)


        }).catch(err => { console.error('profile update', err); alert('Failed to update profile'); });
    });
}

// Handle delete profile button
const deleteProfileBtn = document.getElementById('deleteProfileBtn');
if (deleteProfileBtn) {
    deleteProfileBtn.addEventListener('click', function () {
        if (!confirm('Are you sure you want to delete your profile? This will clear all profile data.')) {
            return;
        }

        // Clear localStorage profile data
        localStorage.removeItem('profileData');
        localStorage.removeItem('profilePicture');

        // Reset form fields
        document.getElementById('fullName').value = '';
        document.getElementById('email').value = '';
        document.getElementById('role').value = '';

        // Reset profile picture display
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
            const existingImg = profileAvatar.querySelector('img');
            if (existingImg) existingImg.remove();
            const icon = profileAvatar.querySelector('i');
            if (icon) icon.style.display = 'block';
        }

        // Update profile display
        updateProfileDisplay({ fullName: '', email: '', phone: '' });

        // Clear global avatar
        const icons = document.querySelectorAll('.profile-icon, .profile-circle');
        icons.forEach(el => {
            if (el) el.style.backgroundImage = '';
        });

        alert('Profile deleted successfully!');
    });
}

// Update profile display on settings page
function updateProfileDisplay(data) {
    const textContent = document.querySelector('.text-content');
    if (textContent) {
        const h3 = textContent.querySelector('h3');
        const p = textContent.querySelector('p');

        if (h3) h3.textContent = data.fullName || 'Preferred Name';
        if (p) p.textContent = `Email: ${data.email || ''}`;
    }
}

// Update profile picture
function updateProfilePicture(imageSrc) {
    if (profileCircle) {
        profileCircle.style.backgroundImage = `url(${imageSrc})`;
    }
}

// Password visibility toggle functionality
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('toggle-password')) {
        const targetId = event.target.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        const icon = event.target;

        if (passwordInput) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        }
    }
});



/*async function loadProfile() {
    try {
        const token = localStorage.getItem('vra_token');
        if (!token) return;

        const res = await fetch(`${API_BASE}/users/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Failed to load profile');

        const data = await res.json();

        // Fill the visible profile fields
        const fullName = document.getElementById('fullName');
        const email = document.getElementById('email');
        const role = document.getElementById('role');

        if (fullName) fullName.value = data.username || '';
        if (email) email.value = data.email || '';
        if (role) role.value = data.role_name || '';

        // Also fill the summary section at the top if you want
        const preferredName = document.querySelector('.text-content h3');
        const emailText = document.querySelector('.text-content p');

        if (preferredName) preferredName.textContent = data.username || 'Preferred Name';
        if (emailText) emailText.textContent = `Email: ${data.email || ''}`;

        // Role-based access
        const userRole = (data.role_name || '').toLowerCase();

        if (userRoleSection) {
            if (userRole === 'admin') {
                userRoleSection.closest('.settings-section').style.display = '';
            } else {
                userRoleSection.closest('.settings-section').style.display = 'none';
            }
        }

    } catch (err) {
        console.error('Error loading profile:', err);
    }
}*/

// Handle change password form submission
if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate passwords
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all password fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters long');
            return;
        }

        if (currentPassword === newPassword) {
            alert("New password must be different from current password.");
            return;
        }

        // Send change-password request to backend
        const token = localStorage.getItem('vra_token');
        if (!token) return alert('You must be logged in to change your password');

        fetch(API_BASE + '/users/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ currentPassword, newPassword })
        }).then(async (r) => {
            const body = await r.json().catch(() => ({}));
            if (!r.ok) {
                return alert(body.message || 'Failed to change password');
            }
            changePasswordModal.style.display = 'none';
            changePasswordForm.reset();
            alert(body.message || 'Password changed successfully!');
        }).catch(err => { console.error('change-password', err); alert('Failed to change password'); });
    });
}

// Load profile data on page load
// apply stored avatar to global header/profile icons
function applyGlobalAvatar() {
    const avatar = localStorage.getItem('profilePicture');
    if (!avatar) return;
    // profile icon in header
    const icons = document.querySelectorAll('.profile-icon, .profile-circle');
    icons.forEach(el => {
        if (el) el.style.backgroundImage = `url(${avatar})`;
    });
}

applyGlobalAvatar();
document.addEventListener('DOMContentLoaded', function () {
    const profileData = JSON.parse(localStorage.getItem('profileData')) || {};
    const savedPicture = localStorage.getItem('profilePicture');

    if (Object.keys(profileData).length > 0) {
        updateProfileDisplay(profileData);
    }

    if (savedPicture && profileCircle) {
        updateProfilePicture(savedPicture);
    }

    loadProfileData();
    loadProfile();
});

