// Replace with your machine's IP address if running on a physical device
// For Android Emulator, use 'http://10.0.2.2:3001'
// For iOS Simulator, use 'http://localhost:3001'
export const API_BASE = 'http://172.21.4.106:3001';

export const loginUser = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, passwordd: password }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        return data;
    } catch (error) {
        throw error;
    }
};

export const getDashboardStats = async (token) => {
    try {
        // Using a wide date range to get "all" recent visitors for the dashboard
        const response = await fetch(`${API_BASE}/api/reports/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch dashboard stats');
        return data;
    } catch (error) {
        throw error;
    }
};

export const getVisitors = async (token, page = 1, limit = 10, active = false) => {
    try {
        const response = await fetch(`${API_BASE}/api/visitors/get-visitors?page=${page}&limit=${limit}&active=${active}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch visitors');
        return data;
    } catch (error) {
        throw error;
    }
};

export const getHosts = async (token) => {
    try {
        const response = await fetch(`${API_BASE}/hosts/get-all`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch hosts');
        return data;
    } catch (error) {
        throw error;
    }
};

export const getGuests = async (token) => {
    try {
        const response = await fetch(`${API_BASE}/guests/get`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch guests');
        return data;
    } catch (error) {
        throw error;
    }
};

export const getNextBadgeNumber = async (token) => {
    try {
        const response = await fetch(`${API_BASE}/api/visitors/next-badge`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch badge number');
        return data.badge_number;
    } catch (error) {
        throw error;
    }
};

export const addVisitor = async (token, visitorData) => {
    try {
        const response = await fetch(`${API_BASE}/api/visitors/new-visitor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(visitorData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add visitor');
        return data;
    } catch (error) {
        throw error;
    }
};

export const checkOutVisitor = async (token, visitorId) => {
    try {
        const response = await fetch(`${API_BASE}/api/visitors/checkout/${visitorId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to check out visitor');
        return data;
    } catch (error) {
        throw error;
    }
};

export const getCalls = async (token) => {
    try {
        const response = await fetch(`${API_BASE}/calls/getall`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch calls');
        return data;
    } catch (error) {
        throw error;
    }
};

export const addCall = async (token, callData) => {
    try {
        const response = await fetch(`${API_BASE}/calls/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(callData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add call');
        return data;
    } catch (error) {
        throw error;
    }
};

// User Management
export const getUsers = async (token) => {
    try {
        const response = await fetch(`${API_BASE}/users/get-users`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
        return data;
    } catch (error) {
        throw error;
    }
};

export const addUser = async (token, userData) => {
    try {
        const response = await fetch(`${API_BASE}/users/add-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to add user');
        return data;
    } catch (error) {
        throw error;
    }
};

export const deleteUser = async (token, userId) => {
    try {
        const response = await fetch(`${API_BASE}/users/delete/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete user');
        return data;
    } catch (error) {
        throw error;
    }
};

export const updateUser = async (token, userId, userData) => {
    try {
        const response = await fetch(`${API_BASE}/users/update/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update user');
        return data;
    } catch (error) {
        throw error;
    }
};

export const resetUserPassword = async (token, userId, newPassword) => {
    try {
        const response = await fetch(`${API_BASE}/users/reset-password/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ newPassword }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to reset password');
        return data;
    } catch (error) {
        throw error;
    }
};

// Reports
export const getReports = async (token, type, from, to) => {
    try {
        const url = `${API_BASE}/api/reports?type=${type}&from=${from}&to=${to}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch reports');
        return data;
    } catch (error) {
        throw error;
    }
};

export const changePassword = async (token, currentPassword, newPassword) => {
    try {
        const response = await fetch(`${API_BASE}/users/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to change password');
        return data;
    } catch (error) {
        throw error;
    }
};

export const getProfile = async (token) => {
    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
        return data;
    } catch (error) {
        throw error;
    }
};

export const updateProfile = async (token, profileData) => {
    try {
        // For now, we are sending JSON. If image upload is needed, we'd need FormData.
        const response = await fetch(`${API_BASE}/users/profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to update profile');
        return data;
    } catch (error) {
        throw error;
    }
};
