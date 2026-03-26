document.addEventListener('DOMContentLoaded', () => {
  const enrollBtn = document.getElementById('enrollBtn');
  const matchBtn = document.getElementById('matchBtn');
  const guestIdInput = document.getElementById('guestId');
  const fpTemplateInput = document.getElementById('fpTemplate');
  const resultDiv = document.getElementById('result');

  function getToken() { return localStorage.getItem('vra_token'); }

  enrollBtn.addEventListener('click', async () => {
    const guest_ID = guestIdInput.value.trim();
    const fingerprint_template = fpTemplateInput.value.trim();
    if (!guest_ID || !fingerprint_template) return alert('Guest ID and template required');
    const token = getToken();
    try {
      const res = await fetch('${window.API_BASE}/api/fingerprints/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ guest_ID, fingerprint_template })
      });
      const data = await res.json();
      if (!res.ok) return resultDiv.textContent = 'Enroll failed: ' + (data.message || res.statusText);
      resultDiv.textContent = 'Enrolled fingerprint id: ' + data.fingerprint_ID;
    } catch (err) { console.error(err); resultDiv.textContent = 'Enroll error'; }
  });

  matchBtn.addEventListener('click', async () => {
    const fingerprint_template = fpTemplateInput.value.trim();
    if (!fingerprint_template) return alert('Template required');
    try {
      const res = await fetch('${window.API_BASE}/api/fingerprints/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerprint_template })
      });
      const data = await res.json();
      if (!res.ok) return resultDiv.textContent = 'Match failed: ' + (data.message || res.statusText);
      resultDiv.textContent = `Match found: ${data.match.guest_firstname} ${data.match.guest_lastname} (guest_ID ${data.match.guest_ID})`;
    } catch (err) { console.error(err); resultDiv.textContent = 'Match error'; }
  });
});
