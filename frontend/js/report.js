// Chart.js for responsive chart
const ctx = document.getElementById('visitorChart').getContext('2d');

// Get filter elements
const dataTypeSelect = document.getElementById('dataType');
const fromDateInput = document.getElementById('fromDate');
const toDateInput = document.getElementById('toDate');
const reportTableBody = document.querySelector('#reportTable tbody');

const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';

let visitorChart = new Chart(ctx, {
  type: 'bar',
  data: { labels: [], datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true },
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 0
        }
      }
    },
    layout: {
      padding: {
        bottom: 10
      }
    },
    plugins: { legend: { display: true, position: 'top' } }
  }
});

const purposeCtx = document.getElementById('purposeChart').getContext('2d');
let purposeChart = new Chart(purposeCtx, {
  type: 'doughnut',
  data: { labels: [], datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 20
    },
    plugins: { legend: { position: 'right' } }
  }
});

const hostCtx = document.getElementById('hostChart').getContext('2d');
let hostChart = new Chart(hostCtx, {
  type: 'bar',
  data: { labels: [], datasets: [] },
  options: {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: { x: { beginAtZero: true } },
    plugins: { legend: { display: false } }
  }
});

function pad(n) { return n.toString().padStart(2, '0'); }

function getMonthKey(year, month) { // month is 1-12
  return `${year}-${pad(month)}`;
}

function buildLabels(fromDate, toDate) {
  const labels = [];
  const current = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  const fmt = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' });
  while (current <= end) {
    labels.push({ key: getMonthKey(current.getFullYear(), current.getMonth() + 1), label: fmt.format(current) });
    current.setMonth(current.getMonth() + 1);
  }
  return labels;
}

// Function to show custom alerts
function showCustomAlert(message, type = 'info') {
  const container = document.getElementById('customAlertContainer');
  if (!container) {
    console.warn('Custom alert container not found. Falling back to native alert.', message);
    alert(message); // Fallback to native alert if container is missing
    return;
  }

  const alertEl = document.createElement('div');
  alertEl.className = `custom-alert alert-${type}`;
  alertEl.textContent = message;

  // Clear previous alerts to avoid stacking too many
  const existingAlerts = container.querySelectorAll('.custom-alert');
  existingAlerts.forEach(el => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  });

  container.appendChild(alertEl);

  // Trigger the animation
  setTimeout(() => {
    alertEl.classList.add('show');
  }, 10);

  // Automatically remove the alert after a few seconds
  setTimeout(() => {
    alertEl.classList.remove('show');
    alertEl.addEventListener('transitionend', () => alertEl.remove(), { once: true });
  }, 4000);
}

