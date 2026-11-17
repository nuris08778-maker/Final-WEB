(function () {
  'use strict';

  var BASE = 'https://dummyjson.com';
  var PAGE_SIZE = 12;

  var grid = document.getElementById('apiGrid');
  if (!grid) { return; }

  var searchInput = document.getElementById('apiSearch');
  var categorySelect = document.getElementById('apiCategory');
  var sortSelect = document.getElementById('apiSort');
  var refreshButton = document.getElementById('apiRefresh');
  var moreButton = document.getElementById('apiMore');
  var statusBox = document.getElementById('apiStatus');
  var countBox = document.getElementById('apiCount');
  var modalEl = document.getElementById('apiModal');
  var modalTitle = document.getElementById('apiModalTitle');
  var modalBody = document.getElementById('apiModalBody');

  var state = { skip: 0, total: 0, shown: 0, requestId: 0 };
  var debounceTimer = null;

  function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function formatPrice(value) {
    return '$' + Number(value).toFixed(2);
  }

  function fetchJson(url) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 10000);
    return fetch(url, { signal: controller.signal })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('The server answered with status ' + response.status + '.');
        }
        return response.json();
      })
      .catch(function (error) {
        if (error.name === 'AbortError') {
          throw new Error('The request took too long. Please check your connection.');
        }
        if (error instanceof TypeError) {
          throw new Error('Could not reach the product service. Please check your connection.');
        }
        throw error;
      })
      .finally(function () { clearTimeout(timer); });
  }

  function sortParams() {
    var value = sortSelect.value;
    if (!value) { return ''; }
    var parts = value.split('-');
    return '&sortBy=' + parts[0] + '&order=' + parts[1];
  }

  function buildUrl(skip) {
    var query = searchInput.value.trim();
    var category = categorySelect.value;
    if (query) {
      return BASE + '/products/search?q=' + encodeURIComponent(query) + '&limit=0' + sortParams();
    }
    if (category) {
      return BASE + '/products/category/' + encodeURIComponent(category) +
        '?limit=' + PAGE_SIZE + '&skip=' + skip + sortParams();
    }
    return BASE + '/products?limit=' + PAGE_SIZE + '&skip=' + skip + sortParams();
  }

  function setStatus(type, message, withRetry) {
    if (!message) {
      statusBox.innerHTML = '';
      return;
    }
    var html = '<div class="alert alert-' + type + ' d-flex flex-wrap align-items-center justify-content-between gap-2 mb-0" role="alert">' +
      '<span>' + escapeHtml(message) + '</span>';
    if (withRetry) {
      html += '<button type="button" class="btn btn-sm btn-outline-danger" id="apiRetry">Try again</button>';
    }
    html += '</div>';
    statusBox.innerHTML = html;
    var retry = document.getElementById('apiRetry');
    if (retry) {
      retry.addEventListener('click', function () { load(true); });
    }
  }

  function setLoading(isLoading) {
    refreshButton.disabled = isLoading;
    moreButton.disabled = isLoading;
    if (isLoading) {
      statusBox.innerHTML = '<div class="d-flex align-items-center gap-2"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span><span>Loading products...</span></div>';
    }
  }

  function cardHtml(product) {
    var image = product.thumbnail || '';
    return '<article class="api-card">' +
      '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.title) + '" loading="lazy">' +
      '<h3>' + escapeHtml(product.title) + '</h3>' +
      '<p class="api-meta">' + escapeHtml(String(product.category || '').replace(/-/g, ' ')) +
      ' &middot; rating ' + escapeHtml(product.rating != null ? product.rating : '-') + '</p>' +
      '<p class="price">' + formatPrice(product.price) + '</p>' +
      '<button type="button" class="btn btn-success btn-sm" data-product-id="' + escapeHtml(product.id) + '">Details</button>' +
      '</article>';
  }

  function updateCount() {
    if (!state.total) {
      countBox.textContent = '';
      return;
    }
    countBox.textContent = 'Showing ' + state.shown + ' of ' + state.total + ' products';
  }

  function load(reset) {
    if (reset) {
      state.skip = 0;
      state.shown = 0;
      grid.innerHTML = '';
    }
    var id = ++state.requestId;
    var query = searchInput.value.trim();
    var category = categorySelect.value;

    setLoading(true);
    moreButton.hidden = true;

    fetchJson(buildUrl(state.skip))
      .then(function (data) {
        if (id !== state.requestId) { return; }
        var products = Array.isArray(data.products) ? data.products : [];

        if (query && category) {
          products = products.filter(function (item) { return item.category === category; });
        }

        if (query) {
          state.total = products.length;
          state.shown = products.length;
          state.skip = products.length;
        } else {
          state.total = data.total || 0;
          state.skip += products.length;
          state.shown += products.length;
        }

        if (!products.length && !state.shown) {
          grid.innerHTML = '';
          countBox.textContent = '';
          setStatus('info', 'No products found. Try another search or category.', false);
          return;
        }

        var html = products.map(cardHtml).join('');
        if (reset || query) {
          grid.innerHTML = html;
        } else {
          grid.insertAdjacentHTML('beforeend', html);
        }

        setStatus('', '', false);
        updateCount();
        moreButton.hidden = !!query || state.shown >= state.total;
      })
      .catch(function (error) {
        if (id !== state.requestId) { return; }
        if (!grid.children.length) { countBox.textContent = ''; }
        setStatus('danger', error.message || 'Something went wrong while loading products.', true);
        moreButton.hidden = true;
      })
      .finally(function () {
        if (id === state.requestId) {
          refreshButton.disabled = false;
          moreButton.disabled = false;
        }
      });
  }

  function loadCategories() {
    fetchJson(BASE + '/products/categories')
      .then(function (list) {
        if (!Array.isArray(list)) { return; }
        var fragment = document.createDocumentFragment();
        list.forEach(function (item) {
          var slug = typeof item === 'string' ? item : item.slug;
          var name = typeof item === 'string' ? item : (item.name || item.slug);
          if (!slug) { return; }
          var option = document.createElement('option');
          option.value = slug;
          option.textContent = name.replace(/-/g, ' ');
          fragment.appendChild(option);
        });
        categorySelect.appendChild(fragment);
      })
      .catch(function () {
        categorySelect.title = 'Categories could not be loaded';
      });
  }

  function showDetails(productId) {
    if (!modalEl || !window.bootstrap) { return; }
    modalTitle.textContent = 'Loading...';
    modalBody.innerHTML = '<div class="text-center py-4"><span class="spinner-border" aria-hidden="true"></span></div>';
    var modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    fetchJson(BASE + '/products/' + encodeURIComponent(productId))
      .then(function (p) {
        modalTitle.textContent = p.title;
        var stock = p.availabilityStatus ? escapeHtml(p.availabilityStatus) : 'Unknown';
        modalBody.innerHTML =
          '<img class="api-modal-img mb-3" src="' + escapeHtml(p.thumbnail || '') + '" alt="' + escapeHtml(p.title) + '">' +
          '<p>' + escapeHtml(p.description || '') + '</p>' +
          '<ul class="list-unstyled mb-0">' +
          '<li><strong>Price:</strong> ' + formatPrice(p.price) + '</li>' +
          '<li><strong>Brand:</strong> ' + escapeHtml(p.brand || 'No brand') + '</li>' +
          '<li><strong>Category:</strong> ' + escapeHtml(String(p.category || '').replace(/-/g, ' ')) + '</li>' +
          '<li><strong>Rating:</strong> ' + escapeHtml(p.rating != null ? p.rating : '-') + ' / 5</li>' +
          '<li><strong>Availability:</strong> ' + stock + '</li>' +
          '</ul>';
      })
      .catch(function (error) {
        modalTitle.textContent = 'Error';
        modalBody.innerHTML = '<div class="alert alert-danger mb-0" role="alert">' +
          escapeHtml(error.message || 'Could not load product details.') + '</div>';
      });
  }

  searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () { load(true); }, 400);
  });

  categorySelect.addEventListener('change', function () { load(true); });
  sortSelect.addEventListener('change', function () { load(true); });
  refreshButton.addEventListener('click', function () { load(true); });
  moreButton.addEventListener('click', function () { load(false); });

  grid.addEventListener('click', function (event) {
    var button = event.target.closest('[data-product-id]');
    if (button) { showDetails(button.getAttribute('data-product-id')); }
  });

  loadCategories();
  load(true);
})();
