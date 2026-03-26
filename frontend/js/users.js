document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('#usersTable tbody');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('passwordd');
  const roleSelect = document.getElementById('role_name');
  const addUserBtn = document.getElementById('addUserBtn');

  // Edit Modal Elements
  const editModal = document.getElementById('editUserModal');
  const closeBtn = document.querySelector('.close');
  const saveUserBtn = document.getElementById('saveUserBtn');
  const editIdInput = document.getElementById('edit_user_id');
  const editUsernameInput = document.getElementById('edit_username');
  const editEmailInput = document.getElementById('edit_email');
  const editRoleSelect = document.getElementById('edit_role_name');

  function getToken() { return localStorage.getItem('vra_token'); }

  async function fetchUsers() {
    const token = getToken(); if (!token) return alert('Login required');
    const res = await fetch('${window.API_BASE}/users/get-users', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) return alert('Failed to load users');
    const data = await res.json();
    tableBody.innerHTML = '';
    data.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.email}</td>
        <td>${u.role_name}</td>
        <td>${new Date(u.created_at).toLocaleDateString()}</td>
        <td>
            <button class="edit btn-secondary" data-id="${u.user_ID}" data-email="${u.email}" data-role="${u.role_name}" data-username="${u.username || ''}">Edit</button>
            <button class="reset-pwd btn-secondary" data-id="${u.user_ID}">Reset Pwd</button>
            <button class="delete btn-danger" data-id="${u.user_ID}">Delete</button>
        </td>`;
      tableBody.appendChild(tr);
    });
  }

  addUserBtn.addEventListener('click', async () => {
    const token = getToken(); if (!token) return alert('Login required');
    const payload = { username: usernameInput.value, email: emailInput.value, passwordd: passwordInput.value, role_name: roleSelect.value };
    const res = await fetch('${window.API_BASE}/users/add-user', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) return alert(data.message || 'User create failed');
    alert('User added');
    fetchUsers();
    // clear inputs
    usernameInput.value = ''; emailInput.value = ''; passwordInput.value = '';
  });

  tableBody.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    const token = getToken();

    if (target.matches('.delete')) {
      if (!confirm('Delete user?')) return;
      const res = await fetch(`${window.API_BASE}/users/delete/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return alert('Delete failed');
      alert('Deleted');
      fetchUsers();
    } else if (target.matches('.edit')) {
      editIdInput.value = id;
      editEmailInput.value = target.dataset.email;
      editRoleSelect.value = target.dataset.role;
      editUsernameInput.value = target.dataset.username; // Assuming backend returns username now or we fetch it
      editModal.style.display = 'block';
    } else if (target.matches('.reset-pwd')) {
      const newPwd = prompt('Enter new password for this user:');
      if (!newPwd) return;
      const res = await fetch(`${window.API_BASE}/users/reset-password/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPwd })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || 'Reset failed');
      alert('Password reset successfully');
    }
  });

  // Save Edits
  saveUserBtn.addEventListener('click', async () => {
    const token = getToken();
    const id = editIdInput.value;
    const payload = {
      username: editUsernameInput.value,
      email: editEmailInput.value,
      role_name: editRoleSelect.value
    };

    const res = await fetch(`${window.API_BASE}/users/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json();
      return alert(data.message || 'Update failed');
    }

    alert('User updated');
    editModal.style.display = 'none';
    fetchUsers();
  });

  // Close Modal
  closeBtn.onclick = () => editModal.style.display = 'none';
  window.onclick = (e) => { if (e.target == editModal) editModal.style.display = 'none'; };

  fetchUsers();
});
