(function () {
  var KEY = 'auraUser';
  var EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

  function getUser() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) { return null; }
      var user = JSON.parse(raw);
      return user && user.email ? user : null;
    } catch (error) {
      return null;
    }
  }

  function saveUser(user) {
    try {
      localStorage.setItem(KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      return false;
    }
  }

  function clearUser() {
    try {
      localStorage.removeItem(KEY);
    } catch (error) {}
  }

  function nameFromEmail(email) {
    var local = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    var name = local.replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
    return name || 'Customer';
  }

  function render() {
    var user = getUser();
    document.querySelectorAll('[data-auth="in"]').forEach(function (el) {
      el.hidden = !user;
    });
    document.querySelectorAll('[data-auth="out"]').forEach(function (el) {
      el.hidden = !!user;
    });
    document.querySelectorAll('[data-user-name]').forEach(function (el) {
      el.textContent = user ? user.name : '';
    });
    document.querySelectorAll('[data-user-email]').forEach(function (el) {
      el.textContent = user ? user.email : '';
    });
  }

  function setField(input, valid) {
    input.classList.toggle('is-valid', valid);
    input.classList.toggle('is-invalid', !valid);
    return valid;
  }

  function showAlert(box, type, text) {
    box.innerHTML = '';
    var alert = document.createElement('div');
    alert.className = 'alert alert-' + type;
    alert.setAttribute('role', 'alert');
    alert.textContent = text;
    box.appendChild(alert);
  }

  function initSigninForm() {
    var form = document.getElementById('signinForm');
    if (!form) { return; }

    var email = document.getElementById('siEmail');
    var password = document.getElementById('siPassword');
    var toggle = document.getElementById('siToggle');
    var box = document.getElementById('siAlert');

    function checkEmail() {
      return setField(email, EMAIL_REGEX.test(email.value.trim()));
    }

    function checkPassword() {
      return setField(password, password.value.length >= 6);
    }

    email.addEventListener('input', checkEmail);
    email.addEventListener('blur', checkEmail);
    password.addEventListener('input', checkPassword);
    password.addEventListener('blur', checkPassword);

    toggle.addEventListener('click', function () {
      var hidden = password.type === 'password';
      password.type = hidden ? 'text' : 'password';
      toggle.textContent = hidden ? 'Hide' : 'Show';
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var okEmail = checkEmail();
      var okPassword = checkPassword();

      if (!okEmail || !okPassword) {
        showAlert(box, 'danger', 'Please fix the highlighted fields and try again.');
        (okEmail ? password : email).focus();
        return;
      }

      var cleanEmail = email.value.trim().toLowerCase();
      var saved = saveUser({
        name: nameFromEmail(cleanEmail),
        email: cleanEmail,
        signedInAt: new Date().toISOString()
      });

      if (!saved) {
        showAlert(box, 'danger', 'Your browser does not allow saving data, so sign-in cannot be kept.');
        return;
      }

      form.reset();
      form.querySelectorAll('.is-valid, .is-invalid').forEach(function (el) {
        el.classList.remove('is-valid', 'is-invalid');
      });
      box.innerHTML = '';
      render();
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-signout]');
    if (!button) { return; }
    clearUser();
    render();
  });

  window.addEventListener('storage', function (event) {
    if (event.key === KEY) { render(); }
  });

  document.addEventListener('DOMContentLoaded', function () {
    initSigninForm();
    render();
  });
})();
