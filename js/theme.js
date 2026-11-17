(function () {
  var KEY = 'auraTheme';
  var root = document.documentElement;

  function readSaved() {
    try {
      var value = localStorage.getItem(KEY);
      return value === 'dark' || value === 'light' ? value : 'light';
    } catch (error) {
      return 'light';
    }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
  }

  function current() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  apply(readSaved());

  document.addEventListener('DOMContentLoaded', function () {
    var button = document.getElementById('themeToggle');
    if (!button) { return; }

    function updateButton() {
      var dark = current() === 'dark';
      button.textContent = dark ? '\u2600 Light' : '\u263E Dark';
      button.setAttribute('aria-pressed', String(dark));
    }

    button.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch (error) {}
      updateButton();
    });

    window.addEventListener('storage', function (event) {
      if (event.key === KEY) {
        apply(readSaved());
        updateButton();
      }
    });

    updateButton();
  });
})();
