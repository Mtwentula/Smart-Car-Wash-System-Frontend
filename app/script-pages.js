// Theme toggle functionality
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const htmlElement = document.documentElement;

const API_BASE = localStorage.getItem('int216d:apiBase') || 'http://localhost:8080';
const ACCESS_TOKEN_KEY = 'int216d:accessToken';
const DEFAULT_PAYMENT_GATEWAY = 'SIMULATED';
let cachedMembershipPlans = [];

function readAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function writeAccessToken(token) {
  if (!token) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

async function apiRequest(path, options = {}) {
  const token = readAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_) {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

function ensureAuthModal() {
  if (document.getElementById('auth-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.style.cssText = 'position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:9999;padding:20px;';
  modal.innerHTML = `
    <div style="width:min(520px,100%);background:var(--panel);border:1px solid var(--panel-border);border-radius:16px;padding:24px;position:relative;">
      <button id="auth-close" type="button" style="position:absolute;top:12px;right:12px;border:0;background:transparent;color:var(--ink);font-size:20px;cursor:pointer;">x</button>
      <p style="margin:0 0 8px;font-size:12px;color:var(--metallic);letter-spacing:.08em;text-transform:uppercase;">Account</p>
      <h3 style="margin:0 0 16px;">Login or Register</h3>
      <form id="auth-form" style="display:grid;gap:12px;">
        <input id="auth-email" type="email" placeholder="Email" required style="width:100%;padding:12px 14px;background:transparent;border:1px solid var(--panel-border);border-radius:8px;color:var(--ink);" />
        <input id="auth-password" type="password" placeholder="Password" required style="width:100%;padding:12px 14px;background:transparent;border:1px solid var(--panel-border);border-radius:8px;color:var(--ink);" />
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button id="auth-login" type="button" class="pill-btn btn-primary" style="padding:10px 18px;">Login</button>
          <button id="auth-register" type="button" class="pill-btn btn-outline" style="padding:10px 18px;">Register</button>
        </div>
        <p id="auth-status" style="margin:0;color:var(--metallic);font-size:13px;"></p>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('#auth-close');
  const status = modal.querySelector('#auth-status');
  const email = modal.querySelector('#auth-email');
  const password = modal.querySelector('#auth-password');

  function closeModal() {
    modal.style.display = 'none';
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  modal.querySelector('#auth-login').addEventListener('click', async () => {
    status.textContent = 'Logging in...';
    try {
      const payload = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.value, password: password.value }),
      });
      writeAccessToken(payload?.data?.accessToken);
      status.textContent = 'Login successful. You can now book and subscribe.';
      hydrateLoginButtons();
      setTimeout(closeModal, 600);
    } catch (error) {
      status.textContent = error.message;
    }
  });

  modal.querySelector('#auth-register').addEventListener('click', async () => {
    status.textContent = 'Creating account...';
    try {
      await apiRequest('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: email.value, password: password.value }),
      });
      status.textContent = 'Account created. Check your email for OTP, then login.';
    } catch (error) {
      status.textContent = error.message;
    }
  });
}

function openAuthModal() {
  ensureAuthModal();
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'flex';
}

function hydrateLoginButtons() {
  const token = readAccessToken();
  const loginButtons = document.querySelectorAll('#login-btn');

  loginButtons.forEach((button) => {
    const isLoginLabel = (button.textContent || '').trim().toLowerCase() === 'login';
    if (!isLoginLabel) return;

    if (token) {
      button.textContent = 'Logout';
      button.setAttribute('href', '#');
      button.onclick = (event) => {
        event.preventDefault();
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        hydrateLoginButtons();
      };
      return;
    }

    button.textContent = 'Login';
    button.setAttribute('href', '#');
    button.onclick = (event) => {
      event.preventDefault();
      openAuthModal();
    };
  });
}

async function hydrateMembershipPlans() {
  const plansGrid = document.getElementById('membership-plans-grid');
  if (!plansGrid) return;

  try {
    const plans = await apiRequest('/api/v1/membership/plans/active', { method: 'GET' });
    if (!Array.isArray(plans) || plans.length === 0) {
      cachedMembershipPlans = [];
      populateUpgradePlanOptions();
      return;
    }

    cachedMembershipPlans = plans;
    populateUpgradePlanOptions();

    plansGrid.innerHTML = plans.map((plan) => `
      <div class="membership-card">
        <h3 class="card-title">${plan.name}</h3>
        <p class="card-desc">${plan.description || ''}</p>
        <div class="price-row">
          <div class="price-main">R${Number(plan.monthlyPrice || 0).toFixed(2)}</div>
          <div class="price-month">/month</div>
        </div>
        <ul class="feature-list">
          <li class="feature-item"><div class="feature-dot"></div><span>${plan.freeWashes || 0} free washes</span></li>
          <li class="feature-item"><div class="feature-dot"></div><span>${plan.creditsPerMonth || 0} monthly credits</span></li>
          <li class="feature-item"><div class="feature-dot"></div><span>${plan.discountPercentage || 0}% service discount</span></li>
        </ul>
        <button type="button" class="pill-btn join-btn" data-plan-id="${plan.id}">Join ${plan.name}</button>
      </div>
    `).join('');
  } catch (error) {
    const status = document.getElementById('membership-sync-status');
    if (status) {
      status.textContent = `Could not load live plans (${error.message}). Showing static plans.`;
    }
  }
}

function populateUpgradePlanOptions() {
  const select = document.getElementById('membership-upgrade-plan');
  if (!select) return;

  if (!Array.isArray(cachedMembershipPlans) || cachedMembershipPlans.length === 0) {
    select.innerHTML = '<option value="">No active plans available</option>';
    return;
  }

  select.innerHTML = cachedMembershipPlans
    .map((plan) => `<option value="${plan.id}">${plan.name} - R${Number(plan.monthlyPrice || 0).toFixed(2)}</option>`)
    .join('');
}

function bindMembershipActions() {
  const plansGrid = document.getElementById('membership-plans-grid');
  if (!plansGrid) return;

  plansGrid.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-plan-id]');
    if (!button) return;

    const status = document.getElementById('membership-sync-status');
    const planId = Number(button.getAttribute('data-plan-id'));
    if (!readAccessToken()) {
      if (status) status.textContent = 'Please login first to subscribe.';
      openAuthModal();
      return;
    }

    try {
      const payment = membershipPaymentPayload();
      if (status) status.textContent = 'Subscribing...';
      await apiRequest('/api/v1/membership/subscribe', {
        method: 'POST',
        body: JSON.stringify({ planId: planId, autoRenew: true, payment }),
      });
      await hydrateCurrentMembership();
      if (status) status.textContent = 'Membership subscribed successfully.';
    } catch (error) {
      if (status) status.textContent = error.message;
    }
  });
}

async function hydrateCurrentMembership() {
  const panel = document.getElementById('membership-current-summary');
  const status = document.getElementById('membership-current-status');
  if (!panel || !status) return;

  if (!readAccessToken()) {
    panel.innerHTML = '';
    status.textContent = 'Login to view your current membership details.';
    return;
  }

  try {
    const membership = await apiRequest('/api/v1/membership', { method: 'GET' });
    const planName = membership?.plan?.name || 'Unknown';
    const statusValue = membership?.status || 'UNKNOWN';
    const credits = membership?.creditsRemaining ?? 0;
    const days = membership?.daysUntilExpiry ?? 0;
    const expiry = membership?.expiryDate ? new Date(membership.expiryDate).toLocaleString() : 'N/A';

    panel.innerHTML = [
      { label: 'Plan', value: planName },
      { label: 'Status', value: statusValue },
      { label: 'Credits', value: String(credits) },
      { label: 'Days Left', value: String(days) },
      { label: 'Expires', value: expiry },
      { label: 'Payment Ref', value: membership?.latestPaymentReference || 'N/A' },
    ].map((item) => `
      <div style="border:1px solid var(--panel-border);border-radius:10px;padding:12px;">
        <p style="margin:0 0 4px;color:var(--metallic);font-size:12px;">${item.label}</p>
        <p style="margin:0;font-weight:600;font-size:14px;word-break:break-word;">${item.value}</p>
      </div>
    `).join('');

    status.textContent = 'Membership profile loaded.';
  } catch (error) {
    panel.innerHTML = '';
    status.textContent = error.message;
  }
}

function bindMembershipManagementActions() {
  const renewButton = document.getElementById('membership-renew-btn');
  const upgradeButton = document.getElementById('membership-upgrade-btn');
  const status = document.getElementById('membership-manage-status');

  if (renewButton) {
    renewButton.addEventListener('click', async () => {
      if (!readAccessToken()) {
        if (status) status.textContent = 'Please login first to renew your membership.';
        openAuthModal();
        return;
      }

      try {
        const payment = membershipPaymentPayload();
        if (status) status.textContent = 'Renewing membership...';

        await apiRequest('/api/v1/membership/renew', {
          method: 'POST',
          body: JSON.stringify({ payment }),
        });

        await hydrateCurrentMembership();
        if (status) status.textContent = 'Membership renewed successfully.';
      } catch (error) {
        if (status) status.textContent = error.message;
      }
    });
  }

  if (upgradeButton) {
    upgradeButton.addEventListener('click', async () => {
      if (!readAccessToken()) {
        if (status) status.textContent = 'Please login first to upgrade your membership.';
        openAuthModal();
        return;
      }

      const planSelect = document.getElementById('membership-upgrade-plan');
      const selectedPlanId = Number(planSelect?.value || 0);
      if (!selectedPlanId || Number.isNaN(selectedPlanId)) {
        if (status) status.textContent = 'Select a valid plan to upgrade.';
        return;
      }

      try {
        const payment = membershipPaymentPayload();
        if (status) status.textContent = 'Upgrading membership...';

        await apiRequest(`/api/v1/membership/upgrade/${selectedPlanId}`, {
          method: 'POST',
          body: JSON.stringify({ payment }),
        });

        await hydrateCurrentMembership();
        if (status) status.textContent = 'Membership upgraded successfully.';
      } catch (error) {
        if (status) status.textContent = error.message;
      }
    });
  }
}

function normalizedAddOnCodes(rawCodes) {
  return rawCodes
    .map((code) => String(code || '').trim())
    .filter((code) => code.length > 0)
    .map((code) => code.replace(/-/g, '_').toUpperCase());
}

function paymentPayloadFromForm(form) {
  const data = new FormData(form);
  const gateway = String(data.get('paymentGateway') || DEFAULT_PAYMENT_GATEWAY).trim().toUpperCase();
  const paymentMethodToken = String(data.get('paymentMethodToken') || '').trim();

  if (!paymentMethodToken) {
    throw new Error('Please provide a payment token to continue.');
  }

  return {
    gateway,
    paymentMethodToken,
  };
}

function membershipPaymentPayload() {
  const gatewayInput = document.getElementById('membership-payment-gateway');
  const tokenInput = document.getElementById('membership-payment-token');
  const gateway = String(gatewayInput?.value || DEFAULT_PAYMENT_GATEWAY).trim().toUpperCase();
  const paymentMethodToken = String(tokenInput?.value || '').trim();

  if (!paymentMethodToken) {
    throw new Error('Enter your membership payment token before subscribing.');
  }

  return {
    gateway,
    paymentMethodToken,
  };
}

function bookingPayloadFromForm(form, isMobile) {
  const data = new FormData(form);
  const date = data.get('preferredDate');
  const time = data.get('preferredTime');
  const location = isMobile ? data.get('serviceAddress') : data.get('location');
  const payment = paymentPayloadFromForm(form);

  return {
    serviceType: isMobile ? 'MOBILE' : 'BAY',
    packageCode: String(data.get('service') || '').toUpperCase(),
    fullName: data.get('fullName'),
    email: data.get('email'),
    phone: data.get('phone'),
    vehicleType: data.get('vehicleType'),
    location: location,
    scheduledAt: date && time ? `${date}T${time}:00` : null,
    notes: data.get('notes') || null,
    addOns: normalizedAddOnCodes(data.getAll('addOns')),
    payment,
  };
}

function bindBookingForm(formId, statusId, isMobile) {
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = bookingPayloadFromForm(form, isMobile);

    if (status) status.textContent = 'Submitting booking...';

    try {
      await apiRequest('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (status) status.textContent = 'Booking submitted successfully.';
      form.reset();
      return;
    } catch (error) {
      if (error.message.includes('404')) {
        if (status) status.textContent = 'Booking endpoint was not found. Ensure the latest booking-service is running via API gateway.';
        return;
      }
      if (status) status.textContent = `Booking failed: ${error.message}`;
    }
  });
}

// Initialize theme from localStorage
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  htmlElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
  if (theme === 'light') {
    themeToggleBtn.textContent = 'Dark';
  } else {
    themeToggleBtn.textContent = 'Light';
  }
}

function toggleTheme() {
  const currentTheme = htmlElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
}

themeToggleBtn.addEventListener('click', toggleTheme);

// Menu toggle functionality
const menuToggleBtn = document.getElementById('menu-toggle-btn');
const mainNav = document.getElementById('main-nav');
const navLinks = document.getElementById('main-nav-links');

menuToggleBtn.addEventListener('click', () => {
  const isOpen = mainNav.classList.contains('menu-open');
  if (isOpen) {
    mainNav.classList.remove('menu-open');
    menuToggleBtn.setAttribute('aria-expanded', 'false');
  } else {
    mainNav.classList.add('menu-open');
    menuToggleBtn.setAttribute('aria-expanded', 'true');
  }
});

// Close menu when link is clicked
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav.classList.remove('menu-open');
    menuToggleBtn.setAttribute('aria-expanded', 'false');
  });
});

// Scroll to top functionality
const brandLink = document.querySelector('.brand');
if (brandLink && brandLink.dataset.scrollTop === 'true') {
  brandLink.addEventListener('click', (e) => {
    if (brandLink.getAttribute('href') === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

// Initialize theme on page load
initTheme();
hydrateLoginButtons();
hydrateMembershipPlans();
hydrateCurrentMembership();
bindMembershipActions();
bindMembershipManagementActions();
bindBookingForm('bay-booking-form', 'bay-booking-status', false);
bindBookingForm('mobile-booking-form', 'mobile-booking-status', true);

// Draw iridescent canvas if present
const iridescentCanvas = document.getElementById('iridescent-canvas');
if (iridescentCanvas) {
  const ctx = iridescentCanvas.getContext('2d');
  const container = iridescentCanvas.parentElement;

  function resizeCanvas() {
    iridescentCanvas.width = container.offsetWidth;
    iridescentCanvas.height = container.offsetHeight;
  }

  function drawIridescent() {
    const width = iridescentCanvas.width;
    const height = iridescentCanvas.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    // Draw iridescent gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(18, 179, 166, 0.1)');
    gradient.addColorStop(0.5, 'rgba(18, 179, 166, 0.05)');
    gradient.addColorStop(1, 'rgba(18, 179, 166, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  resizeCanvas();
  drawIridescent();

  window.addEventListener('resize', () => {
    resizeCanvas();
    drawIridescent();
  });
}

// Draw beam canvas if present
const beamCanvas = document.getElementById('beam-canvas');
if (beamCanvas) {
  const ctx = beamCanvas.getContext('2d');
  const container = beamCanvas.parentElement;

  function resizeBeamCanvas() {
    beamCanvas.width = container.offsetWidth;
    beamCanvas.height = container.offsetHeight;
  }

  function drawBeam() {
    const width = beamCanvas.width;
    const height = beamCanvas.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    // Draw beam effect
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
    gradient.addColorStop(0, 'rgba(18, 179, 166, 0.15)');
    gradient.addColorStop(0.5, 'rgba(18, 179, 166, 0.05)');
    gradient.addColorStop(1, 'rgba(18, 179, 166, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  resizeBeamCanvas();
  drawBeam();

  window.addEventListener('resize', () => {
    resizeBeamCanvas();
    drawBeam();
  });
}

// Hero section background fade in
const heroBg = document.getElementById('hero-three');
if (heroBg) {
  setTimeout(() => {
    heroBg.classList.add('loaded');
  }, 100);
}

// Fade in hero content
const heroSubtitle = document.getElementById('hero-subtitle');
const heroCta = document.getElementById('hero-cta');

if (heroSubtitle) {
  setTimeout(() => {
    heroSubtitle.style.opacity = '1';
    heroSubtitle.style.transition = 'opacity 1s ease-out';
  }, 200);
}

if (heroCta) {
  setTimeout(() => {
    heroCta.style.opacity = '1';
    heroCta.style.transition = 'opacity 1s ease-out';
  }, 400);
}
