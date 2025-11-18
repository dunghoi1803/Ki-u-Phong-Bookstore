/**
 * product.js
 * Trang danh sách sản phẩm – bản viết lại, giữ nguyên layout/màu sắc,
 * đơn giản hóa logic: mặc định hiển thị toàn bộ sách (theo trang),
 * lọc theo từ khóa, danh mục, khoảng giá.
 */

const PRODUCT_CONFIG = {
  categoriesEndpoint: "/categories",
  booksEndpoint: "/books",
};

document.addEventListener("DOMContentLoaded", () => {
  const categoryFilterBox = document.getElementById("categoryFilter");
  const publishersBox = document.getElementById("publisherFilter");
  const authorsBox = document.getElementById("authorFilter");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const applyBtn = document.getElementById("applyFilters");
  const resetBtn = document.getElementById("resetFilters");
  const productGrid = document.getElementById("productGrid");
  const resultCount = document.getElementById("resultCount");
  const sortBy = document.getElementById("sortBy");
  const limitSelect = document.getElementById("limit");
  const pagination = document.getElementById("pagination");
  const breadcrumbCurrent = document.getElementById("breadcrumbCurrent");
   const searchKeywordInfo = document.getElementById("searchKeywordInfo");
   const searchKeywordText = document.getElementById("searchKeywordText");
  const publisherSearchInput = document.getElementById("publisherSearch");
  const authorSearchInput = document.getElementById("authorSearch");
  const categorySearchInput = document.getElementById("categorySearch");

  const DEFAULT_LIMIT = parseInt(limitSelect?.value || "24", 10);

  const state = {
    search: "",
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    language: "",
    inStock: false,
    minRating: null,
    publisher: "",
    author: "",
    page: 1,
    limit: DEFAULT_LIMIT,
    sort: sortBy ? sortBy.value : "relevance",
  };

  let categoriesCache = [];

  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("ma_the_loai")) {
      state.categoryId = params.get("ma_the_loai");
    }
    if (params.has("q")) {
      state.search = params.get("q") || "";
      if (searchInput) searchInput.value = state.search;
    }
    updateSearchKeywordLabel();
  }

  function updateSearchKeywordLabel() {
    if (!searchKeywordInfo || !searchKeywordText) return;
    const kw = (state.search || "").trim();
    if (kw) {
      searchKeywordText.textContent = kw;
      searchKeywordInfo.style.display = "block";
    } else {
      searchKeywordText.textContent = "";
      searchKeywordInfo.style.display = "none";
    }
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
  }

  async function loadCategories() {
    if (!categoryFilterBox) return;
    categoryFilterBox.innerHTML = '<div class="loading">Đang tải danh mục...</div>';
    try {
      const data = await fetchJson(`${API_BASE}${API_V1_PREFIX}${PRODUCT_CONFIG.categoriesEndpoint}`);
      categoriesCache = Array.isArray(data) ? data : [];

      categoryFilterBox.innerHTML = "";

      const listContainer = document.createElement("div");
      listContainer.className = "scrollable-cat-list";

      const allLabel = document.createElement("label");
      allLabel.innerHTML = `
        <input type="radio" name="categoryQuick" value="" ${state.categoryId ? "" : "checked"}>
        Tất cả
      `;
      listContainer.appendChild(allLabel);

      categoriesCache.forEach((c) => {
        const label = document.createElement("label");
        const value = String(c.ma_the_loai);
        const checked = state.categoryId && String(state.categoryId) === value ? "checked" : "";
        label.innerHTML = `
          <input type="radio" name="categoryQuick" value="${value}" ${checked}>
          ${escapeHtml(c.ten_the_loai)}
        `;
        listContainer.appendChild(label);
      });

      categoryFilterBox.appendChild(listContainer);

      if (categorySearchInput) {
        categoryFilterBox.appendChild(categorySearchInput);
      }

      document.querySelectorAll('input[name="categoryQuick"]').forEach((input) => {
        input.addEventListener("change", (e) => {
          const val = e.target.value;
          state.categoryId = val || null;
          state.page = 1;

          if (!val) {
            if (breadcrumbCurrent) breadcrumbCurrent.textContent = "Tất cả";
          } else {
            const found = categoriesCache.find((c) => String(c.ma_the_loai) === val);
            if (found && breadcrumbCurrent) {
              breadcrumbCurrent.textContent = found.ten_the_loai;
            }
          }
          loadBooks();
        });
      });
    } catch (err) {
      console.error("Lỗi tải danh mục:", err);
      categoryFilterBox.innerHTML =
        '<div class="loading" style="color:#c00;">Không tải được danh mục.</div>';
    }
  }

  function applyPriceFilterFromUI() {
    state.minPrice = null;
    state.maxPrice = null;
    const checked = document.querySelector('input[name="price"]:checked');
    if (checked && checked.value) {
      const [min, max] = checked.value.split("-").map((v) => v.trim());
      state.minPrice = Number(min);
      state.maxPrice = Number(max);
    }
  }

  function buildBooksQuery() {
    const params = new URLSearchParams();
    if (state.search) params.set("search", state.search);
    if (state.categoryId) params.set("category_id", state.categoryId);
    if (state.minPrice != null) params.set("min_price", String(state.minPrice));
    if (state.maxPrice != null) params.set("max_price", String(state.maxPrice));
    if (state.language) params.set("language", state.language);
    if (state.inStock) params.set("in_stock", "true");
    if (state.publisher) params.set("publisher_name", state.publisher);
    if (state.author) params.set("author_name", state.author);
    if (state.minRating != null) params.set("min_rating", String(state.minRating));
    if (state.sort) params.set("sort", state.sort);

    params.set("limit", String(state.limit));
    params.set("offset", String((state.page - 1) * state.limit));
    return params.toString();
  }

  function renderBooks(total, books) {
    if (!productGrid || !resultCount) return;

    resultCount.textContent = total;
    productGrid.innerHTML = "";

    if (!books.length) {
      productGrid.innerHTML =
        '<div class="card" style="text-align:center">Không tìm thấy sản phẩm phù hợp.</div>';
      return;
    }

    books.forEach((book) => {
      const card = document.createElement("article");
      card.className = "card";
      card.innerHTML = `
        <div class="thumb">
          <a href="/Front-end Khách hàng/chitietsach/book-detail.html?id=${encodeURIComponent(
            book.ma_sach
          )}">
            <img src="${
              book.anh_bia || "https://via.placeholder.com/140x200?text=No+Image"
            }" alt="${escapeHtml(book.ten_sach)}">
          </a>
        </div>
        <a href="/Front-end Khách hàng/chitietsach/book-detail.html?id=${encodeURIComponent(
          book.ma_sach
        )}" class="title">
          ${escapeHtml(book.ten_sach)}
        </a>
        <div class="meta">${
          book.authors && book.authors.length
            ? escapeHtml(book.authors[0].ten_tac_gia)
            : ""
        }</div>
        <div class="price-row">
          <div>
            <div class="price">${formatCurrency(book.gia_ban)}</div>
            ${
              book.gia_bia && book.gia_bia > book.gia_ban
                ? `<div class="old-price">${formatCurrency(book.gia_bia)}</div>`
                : ""
            }
          </div>
          <div style="margin-left:auto; text-align:right">
            <button class="small-btn" data-id="${book.ma_sach}">Thêm vào giỏ</button>
          </div>
        </div>
      `;
      productGrid.appendChild(card);
    });

    document.querySelectorAll(".small-btn").forEach((btn) => {
      const id = Number(btn.getAttribute("data-id"));
      btn.addEventListener("click", () => addToCart(id));
    });
  }

  function renderPagination(total) {
    if (!pagination) return;

    const totalPages = Math.max(1, Math.ceil(total / state.limit));
    pagination.innerHTML = "";
    const page = state.page;

    const createBtn = (text, targetPage) => {
      const btn = document.createElement("button");
      btn.textContent = text;
      if (targetPage === page) btn.classList.add("active");
      btn.addEventListener("click", () => {
        state.page = targetPage;
        loadBooks();
        window.scrollTo({ top: 260, behavior: "smooth" });
      });
      return btn;
    };

    if (page > 1) pagination.appendChild(createBtn("« Trước", page - 1));

    const delta = 2;
    const from = Math.max(1, page - delta);
    const to = Math.min(totalPages, page + delta);
    for (let p = from; p <= to; p += 1) {
      pagination.appendChild(createBtn(String(p), p));
    }

    if (page < totalPages) pagination.appendChild(createBtn("Sau »", page + 1));
  }

  async function loadBooks() {
    if (!productGrid) return;

    productGrid.innerHTML =
      '<div class="card loading" style="min-height:120px; display:flex;align-items:center;justify-content:center">Đang tải sản phẩm...</div>';

    try {
      const qs = buildBooksQuery();
      const url = `${API_BASE}${API_V1_PREFIX}${PRODUCT_CONFIG.booksEndpoint}?${qs}`;
      const data = await fetchJson(url);
      if (!data || !Array.isArray(data.data)) {
        renderBooks(0, []);
        renderPagination(0);
        return;
      }
      renderBooks(data.total, data.data);
      renderPagination(data.total);
    } catch (err) {
      console.error("Lỗi tải sản phẩm:", err);
      productGrid.innerHTML =
        '<div class="card" style="text-align:center;color:#c00;">Lỗi khi tải sản phẩm. Vui lòng thử lại.</div>';
      renderPagination(0);
    }
  }

  async function addToCart(bookId) {
    const token = window.sessionStorage.getItem("accessToken");
    if (!token) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      window.location.href = "/Front-end Khách hàng/Login/dangnhap.html";
      return;
    }

    try {
      await apiRequest("/cart/items", {
        method: "POST",
        body: JSON.stringify({ book_id: bookId, quantity: 1 }),
      });
      alert("Đã thêm sản phẩm vào giỏ hàng.");
    } catch (err) {
      console.error("Lỗi thêm vào giỏ:", err);
      alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
    }
  }

  function formatCurrency(v) {
    if (v == null) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(v);
  }

  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener("click", () => {
      state.search = searchInput.value.trim();
      state.page = 1;
      updateSearchKeywordLabel();
      loadBooks();
    });
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        state.search = searchInput.value.trim();
        state.page = 1;
        updateSearchKeywordLabel();
        loadBooks();
      }
    });
  }

  document.querySelectorAll('input[name="price"]').forEach((r) => {
    r.addEventListener("change", () => {
      applyPriceFilterFromUI();
      state.page = 1;
      loadBooks();
    });
  });

  document.querySelectorAll('input[name="publisherQuick"]').forEach((r) => {
    r.addEventListener("change", (e) => {
      state.publisher = e.target.value || "";
      if (publisherSearchInput) {
        publisherSearchInput.value = state.publisher;
      }
      state.page = 1;
      loadBooks();
    });
  });

  if (publisherSearchInput) {
    const applyPublisherSearch = () => {
      state.publisher = publisherSearchInput.value.trim();
      state.page = 1;
      loadBooks();
    };
    publisherSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        applyPublisherSearch();
      }
    });
  }

  if (authorSearchInput) {
    const applyAuthorSearch = () => {
      state.author = authorSearchInput.value.trim();
      state.page = 1;
      loadBooks();
    };
    authorSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        applyAuthorSearch();
      }
    });
  }

  if (categorySearchInput) {
    const applyCategorySearch = () => {
      const q = categorySearchInput.value.trim().toLowerCase();
      if (!q) {
        state.categoryId = null;
        document.querySelectorAll('input[name="categoryQuick"]').forEach((i, idx) => {
          i.checked = idx === 0;
        });
        if (breadcrumbCurrent) breadcrumbCurrent.textContent = "Tất cả";
        state.page = 1;
        loadBooks();
        return;
      }
      const match = categoriesCache.find((c) => (c.ten_the_loai || "").toLowerCase().includes(q));
      if (!match) {
        alert("Không tìm thấy danh mục phù hợp.");
        return;
      }
      state.categoryId = String(match.ma_the_loai);
      document.querySelectorAll('input[name="categoryQuick"]').forEach((i) => {
        i.checked = i.value === state.categoryId;
      });
      if (breadcrumbCurrent) breadcrumbCurrent.textContent = match.ten_the_loai;
      state.page = 1;
      loadBooks();
    };

    categorySearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        applyCategorySearch();
      }
    });
  }

  if (sortBy) {
    sortBy.addEventListener("change", () => {
      state.sort = sortBy.value || "relevance";
      state.page = 1;
      loadBooks();
    });
  }

  // Đánh giá (số sao trở lên)
  document.querySelectorAll('input[name="rating"]').forEach((r) => {
    r.addEventListener("change", (e) => {
      const val = e.target.value;
      state.minRating = val ? Number(val) : null;
      state.page = 1;
      loadBooks();
    });
  });

  document.querySelectorAll('input[name="ngon_ngu"]').forEach((r) => {
    r.addEventListener("change", (e) => {
      state.language = e.target.value || "";
      state.page = 1;
      loadBooks();
    });
  });

  const inStockCheckbox = document.getElementById("inStockOnly");
  if (inStockCheckbox) {
    inStockCheckbox.addEventListener("change", () => {
      state.inStock = inStockCheckbox.checked;
      state.page = 1;
      loadBooks();
    });
  }

  if (limitSelect) {
    limitSelect.addEventListener("change", () => {
      state.limit = parseInt(limitSelect.value, 10) || DEFAULT_LIMIT;
      state.page = 1;
      loadBooks();
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      applyPriceFilterFromUI();
      if (categorySearchInput) {
        const q = categorySearchInput.value.trim().toLowerCase();
        if (q) {
          const match = categoriesCache.find((c) => (c.ten_the_loai || "").toLowerCase().includes(q));
          if (match) {
            state.categoryId = String(match.ma_the_loai);
            document.querySelectorAll('input[name="categoryQuick"]').forEach((i) => {
              i.checked = i.value === state.categoryId;
            });
            if (breadcrumbCurrent) breadcrumbCurrent.textContent = match.ten_the_loai;
          }
        }
      }
      if (publisherSearchInput) {
        state.publisher = publisherSearchInput.value.trim();
      }
      if (authorSearchInput) {
        state.author = authorSearchInput.value.trim();
      }
      state.page = 1;
      loadBooks();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.search = "";
      state.categoryId = null;
      state.minPrice = null;
      state.maxPrice = null;
      state.language = "";
      state.inStock = false;
      state.publisher = "";
      state.author = "";
      state.minRating = null;
      state.page = 1;
      state.limit = DEFAULT_LIMIT;

      if (searchInput) searchInput.value = "";
      document.querySelectorAll('input[name="price"]').forEach((i) => {
        i.checked = false;
      });
      document.querySelectorAll('input[name="ngon_ngu"]').forEach((i, idx) => {
        i.checked = idx === 0;
      });
      if (inStockCheckbox) {
        inStockCheckbox.checked = false;
      }
      if (publisherSearchInput) {
        publisherSearchInput.value = "";
      }
      if (authorSearchInput) {
        authorSearchInput.value = "";
      }
      document.querySelectorAll('input[name="publisherQuick"]').forEach((i, idx) => {
        i.checked = idx === 0;
      });
      if (categorySearchInput) {
        categorySearchInput.value = "";
      }
      document.querySelectorAll('input[name="categoryQuick"]').forEach((i, idx) => {
        i.checked = idx === 0;
      });
      document.querySelectorAll('input[name="rating"]').forEach((i, idx) => {
        i.checked = idx === 0;
      });
      if (sortBy) {
        sortBy.value = "relevance";
        state.sort = "relevance";
      }
      updateSearchKeywordLabel();
      if (limitSelect) limitSelect.value = String(DEFAULT_LIMIT);
      if (breadcrumbCurrent) breadcrumbCurrent.textContent = "Tất cả";
      document.querySelectorAll("#sidebarCategories li").forEach((li, idx) => {
        li.classList.toggle("active", idx === 0);
      });
      loadBooks();
    });
  }

  parseUrlParams();
  loadCategories();
  loadBooks();
});
