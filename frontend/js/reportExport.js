document.addEventListener('DOMContentLoaded', function () {
    const exportBtn = document.getElementById('exportReport');

    function showCustomAlert(message, type = 'info') {
        const container = document.getElementById('customAlertContainer');
        if (!container) return;

        const alertEl = document.createElement('div');
        alertEl.className = `custom-alert alert-${type}`;
        alertEl.textContent = message;

        container.appendChild(alertEl);

        // Trigger the animation
        setTimeout(() => {
            alertEl.classList.add('show');
        }, 10);

        // Automatically remove the alert after a few seconds
        setTimeout(() => {
            alertEl.classList.remove('show');
            // Remove the element from the DOM after the fade-out transition
            alertEl.addEventListener('transitionend', () => alertEl.remove());
        }, 4000);
    }

    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            // For demonstration, this will show the alert.
            // In a real scenario, you would check if there is data to export first.
            showCustomAlert('There is no data to export for the selected period.', 'info');
        });
    }
});