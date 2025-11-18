// menu.js - DÙNG CHUNG CHO TẤT CẢ TRANG
document.addEventListener('DOMContentLoaded', () => {
  console.log('menu.js loaded');

  // ==========================
  // 1. TẢI NAVBAR TỪ FILE menu.html (đường dẫn tương đối từ mọi trang Khách hàng)
  // ==========================
  fetch("/Front-end Khách hàng/Chung/menu.html")
    .then(res => res.text())
    .then(html => {
      const navbarContainer = document.getElementById("navbar-container");
      if (navbarContainer) {
        navbarContainer.innerHTML = html;

        // Sau khi navbar đã load → gắn các sự kiện cho navbar
        initNavbarEvents();
        initSearchEvents();   // Khởi tạo tìm kiếm sau khi navbar load
        initNavbarShrink();   // Hiệu ứng thu nhỏ navbar
        initNavbarCategories(); // Load danh mục từ backend
      }
    })
    .catch(err => console.error("Lỗi load navbar:", err));
});


// ==========================
// 2. KHỞI TẠO SỰ KIỆN TÀI KHOẢN + THÔNG BÁO
// ==========================
function initNavbarEvents() {
  const isLoggedIn = () => {
    const token = window.sessionStorage ? window.sessionStorage.getItem("accessToken") : null;
    return Boolean(token);
  };

  const logoLink = document.querySelector(".navbar .logo");
  const btnAccount = document.getElementById("nav-account");
  const btnNotify = document.getElementById("nav-notify");
  const btnCart = document.getElementById("nav-cart");

  // --- LOGO KIEUPHONG.COM ---
  if (logoLink) {
    logoLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/Front-end Khách hàng/Index/index.html";
    });
  }

  // --- NÚT TÀI KHOẢN ---
  if (btnAccount) {
    btnAccount.addEventListener("click", () => {
      if (!isLoggedIn()) {
        window.location.href = "/Front-end Khách hàng/Login/dangnhap.html";
      } else {
        window.location.href = "/Front-end Khách hàng/Taikhoan/taikhoan.html";
      }
    });
  }

  // --- NÚT THÔNG BÁO ---
  if (btnNotify) {
    btnNotify.addEventListener("click", (e) => {
      e.preventDefault();
      if (!isLoggedIn()) {
        window.location.href = "/Front-end Khách hàng/Login/dangnhap.html";
      } else {
        window.location.href = "/Front-end Khách hàng/Taikhoan/taikhoan.html";
      }
    });
  }

  if (btnCart) {
    btnCart.addEventListener("click", (e) => {
      e.preventDefault();
      if (!isLoggedIn()) {
        window.location.href = "/Front-end Khách hàng/Login/dangnhap.html";
      } else {
        window.location.href = "/Front-end Khách hàng/QLGioHang/giohang.html";
      }
    });
  }
}


// ==========================
// 3. KHỞI TẠO TÌM KIẾM (code gốc của bạn)
// ==========================
function initSearchEvents() {
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn && searchInput) {
    const performSearch = () => {
      const keyword = searchInput.value.trim();
      if (keyword) {
        window.location.href = `/Front-end Khách hàng/TrangSP/product.html?q=${encodeURIComponent(keyword)}`;
      } else {
        alert("Vui lòng nhập từ khóa!");
      }
    };

    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keypress", e => {
      if (e.key === "Enter") performSearch();
    });
  }
}

// Gắn handler cho link danh mục để đảm bảo điều hướng hoạt động ổn định trên mọi trang
function attachCategoryLinkHandlers() {
  const links = document.querySelectorAll("#topCategoryList a");
  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const href = a.getAttribute("href");
      if (href) {
        window.location.href = href;
      }
    });
  });
}

// ==========================
// 4. LOAD DANH MỤC TRÊN NAVBAR TỪ BACKEND
// ==========================
function initNavbarCategories() {
  const listEl = document.getElementById("topCategoryList");
  if (!listEl) return;

  // Nếu api.js đã được load thì dùng API_BASE/API_V1_PREFIX, nếu không thì fallback URL cố định
  const base = typeof API_BASE !== "undefined" ? API_BASE : "http://127.0.0.1:8000";
  const prefix = typeof API_V1_PREFIX !== "undefined" ? API_V1_PREFIX : "/api/v1";

  fetch(`${base}${prefix}/categories`, { cache: "no-store" })
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) return;
      listEl.innerHTML = "";
      // Tất cả
      const liAll = document.createElement("li");
      liAll.innerHTML = `<a href="/Front-end Khách hàng/TrangSP/product.html">Tất cả</a>`;
      listEl.appendChild(liAll);

      data.forEach(c => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="/Front-end Khách hàng/TrangSP/product.html?ma_the_loai=${encodeURIComponent(
          c.ma_the_loai
        )}">${c.ten_the_loai}</a>`;
        listEl.appendChild(li);
      });
      attachCategoryLinkHandlers();
    })
    .catch(err => {
      console.warn("Không load được danh mục navbar, dùng HTML tĩnh:", err);
      attachCategoryLinkHandlers();
    });
}


// ==========================
// 4. HIỆU ỨNG THU NHỎ NAVBAR (code gốc của bạn)
// ==========================
function initNavbarShrink() {
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("shrink", window.scrollY > 50);
    });
  }
}
