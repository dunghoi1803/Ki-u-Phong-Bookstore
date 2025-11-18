// index.js - Xử lý logic trang chủ
document.addEventListener('DOMContentLoaded', () => {
  console.log('index.js loaded');

  // ===== QUẢN LÝ NGƯỜI DÙNG =====
  let currentUser = null;

  // Kiểm tra URL có login/register success không
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('login') === 'success') {
    currentUser = { name: 'Nguyễn Văn A', email: null };
    history.replaceState({}, '', window.location.pathname);
  } else if (urlParams.get('register') === 'success') {
    currentUser = { name: 'Người dùng mới', email: null };
    history.replaceState({}, '', window.location.pathname);
  }

  // Cập nhật tên tài khoản
  if (currentUser) {
    document.getElementById('accountText').textContent = currentUser.name;
  }


  // ===== TÌM SÁCH NGAY (HERO) → Trang product =====
  document.getElementById('heroSearchBtn').addEventListener('click', () => {
    window.location.href = "/Front-end Khách hàng/TrangSP/product.html";
  });

  // ===== KHÁM PHÁ THẾ GIỚI SÁCH: đưa về product với filter cơ bản =====
  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryItems.forEach((item, idx) => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => {
      // Tạm thời map 4 ô sang 4 bộ filter đơn giản.
      let url = "/Front-end Khách hàng/TrangSP/product.html";

      if (idx === 0) {
        // Văn học kinh điển: dùng từ khóa search chung
        url += "?q=" + encodeURIComponent("văn học");
      } else if (idx === 1) {
        // Sách kinh doanh
        url += "?q=" + encodeURIComponent("kinh doanh");
      } else if (idx === 2) {
        // Sách thiếu nhi
        url += "?q=" + encodeURIComponent("thiếu nhi");
      } else if (idx === 3) {
        // Học ngoại ngữ
        url += "?q=" + encodeURIComponent("ngoại ngữ");
      }

      window.location.href = url;
    });
  });
});
