/* ============ ZaxxCr4sher App Logic ============ */

const OWNER = { user: 'jaxxy', pass: 'zaxxy' };

let state = {
  currentUser: null,
  users: {},
  pairingTimer: null,
  bugTimer: null,
};

/* ---------- INIT ---------- */
function init() {
  loadUsers();
  const session = localStorage.getItem('zaxx_session');
  if (session) {
    const u = JSON.parse(session);
    state.currentUser = u;
    enterApp();
  }
  detectDevice();
}

function loadUsers() {
  try {
    state.users = JSON.parse(localStorage.getItem('zaxx_users') || '{}');
  } catch { state.users = {}; }
}

function saveUsers() {
  localStorage.setItem('zaxx_users', JSON.stringify(state.users));
}

/* ---------- AUTH ---------- */
function switchAuth(mode) {
  document.getElementById('loginForm').classList.toggle('active', mode === 'login');
  document.getElementById('registerForm').classList.toggle('active', mode === 'register');
}

function doRegister() {
  const u = document.getElementById('regUser').value.trim();
  const p = document.getElementById('regPass').value;
  const p2 = document.getElementById('regPass2').value;

  if (!u || !p) return toast('Isi semua field');
  if (p !== p2) return toast('Password tidak sama');
  if (u.length < 3) return toast('Username min 3 karakter');

  if (state.users[u] || u === OWNER.user) return toast('Username sudah dipakai');

  state.users[u] = {
    pass: p,
    avatar: 'assets/default-avatar.png',
    vip: 'Free',
    sender: '',
    created: Date.now(),
  };
  saveUsers();
  toast('Akun berhasil dibuat');
  switchAuth('login');
  document.getElementById('loginUser').value = u;
}

function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;

  if (!u || !p) return toast('Isi username dan password');

  // Owner check
  if (u === OWNER.user && p === OWNER.pass) {
    state.currentUser = {
      username: u,
      avatar: 'assets/default-avatar.png',
      vip: 'Owner',
      sender: '',
      isOwner: true,
    };
    localStorage.setItem('zaxx_session', JSON.stringify(state.currentUser));
    enterApp();
    toast('Welcome, Owner');
    return;
  }

  // User check
  const user = state.users[u];
  if (!user || user.pass !== p) return toast('Username atau password salah');

  state.currentUser = { username: u, ...user, isOwner: false };
  localStorage.setItem('zaxx_session', JSON.stringify(state.currentUser));
  enterApp();
  toast('Login berhasil');
}

function logout() {
  localStorage.removeItem('zaxx_session');
  state.currentUser = null;
  document.getElementById('appScreen').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  closeDrawer();
}

function enterApp() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
  refreshUI();
  goPage('lobby');
}

function refreshUI() {
  const u = state.currentUser;
  if (!u) return;
  document.getElementById('drawerName').textContent = u.username;
  document.getElementById('drawerStatus').textContent = u.vip || 'Free User';
  document.getElementById('accUser').textContent = u.username;
  document.getElementById('accStatus').textContent = u.vip || 'Free';
  document.getElementById('accSender').textContent = u.sender || '-';
  document.getElementById('senderInfo').textContent = u.sender || 'Belum terhubung';
  if (u.avatar) {
    document.getElementById('topAvatar').src = u.avatar;
    document.getElementById('drawerAvatar').src = u.avatar;
    document.getElementById('accountAvatar').src = u.avatar;
  }
}

/* ---------- AVATAR ---------- */
function changeAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    state.currentUser.avatar = ev.target.result;
    persistUser();
    refreshUI();
    toast('Foto profil diperbarui');
  };
  reader.readAsDataURL(file);
}

function persistUser() {
  const u = state.currentUser;
  if (u.isOwner) {
    localStorage.setItem('zaxx_session', JSON.stringify(u));
    return;
  }
  if (state.users[u.username]) {
    state.users[u.username] = {
      ...state.users[u.username],
      avatar: u.avatar,
      vip: u.vip,
      sender: u.sender,
    };
    saveUsers();
  }
  localStorage.setItem('zaxx_session', JSON.stringify(u));
}

/* ---------- RESET PASSWORD ---------- */
function openResetPass() {
  if (state.currentUser.isOwner) return toast('Owner tidak perlu reset');
  document.getElementById('resetModal').classList.remove('hidden');
}
function closeResetPass() {
  document.getElementById('resetModal').classList.add('hidden');
  document.getElementById('oldPass').value = '';
  document.getElementById('newPass').value = '';
}
function saveResetPass() {
  const oldP = document.getElementById('oldPass').value;
  const newP = document.getElementById('newPass').value;
  const u = state.currentUser;

  if (!state.users[u.username]) return toast('User tidak ditemukan');
  if (state.users[u.username].pass !== oldP) return toast('Password lama salah');
  if (newP.length < 4) return toast('Password baru min 4 karakter');

  state.users[u.username].pass = newP;
  saveUsers();
  closeResetPass();
  toast('Password berhasil direset');
}