async function fetchReportsAndRender() {
  const dataTypeUI = dataTypeSelect.value || 'visitors';
  const type = dataTypeUI === 'visitors' ? 'visitor' : (dataTypeUI === 'calls' ? 'call' : 'both');
  const from = fromDateInput.value;
  const to = toDateInput.value;

  if (!from || !to) return showCustomAlert('Please select a date range.', 'info');
  if (new Date(from) > new Date(to)) return showCustomAlert('From date cannot be later than To date.', 'info');

  const token = localStorage.getItem('vra_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const url = `${API_BASE}/api/reports?type=${encodeURIComponent(type)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return showCustomAlert(err.message || 'Failed to fetch report data', 'error');
    }
    const data = await resp.json();

    // Update Summary Cards
    if (data.summary) {
      document.getElementById('totalVisitors').textContent = data.summary.totalVisitors || 0;
      document.getElementById('totalCalls').textContent = data.summary.totalCalls || 0;
    }

    // Update Purpose Chart
    if (data.charts && data.charts.purpose) {
      purposeChart.data.labels = data.charts.purpose.map(p => p.label || 'Unknown');
      purposeChart.data.datasets = [{
        data: data.charts.purpose.map(p => p.value),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }];
      purposeChart.update();
    }

    // Update Top Hosts Chart
    if (data.charts && data.charts.topHosts) {
      hostChart.data.labels = data.charts.topHosts.map(h => h.label || 'Unknown');
      hostChart.data.datasets = [{
        label: 'Visitors',
        data: data.charts.topHosts.map(h => h.value),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }];
      hostChart.update();
    }

    // Build labels between from and to
    const labelsMeta = buildLabels(new Date(from), new Date(to));
    const labels = labelsMeta.map(l => l.label);

    // Map totals
    const visitorTotals = {};
    (data.visitor || []).forEach(r => { visitorTotals[getMonthKey(r.year, r.month)] = Number(r.total || 0); });
    const callTotals = {};
    (data.call || []).forEach(r => { callTotals[getMonthKey(r.year, r.month)] = Number(r.total || 0); });

    const visitorData = labelsMeta.map(lm => visitorTotals[lm.key] || 0);
    const callData = labelsMeta.map(lm => callTotals[lm.key] || 0);

    // Update chart datasets
    if (type === 'both') {
      visitorChart.data.labels = labels;
      visitorChart.data.datasets = [
        { label: 'Visitors', data: visitorData, backgroundColor: 'rgba(99, 102, 241, 0.6)', borderColor: 'rgba(99, 102, 241, 1)', borderWidth: 1 },
        { label: 'Calls', data: callData, backgroundColor: 'rgba(255, 99, 132, 0.6)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }
      ];
    } else if (type === 'visitor') {
      visitorChart.data.labels = labels;
      visitorChart.data.datasets = [{ label: 'Visitors', data: visitorData, backgroundColor: 'rgba(99, 102, 241, 0.6)', borderColor: 'rgba(99, 102, 241, 1)', borderWidth: 1 }];
    } else {
      visitorChart.data.labels = labels;
      visitorChart.data.datasets = [{ label: 'Calls', data: callData, backgroundColor: 'rgba(255, 99, 132, 0.6)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 1 }];
    }

    visitorChart.update();

    // Render recent rows in table
    renderTable(data, type);

  } catch (err) {
    console.error('Failed to fetch reports', err);
    showCustomAlert('Failed to fetch reports', 'error');
  }
}

function renderTable(data, type) {
  if (!reportTableBody) return;
  reportTableBody.innerHTML = '';

  const addRow = (row, rowType) => {
    const tr = document.createElement('tr');
    const dateObj = row.date ? new Date(row.date) : null;
    const formattedDate = dateObj ? dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '';

    tr.innerHTML = `
      <td>${row.name || ''}</td>
      <td>${row.contact || ''}</td>
      <td>${formattedDate}</td>
      <td>${row.purpose || ''}</td>
    `;
    reportTableBody.appendChild(tr);
  };

  if (type === 'visitor' || type === 'both') {
    (data.recentVisitors || []).forEach(r => addRow(r, 'visitor'));
  }
  if (type === 'call' || type === 'both') {
    (data.recentCalls || []).forEach(r => addRow(r, 'call'));
  }
}

// Delete handler (delegated) - REMOVED as button is gone
/*
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-record');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const rowType = btn.getAttribute('data-type');
  if (!id) return showCustomAlert('No ID provided for deletion.', 'info');
  if (!confirm('Are you sure you want to delete this record?')) return;

  const token = localStorage.getItem('vra_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    if (rowType === 'visitor') { // Assuming 'visitor' is the correct type for visitors
      const resp = await fetch(`${API_BASE}/api/visitors/delete/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
      if (!resp.ok) { const b = await resp.json().catch(() => ({})); return showCustomAlert(b.message || 'Delete failed', 'error'); }
      showCustomAlert('Visitor deleted successfully!', 'success');
    } else { // Assuming 'call' is the correct type for calls
      const resp = await fetch(`${API_BASE}/api/calls/delete/${encodeURIComponent(id)}`, { method: 'DELETE', headers }); // Corrected API endpoint for calls
      if (!resp.ok) { const b = await resp.json().catch(() => ({})); return showCustomAlert(b.message || 'Delete failed', 'error'); }
      showCustomAlert('Call deleted successfully!', 'success');
    }
    // Refresh the report after deletion
    fetchReportsAndRender();
  } catch (err) {
    console.error('Delete failed', err);
    alert('Delete failed');
  }
});
*/

// Wire update button
document.getElementById('updateReport').addEventListener('click', fetchReportsAndRender);

// Export via server PDF endpoint (download)
document.getElementById('exportReport').addEventListener('click', async function () {
  const dataTypeUI = dataTypeSelect.value || 'visitors';
  const type = dataTypeUI === 'visitors' ? 'visitor' : (dataTypeUI === 'calls' ? 'call' : 'both');
  const from = fromDateInput.value;
  const to = toDateInput.value;
  if (!from || !to) return showCustomAlert('Please select a date range for export.', 'info');

  const token = localStorage.getItem('vra_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const url = `${API_BASE}/api/reports/export?type=${encodeURIComponent(type)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) { const b = await resp.json().catch(() => ({})); return showCustomAlert(b.message || 'Export failed', 'error'); }
    const blob = await resp.blob();
    const link = document.createElement('a');
    const fileName = `report_${type}_${from}_${to}.csv`;
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showCustomAlert('Report exported successfully!', 'success');
  } catch (err) {
    console.error('Export failed', err);
    showCustomAlert('Export failed.', 'error');
  }
});

// Initial load
fetchReportsAndRender();