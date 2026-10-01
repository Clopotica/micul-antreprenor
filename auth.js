/* Local classroom login for the static/offline game.
 * This browser-side gate is not server-side access control.
 * Password verifiers: PBKDF2-SHA256, 100,000 iterations, per-account random salt.
 */
(function () {
'use strict';

var ACCOUNTS = {
  "user01": {
    "salt": "df588774bde87f8de29cf7c4c0d8657a",
    "hash": "d2190dd3fe42be6ed32b1a6165554e0be27d852bbf5c4acbaa0c29f64694daa1"
  },
  "user02": {
    "salt": "327d2f79d206f5d16c09180be1279268",
    "hash": "4c0d3bc77d535a1e92cc1c94e5567e121a41c4a0edf7770a97785106c4c15303"
  },
  "user03": {
    "salt": "e399cf367883dcab8d591730218ece75",
    "hash": "eb67255d4357847c97b2a2ae704a7f1f72ac6d21a9d60fe175cca090d9848871"
  },
  "user04": {
    "salt": "65df6635b86dd6548addf930a4d384a4",
    "hash": "8026b9722c0c8bba9ff675b523d41db77470ff40e84f03f95b568f21a8a5a1c4"
  },
  "user05": {
    "salt": "b37362caf2bd5320375d596baa0a8161",
    "hash": "0cb738ee40341ca18c172afe7d06ad7f1fa0b17b6782ffd520cf620fdfb91bac"
  },
  "user06": {
    "salt": "a9fa433e60b73d8ca34b568ca8dd71d9",
    "hash": "3f3cfa4573b73968237319e9d40bd609aa0e0998d32eddc9fe3ccad2fccabefc"
  },
  "user07": {
    "salt": "f7368fc51b2424a9e289ac4e6d4f6251",
    "hash": "2b338fb58da16976c873bcbd08d081ad254f78efd84641b7de5be5eccd3819ea"
  },
  "user08": {
    "salt": "3190d97c98f4d5f2c98b698047c884e6",
    "hash": "0c96d84c8766acffd1151c5208f9f008ffbc9eb8888294241f9d460d26479c11"
  },
  "user09": {
    "salt": "5732354942375bbf65cb8686b7c787b7",
    "hash": "988b5df33b860b49cc239d11c116fe6ad61ab12d3c84242303cea207aab954ce"
  },
  "user10": {
    "salt": "15c4d9631fad3b739acb275c9e3b846c",
    "hash": "405c8dedcad606b22a4bb9b7093902593839b2775f895347de4ed4369ffe9214"
  },
  "user11": {
    "salt": "f3bf9d3270376bf1ebb13221a91447ea",
    "hash": "4ebe99ae82c8b820fb778427199d9504aa0d4eb6a8307605b895602450fb89af"
  },
  "user12": {
    "salt": "7c292039a4437334bb3a8ef49ab07ceb",
    "hash": "accdcfe8b636560365571346f043e4e5738891936098990fd2132272b5177df0"
  },
  "user13": {
    "salt": "739d307aec56beb633e5f30d29d38e50",
    "hash": "f1e6c371523ca7cfd33b3d85cefd81128a8d7ff085ff9ee1f057a1df4a22592f"
  },
  "user14": {
    "salt": "f2571d2c9a24d68e56335b7706dc7d73",
    "hash": "aa3ddee245758a1ea4e572447f7666a487ecc6d61cbffc2746fad5d3b3ab778c"
  },
  "user15": {
    "salt": "1b2e160eb2c49c54046bf3314a6d3248",
    "hash": "8f16238a99f7adf75a16c428c3db9a6d2897fbdf8b6b873ec5089fefbe1be6a0"
  },
  "user16": {
    "salt": "ae36ba81a05bd523f10f2d8f19658d96",
    "hash": "d2d3a449df856dc06385d3df53140e9314d734ee948e15c34e1d506fbfce2ef7"
  },
  "user17": {
    "salt": "50b21438a4017c99b12b50bdeb76a5a8",
    "hash": "8570c731f87c54414f464bb81002a3e6ae7476712075ea2477d5efcb53f3a18a"
  },
  "user18": {
    "salt": "8b5a40a90e54a693da1f0a9958a67bea",
    "hash": "5bf788840b7bdab5c4ad7938a5b3be4a6ca2d72841eddac9e9eac7092b9f1364"
  },
  "user19": {
    "salt": "1c0193f14cd6b7d1e4225650c1aafb31",
    "hash": "b5be8ad59a9abffe65635a84f8f7dd7f93e03a9f3415d3e788418a13a8ac54b0"
  },
  "user20": {
    "salt": "ddf62642a0ab0d29642e2cbd6c60d6b7",
    "hash": "bde3588b8910e7b145b7c72c7ea3e84cd0777229173d3d183b102b2184a22c83"
  }
};
var SESSION_KEY = 'littleFounder.user.v1';
var currentUser = null;
var busy = false;
var needsReload = false;
var errorKey = null;
var form = document.getElementById('loginForm');
var usernameInput = document.getElementById('loginUsername');
var passwordInput = document.getElementById('loginPassword');
var submit = document.getElementById('loginSubmit');
var error = document.getElementById('loginError');
var languageButtons = document.querySelectorAll('[data-login-lang]');

function isAccount(username) {
  return Object.prototype.hasOwnProperty.call(ACCOUNTS, username);
}
function bytes(hex) {
  return new Uint8Array(hex.match(/../g).map(function (pair) { return parseInt(pair, 16); }));
}
async function verify(username, password) {
  // Use the same work and error message for an unknown username.
  var account = isAccount(username) ? ACCOUNTS[username] : ACCOUNTS.user01;
  var key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  var result = await crypto.subtle.deriveBits({
    name: 'PBKDF2', salt: bytes(account.salt), iterations: 100000, hash: 'SHA-256'
  }, key, 256);
  var expected = bytes(account.hash);
  var difference = 0;
  new Uint8Array(result).forEach(function (value, i) { difference |= value ^ expected[i]; });
  return isAccount(username) && difference === 0;
}
window.AppAuth = Object.freeze({
  storageKey: function (key) {
    if (!currentUser) throw new Error('Sign in before accessing game saves.');
    return key + '.' + currentUser;
  }
});

function render() {
  applyStaticStrings();
  submit.textContent = t(needsReload ? 'auth.reload' : busy ? 'auth.checking' : 'auth.login');
  submit.disabled = busy;
  usernameInput.disabled = busy || needsReload;
  passwordInput.disabled = busy || needsReload;
  languageButtons.forEach(function (button) {
    button.classList.toggle('is-on', button.dataset.loginLang === LANG);
    button.setAttribute('aria-pressed', button.dataset.loginLang === LANG ? 'true' : 'false');
  });
  error.hidden = !errorKey;
  error.textContent = errorKey ? t(errorKey) : '';
}
function forgetSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
}
async function enterGame(username) {
  currentUser = username;
  try {
    await new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'game.js?v=20';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
    if (!window.BOB) throw new Error('Game initialization failed.');
    try { sessionStorage.setItem(SESSION_KEY, username); } catch (e) { /* In-memory login still works. */ }
    passwordInput.value = '';
    passwordInput.type = 'password';
    document.getElementById('showPassword').checked = false;
    document.getElementById('accountUsername').textContent = username;
    document.getElementById('loginScreen').hidden = true;
    document.getElementById('gameApp').hidden = false;
    document.getElementById('standName').focus();
  } catch (e) {
    currentUser = null;
    forgetSession();
    errorKey = 'auth.loadError';
    needsReload = true;
  }
}
form.addEventListener('submit', async function (event) {
  event.preventDefault();
  if (needsReload) { window.location.reload(); return; }
  if (busy) return;
  busy = true;
  errorKey = null;
  // Username is forgiving; passwords retain exact case and whitespace.
  var username = usernameInput.value.trim().toLowerCase();
  var password = passwordInput.value;
  render();
  try {
    if (!window.crypto || !window.crypto.subtle) {
      errorKey = 'auth.unavailable';
    } else if (await verify(username, password)) {
      await enterGame(username);
    } else {
      errorKey = 'auth.invalid';
      passwordInput.value = '';
    }
  } catch (e) {
    errorKey = 'auth.unavailable';
  } finally {
    busy = false;
    render();
    if (errorKey && !needsReload) passwordInput.focus();
  }
});
document.getElementById('showPassword').addEventListener('change', function (event) {
  passwordInput.type = event.target.checked ? 'text' : 'password';
});
languageButtons.forEach(function (button) {
  button.addEventListener('click', function () { setLang(button.dataset.loginLang); render(); });
});
document.getElementById('logoutButton').addEventListener('click', function () {
  forgetSession();
  // Reload stops simulation timers and removes the previous user's in-memory state.
  window.location.reload();
});
// A history restoration must not resurrect a page after this tab signed out.
window.addEventListener('pageshow', function (event) {
  if (event.persisted) window.location.reload();
});

async function boot() {
  var remembered;
  try { remembered = sessionStorage.getItem(SESSION_KEY); } catch (e) {}
  if (remembered && isAccount(remembered)) {
    busy = true;
    render();
    await enterGame(remembered);
    busy = false;
  } else {
    forgetSession();
  }
  render();
}
boot();
})();
