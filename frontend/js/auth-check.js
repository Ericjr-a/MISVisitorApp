document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("vra_token");

    // No token at all
    if (!token) {
        window.location.replace("/html/login.html");
        return;
    }

    try {
        const API_BASE = window.API_BASE || "http://127.0.0.1:3001";

        const res = await fetch(`${API_BASE}/users/verify-token`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) {
            localStorage.removeItem("vra_token");
            localStorage.removeItem("vra_user");
            window.location.replace("/html/login.html");
            return;
        }

        // prevent cached back-navigation from exposing protected pages
        window.history.replaceState(null, "", window.location.href);
    } catch (error) {
        localStorage.removeItem("vra_token");
        localStorage.removeItem("vra_user");
        window.location.replace("/html/login.html");
    }
});

// Handle back-forward cache
window.addEventListener("pageshow", function (event) {
    const token = localStorage.getItem("vra_token");
    if (!token) {
        window.location.replace("/html/login.html");
    }
});