/* ---------- NAV ---------- */
function goPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });

  closeDrawer();
  document.getElementById('pageContainer').scrollTop = 0;
}

/* ---------- DRAWER ---------- */
function toggleDrawer() {
  const d = document.getElementById('drawer');
  const b = document.getElementById('drawerBackdrop');
  d.classList.toggle('open');
  b.classList.toggle('show');
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerBackdrop').classList.remove('show');
}

/* ---------- DEVICE DETECT ---------- */
function detectDevice() {
  const el = document.getElementById('deviceInfo');
  if (!el) return;
  const ua = navigator.userAgent;
  let name = 'Unknown';
  if (/Android/i.test(ua)) name = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) name = 'iOS';
  else if (/Windows/i.test(ua)) name = 'Windows';
  else if (/Mac/i.test(ua)) name = 'macOS';
  else if (/Linux/i.test(ua)) name = 'Linux';
  const w = window.innerWidth;
  el.textContent = `${name} — ${w}px`;
}

/* ---------- SENDER PAIRING (SIMULATED) ---------- */
function startPairing() {
  const num = document.getElementById('senderNumber').value.trim();
  if (!num || num.length < 8) return toast('Nomor tidak valid');

  const box = document.getElementById('pairingBox');
  const loading = document.getElementById('pairingLoading');
  const codeBox = document.getElementById('pairingCode');

  box.classList.remove('hidden');
  loading.classList.remove('hidden');
  codeBox.classList.add('hidden');

  clearTimeout(state.pairingTimer);
  state.pairingTimer = setTimeout(() => {
    loading.classList.add('hidden');
    codeBox.classList.remove('hidden');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById('codeDigits').textContent = code;

    // save sender
    state.currentUser.sender = num;
    persistUser();
    refreshUI();
  }, 1800);
}

/* ---------- BUG MENU (SIMULATED) ---------- */
function runBug(name) {
  const target = document.getElementById('bugTarget').value.trim();
  if (!target || target.length < 8) return toast('Nomor target wajib diisi');

  const log = document.getElementById('bugLog');
  log.classList.remove('hidden');
  log.textContent = '';

  const steps = [
    `[+] Initializing ${name}...`,
    `[+] Target: ${target}`,
    `[+] Bypassing server check...`,
    `[+] Payload injected`,
    `[+] Executing ${name}...`,
    `[!] Menunggu respon target...`,
    `[+] Request sent — status: 200 OK`,
    `[!] ${name} selesai.`,
  ];

  let i = 0;
  clearInterval(state.bugTimer);
  state.bugTimer = setInterval(() => {
    if (i >= steps.length) {
      clearInterval(state.bugTimer);
      return;
    }
    log.textContent += steps[i] + '\n';
    log.scrollTop = log.scrollHeight;
    i++;
  }, 450);

  toast(`${name} dijalankan`);
}

/* ---------- VIP (SIMULATED) ---------- */
function buyVIP(tier) {
  toast(`Order ${tier} dibuat — hubungi admin untuk pembayaran`);
}

/* ---------- REDEEM ---------- */
const VALID_CODES = {
  'ZAXX-PREMIUM': 'Premium',
  'ZAXX-GOD': 'God Only',
  'ZAXX-RESELLER': 'Reseller',
};

function redeemCode() {
  const code = document.getElementById('redeemCode').value.trim().toUpperCase();
  const msg = document.getElementById('redeemMsg');
  if (!code) return toast('Masukkan kode');

  if (VALID_CODES[code]) {
    state.currentUser.vip = VALID_CODES[code];
    persistUser();
    refreshUI();
    msg.style.color = '#22c55e';
    msg.textContent = `Berhasil! Status VIP: ${VALID_CODES[code]}`;
    toast('Kode berhasil diredeem');
    document.getElementById('redeemCode').value = '';
  } else {
    msg.style.color = '#ef4444';
    msg.textContent = 'Kode tidak valid';
  }
}

/* ---------- CHAT ROOM (LOCAL) ---------- */
function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const box = document.getElementById('chatBox');
  const msg = document.createElement('div');
  msg.className = 'chat-msg me';
  msg.textContent = text;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
  input.value = '';

  // simulated auto-reply
  setTimeout(() => {
    const reply = document.createElement('div');
    reply.className = 'chat-msg other';
    reply.textContent = 'Pesan diterima.';
    box.appendChild(reply);
    box.scrollTop = box.scrollHeight;
  }, 900);
}

/* ---------- TOAST ---------- */
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- PREVENT ZOOM & COPY ---------- */
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => {
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    e.preventDefault();
  }
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['c', 'u', 's'].includes(e.key.toLowerCase())) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  }
});

// double-tap zoom prevention
let lastTouch = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouch <= 300) e.preventDefault();
  lastTouch = now;
}, { passive: false });

/* ---------- BOOT ---------- */
init();