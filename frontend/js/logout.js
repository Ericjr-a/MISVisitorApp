document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();

            localStorage.removeItem("vra_token");
            localStorage.removeItem("vra_user");

            window.location.replace("/html/login.html");
        });
    }
});