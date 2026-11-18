
(function () {
  'use strict';

  var BASE_URL = 'https://dummyjson.com';
  var PAGE_SIZE = 12;

  var grid = document.getElementById('apiGrid');
  if (!grid) return;

  var searchInput = document.getElementById('apiSearch');
  var categorySelect = document.getElementById('apiCategory');
  var sortSelect = document.getElementById('apiSort');
  var refreshButton = document.getElementById('apiRefresh');
  var moreButton = document.getElementById('apiMore');
  var statusBox = document.getElementById('apiStatus');
  var countBox = document.getElementById('apiCount');
  var modal = document.getElementById('apiModal');
  var modalTitle = document.getElementById('apiModalTitle');
  var modalBody = document.getElementById('apiModalBody');

  var state = {
    skip: 0,
    total: 0,
    shown: 0,
    requestId: 0,
    loading: false
  };

  var searchTimer = null;

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      var entities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };

      return entities[char];
    });
  }

  function formatPrice(value) {
    var price = Number(value);

    if (!Number.isFinite(price)) {
      return 'Price unavailable';
    }

    return '$' + price.toFixed(2);
  }

  function requestData(url) {
    var controller = new AbortController();

    var timeout = setTimeout(function () {
      controller.abort();
    }, 10000);

    return fetch(url, { signal: controller.signal })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Server error: ' + response.status);
        }

        return response.json().catch(function () {
          throw new Error('The server returned invalid data.');
        });
      })
      .catch(function (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please try again.');
        }

        if (error instanceof TypeError) {
          throw new Error('Connection failed. Check your internet.');
        }

        throw error;
      })
      .finally(function () {
        clearTimeout(timeout);
      });
  }

  function getSortParams() {
    var value = sortSelect.value;

    if (!value) return '';

    var parts = value.split('-');

    return '&sortBy=' + parts[0] + '&order=' + parts[1];
  }

  function createUrl(skip) {
    var search = searchInput.value.trim();
    var category = categorySelect.value;

    if (search) {
      return BASE_URL + '/products/search?q=' +
        encodeURIComponent(search) +
        '&limit=0' + getSortParams();
    }

    if (category) {
      return BASE_URL + '/products/category/' +
        encodeURIComponent(category) +
        '?limit=' + PAGE_SIZE +
        '&skip=' + skip + getSortParams();
    }

    return BASE_URL + '/products?limit=' +
      PAGE_SIZE + '&skip=' + skip + getSortParams();
  }

  function showStatus(type, message, retry) {
    if (!message) {
      statusBox.innerHTML = '';
      return;
    }

    var content =
      '<div class="alert alert-' + type +
      ' d-flex flex-wrap align-items-center justify-content-between gap-2 mb-0" role="alert">' +
      '<span>' + escapeHtml(message) + '</span>';

    if (retry) {
      content +=
        '<button type="button" class="btn btn-sm btn-outline-danger" id="apiRetry">' +
        'Try again</button>';
    }

    content += '</div>';

    statusBox.innerHTML = content;

    var retryButton = document.getElementById('apiRetry');

    if (retryButton) {
      retryButton.addEventListener('click', function () {
        loadProducts(true);
      });
    }
  }

  function setLoading(value) {
    state.loading = value;

    refreshButton.disabled = value;
    moreButton.disabled = value;

    grid.setAttribute('aria-busy', value ? 'true' : 'false');

    if (value) {
      statusBox.innerHTML =
        '<div class="d-flex align-items-center gap-2">' +
        '<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>' +
        '<span>Loading products...</span></div>';
    }
  }

  function createProductCard(product) {
    var title = product.title || 'Untitled product';
    var image = product.thumbnail || '';
    var category = String(product.category || '').replace(/-/g, ' ');
    var rating = product.rating != null ? product.rating : '-';

    return '<article class="api-card">' +
      '<img src="' + escapeHtml(image) +
      '" alt="' + escapeHtml(title) + '" loading="lazy">' +
      '<h3>' + escapeHtml(title) + '</h3>' +
      '<p class="api-meta">' + escapeHtml(category) +
      ' &middot; rating ' + escapeHtml(rating) + '</p>' +
      '<p class="price">' + formatPrice(product.price) + '</p>' +
      '<button type="button" class="btn btn-success btn-sm" data-product-id="' +
      escapeHtml(product.id) + '">Details</button>' +
      '</article>';
  }

  function updateCount() {
    if (!state.total) {
      countBox.textContent = '';
      return;
    }

    countBox.textContent =
      'Showing ' + state.shown + ' of ' + state.total + ' products';
  }

  function loadProducts(reset) {
    if (state.loading && !reset) return;

    if (reset) {
      state.skip = 0;
      state.shown = 0;
      state.total = 0;
      grid.innerHTML = '';
    }

    var requestId = ++state.requestId;
    var search = searchInput.value.trim();
    var category = categorySelect.value;

    setLoading(true);
    moreButton.hidden = true;

    requestData(createUrl(state.skip))
      .then(function (data) {
        if (requestId !== state.requestId) return;

        var products = Array.isArray(data.products)
          ? data.products
          : [];

        if (search && category) {
          products = products.filter(function (product) {
            return product.category === category;
          });
        }

        if (search) {
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

          showStatus(
            'info',
            'No products found. Try another search or category.',
            false
          );

          return;
        }

        var cards = products.map(createProductCard).join('');

        if (reset || search) {
          grid.innerHTML = cards;
        } else if (cards) {
          grid.insertAdjacentHTML('beforeend', cards);
        }

        showStatus('', '', false);
        updateCount();

        moreButton.hidden =
          !!search || state.shown >= state.total;
      })
      .catch(function (error) {
        if (requestId !== state.requestId) return;

        if (!grid.children.length) {
          countBox.textContent = '';
        }

        showStatus(
          'danger',
          error.message || 'Could not load products.',
          true
        );

        moreButton.hidden = true;
      })
      .finally(function () {
        if (requestId === state.requestId) {
          setLoading(false);
        }
      });
  }

  function loadCategories() {
    requestData(BASE_URL + '/products/categories')
      .then(function (categories) {
        if (!Array.isArray(categories)) return;

        var fragment = document.createDocumentFragment();

        categories.forEach(function (item) {
          var slug = typeof item === 'string'
            ? item
            : item.slug;

          var name = typeof item === 'string'
            ? item
            : (item.name || item.slug);

          if (!slug) return;

          var option = document.createElement('option');

          option.value = slug;
          option.textContent = String(name || slug).replace(/-/g, ' ');

          fragment.appendChild(option);
        });

        categorySelect.appendChild(fragment);
      })
      .catch(function () {
        categorySelect.title = 'Categories could not be loaded';
      });
  }

  function showProductDetails(productId) {
    if (!modal || !window.bootstrap) return;

    modalTitle.textContent = 'Loading...';

    modalBody.innerHTML =
      '<div class="text-center py-4">' +
      '<span class="spinner-border" aria-hidden="true"></span>' +
      '</div>';

    window.bootstrap.Modal.getOrCreateInstance(modal).show();

    requestData(BASE_URL + '/products/' + encodeURIComponent(productId))
      .then(function (product) {
        modalTitle.textContent = product.title || 'Product details';

        var availability = product.availabilityStatus
          ? escapeHtml(product.availabilityStatus)
          : 'Unknown';

        modalBody.innerHTML =
          '<img class="api-modal-img mb-3" src="' +
          escapeHtml(product.thumbnail || '') +
          '" alt="' + escapeHtml(product.title || 'Product') + '">' +
          '<p>' + escapeHtml(product.description || '') + '</p>' +
          '<ul class="list-unstyled mb-0">' +
          '<li><strong>Price:</strong> ' + formatPrice(product.price) + '</li>' +
          '<li><strong>Brand:</strong> ' +
          escapeHtml(product.brand || 'No brand') + '</li>' +
          '<li><strong>Category:</strong> ' +
          escapeHtml(String(product.category || '').replace(/-/g, ' ')) + '</li>' +
          '<li><strong>Rating:</strong> ' +
          escapeHtml(product.rating != null ? product.rating : '-') + ' / 5</li>' +
          '<li><strong>Availability:</strong> ' + availability + '</li>' +
          '</ul>';
      })
      .catch(function (error) {
        modalTitle.textContent = 'Error';

        modalBody.innerHTML =
          '<div class="alert alert-danger mb-0" role="alert">' +
          escapeHtml(error.message || 'Could not load product details.') +
          '</div>';
      });
  }

  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(function () {
      loadProducts(true);
    }, 400);
  });

  categorySelect.addEventListener('change', function () {
    loadProducts(true);
  });

  sortSelect.addEventListener('change', function () {
    loadProducts(true);
  });

  refreshButton.addEventListener('click', function () {
    loadProducts(true);
  });

  moreButton.addEventListener('click', function () {
    loadProducts(false);
  });

  grid.addEventListener('click', function (event) {
    var button = event.target.closest('[data-product-id]');

    if (button) {
      showProductDetails(button.getAttribute('data-product-id'));
    }
  });

  loadCategories();
  loadProducts(true);
})();
