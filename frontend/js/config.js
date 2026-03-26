// config.js
// Automatically detect the API base URL
(function () {
    const hostname = window.location.hostname;
    // const protocol = window.location.protocol;
    // const port = window.location.port;

    // Logic:
    // 1. If we are serving the frontend FROM the backend (port 3001), use relative path or origin.
    // 2. If we are developing (VSCode Live Server on port 5500), point to backend on port 3001.
    // 3. If accessed via IP (192.168.x.x), allow it.

    if (window.location.port === '3001' || window.location.port === '') {
        // Production / Integrated Envs
        window.API_BASE = window.location.origin;
    } else {
        // Development Envs (Frontend on 5500, Backend on 3001)
        // This ensures that if I load http://192.168.1.50:5500, it hits http://192.168.1.50:3001
        window.API_BASE = `${window.location.protocol}//${window.location.hostname}:3001`;
    }

    console.log('API Base URL set to:', window.API_BASE);
})();
