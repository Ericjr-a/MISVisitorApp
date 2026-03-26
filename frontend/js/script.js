// Volta River Authority Login Application
document.addEventListener("DOMContentLoaded", function () {
  console.log("VRA Login Application initialized");

  // API base — change this if your backend runs on a different host/port.
  // Default matches the backend .env used in this project (PORT=5000).
  const API_BASE = window.API_BASE || 'http://127.0.0.1:3001';

  // Get form elements
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  // Support possible HTML typos: some pages use `password` and others `passwordd`
  const passwordInput = document.getElementById("password") || document.getElementById("passwordd");
  const rememberMeCheckbox = document.getElementById("rememberMe");
  const loginBtn = document.querySelector(".login-btn");

  // Error elements
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError") || document.getElementById("passworddError"); // support typo in HTML

  const loadingSpinner = document.getElementById("loadingSpinner");

  // Email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Load saved credentials
  loadSavedCredentials();

  // Validation
  function validateEmail(email) {
    if (!email.trim()) return "Email is required";
    if (!emailPattern.test(email)) return "Please enter a valid email";
    return "";
  }

  function validatePassword(password) {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  }

  function showError(element, message) {
    element.textContent = message;
    element.classList.add("show");
  }

  function hideError(element) {
    element.textContent = "";
    element.classList.remove("show");
  }

  // Real-time validation
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      const error = validateEmail(emailInput.value);
      error ? showError(emailError, error) : hideError(emailError);
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const error = validatePassword(passwordInput.value);
      error ? showError(passwordError, error) : hideError(passwordError);
    });
  }

  // Handle submit
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      const emailErr = validateEmail(email);
      const passwordErr = validatePassword(password);

      emailErr ? showError(emailError, emailErr) : hideError(emailError);
      passwordErr
        ? showError(passwordError, passwordErr)
        : hideError(passwordError);

      // ✅ Fixed condition
      if (!emailErr && !passwordErr) {
        await performLogin(email, password);
      }
    });
  }

  // ✅ Login request
  async function performLogin(email, password) {
    loginBtn.disabled = true;
    loginBtn.classList.add("loading");

    try {
      const response = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passwordd: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(passwordError, data.message || "Invalid email or password");
        showLoginError();
        return;
      }

      if (data.token) {
        localStorage.setItem("vra_token", data.token);
        localStorage.setItem("vra_role", data.role_name);
      }

      // Store profile data
      localStorage.setItem('profileData', JSON.stringify({
        fullName: data.username,
        email: data.email
      }));

      // store profile if provided (legacy or detailed)
      if (data.profile) {
        if (data.profile.avatar) {
          localStorage.setItem('profilePicture', API_BASE + data.profile.avatar);
        }
      }


      showSuccessMessage();

      setTimeout(() => {
        window.location.href = "../html/index.html";
      }, 1000);
    } catch (err) {
      showError(passwordError, "Unable to connect to server");
    } finally {
      loginBtn.disabled = false;
      loginBtn.classList.remove("loading");
    }
  }

  // Password visibility toggle (for login)
  document.addEventListener('click', function (event) {
    const btn = event.target.closest && event.target.closest('.toggle-password');
    if (!btn) return;
    const targetId = btn.getAttribute('data-target');
    const passwordInputEl = document.getElementById(targetId);
    const icon = btn.querySelector('i');
    if (!passwordInputEl) return;
    if (passwordInputEl.type === 'password') {
      passwordInputEl.type = 'text';
      if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
      btn.setAttribute('aria-label', 'Hide password');
    } else {
      passwordInputEl.type = 'password';
      if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
      btn.setAttribute('aria-label', 'Show password');
    }
  });

  function loadSavedCredentials() {
    if (localStorage.getItem("vra_remember_me") === "true") {
      emailInput.value = localStorage.getItem("vra_email");
      rememberMeCheckbox.checked = true;
    }
  }

  function showSuccessMessage() {
    document.querySelector(".login-card").style.borderColor = "#27ae60";
  }

  function showLoginError() {
    const card = document.querySelector(".login-card");
    card.style.animation = "shake 0.5s ease";
    setTimeout(() => (card.style.animation = ""), 600);
  }

  // Forgot Password Modal Functionality
  const forgotPasswordModal = document.getElementById('forgotPasswordModal');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const closeForgotPasswordModal = document.getElementById('closeForgotPasswordModal');

  // Open forgot password modal
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function (e) {
      e.preventDefault();
      forgotPasswordModal.style.display = 'flex';
    });
  }

  // Close forgot password modal
  if (closeForgotPasswordModal) {
    closeForgotPasswordModal.addEventListener('click', function () {
      forgotPasswordModal.style.display = 'none';
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', function (event) {
    if (event.target === forgotPasswordModal) {
      forgotPasswordModal.style.display = 'none';
    }
  });

  // Handle forgot password form submission
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const email = document.getElementById('resetEmail').value.trim();

      // Validate email
      if (!email) {
        alert('Please enter your email address');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
      }

      // Here you would send the email to the backend to generate and send OTP
      // For now, we'll simulate success
      alert(`OTP sent to ${email}. Please check your email.`);

      // Close modal
      forgotPasswordModal.style.display = 'none';

      // Reset form
      forgotPasswordForm.reset();
    });
  }
});
