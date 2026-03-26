document.addEventListener('DOMContentLoaded', async () => {
  // API base — use the same pattern as other frontend scripts.
  const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';
  const statNumber = document.querySelector('.card-stat .stat-number');
  const recentList = document.querySelector('.card-activity ul');

  const token = localStorage.getItem('vra_token');
  if (!token) {
    statNumber.textContent = '—';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/reports/dashboard?t=${new Date().getTime()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    console.log('Dashboard Data:', data);

    // show active visitors count
    const totalVisitors = data.active_visitors_count;
    console.log('Active Visitors Count:', totalVisitors);
    statNumber.textContent = (totalVisitors !== undefined) ? totalVisitors : 0;

    // populate recent activity
    if (data.recent_activities && data.recent_activities.length) {
      recentList.innerHTML = '';
      data.recent_activities.forEach(rv => {
        const li = document.createElement('li');
        // Determine icon based on type
        let iconClass = 'fa-arrow-right-to-bracket'; // default check-in
        let iconType = 'check-in';

        if (rv.type === 'call') {
          iconClass = 'fa-phone';
          iconType = 'call';
        } else if (rv.type === 'check-out') {
          iconClass = 'fa-arrow-right-from-bracket';
          iconType = 'check-out';
        }

        const dateStr = rv.date ? new Date(rv.date).toLocaleString() : '';

        li.innerHTML = `<div class="visitor-info"><i class="fa-solid ${iconClass} activity-icon ${iconType}"></i><span class="visitor-name">${rv.name}</span></div><span class="time-ago">${dateStr}</span>`;
        recentList.appendChild(li);
      });
    }
  } catch (err) {
    console.error('Dashboard fetch failed', err);
  }
});
