console.log("taikhoan.js loaded");

const sidebarLinks = document.querySelectorAll('.sidebar a');
const sections = document.querySelectorAll('.section');
const currentUser = JSON.parse(window.sessionStorage.getItem('currentUser') || '{}');
// Cache thông tin sách để hiển thị chi tiết đơn hàng
const orderBookCache = {};

// === 1. CHUYỂN TAB SIDEBAR ===
sidebarLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    sidebarLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    sections.forEach(s => s.classList.remove('active'));
    document.getElementById(link.dataset.section).classList.add('active');
  });
});

  // Nếu URL có hash #donhang thì tự chuyển sang tab Đơn hàng
  if (window.location.hash === '#donhang') {
    const ordersLink = Array.from(sidebarLinks).find(l => l.dataset.section === 'orders');
    if (ordersLink) {
      sidebarLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      ordersLink.classList.add('active');
      document.getElementById('orders').classList.add('active');
    }
  }

  // === 2. HỒ SƠ CÁ NHÂN ===
  const profileForm = document.getElementById('profileForm');
  const fullName = document.getElementById('fullName');
  const phone = document.getElementById('phone');
  const email = document.getElementById('email');
  const gender = document.getElementById('gender');

  fullName.value = currentUser.ho_ten || '';
  phone.value = currentUser.so_dien_thoai || '';
  email.value = currentUser.email || '';
  gender.value = currentUser.gender || 'nam';

  window.saveProfile = async function saveProfile() {
    if (!profileForm) return;

    const ho_ten = fullName.value.trim();
    const so_dien_thoai = phone.value.trim();
    const emailVal = email.value.trim();

    if (!ho_ten || !emailVal) {
      alert('Vui lòng nhập đầy đủ Họ tên và Email.');
      return;
    }

    try {
      const updated = await apiRequest("/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          ho_ten,
          so_dien_thoai,
          email: emailVal,
        }),
      });
      window.sessionStorage.setItem("currentUser", JSON.stringify(updated));
      alert('Hồ sơ đã được cập nhật thành công!');
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật hồ sơ. Có thể email đã được sử dụng hoặc xảy ra lỗi.');
    }
  };

  // === 3. ĐỊA CHỈ ===
  const addressForm = document.getElementById('addressForm');
  window.saveAddress = async function saveAddress() {
    if (!addressForm) return;

    const ten_dia_chi = document.getElementById('addressName').value.trim();
    const nguoi_nhan = document.getElementById('receiverName').value.trim();
    const so_dien_thoai = document.getElementById('receiverPhone').value.trim();
    const dia_chi_chi_tiet = document.getElementById('detailAddress').value.trim();
    const phuong_xa = document.getElementById('ward').value.trim();
    const quan_huyen = document.getElementById('district').value.trim();
    const tinh_thanh = document.getElementById('province').value.trim();
    const ma_buu_dien = document.getElementById('postalCode').value.trim();
    const isDefaultInput = document.getElementById('isDefaultInput');

    // Validation FE: bắt buộc điền đủ các trường
    const missing = [];
    if (!ten_dia_chi) missing.push('Tên địa chỉ');
    if (!nguoi_nhan) missing.push('Người nhận');
    if (!so_dien_thoai) missing.push('Số điện thoại');
    if (!dia_chi_chi_tiet) missing.push('Địa chỉ chi tiết');
    if (!phuong_xa) missing.push('Phường/Xã');
    if (!quan_huyen) missing.push('Quận/Huyện');
    if (!tinh_thanh) missing.push('Tỉnh/Thành');
    if (!ma_buu_dien) missing.push('Mã bưu điện');

    if (missing.length > 0) {
      alert('Vui lòng điền đầy đủ các trường:\n- ' + missing.join('\n- '));
      return;
    }

    // Xử lý giá trị mac_dinh: ưu tiên ô text (true/false) nếu có, nếu không thì dùng nút tròn
    let mac_dinh = false;
    if (isDefaultInput && isDefaultInput.value.trim() !== '') {
      const raw = isDefaultInput.value.trim().toLowerCase();
      if (raw === 'true' || raw === '1') mac_dinh = true;
      else if (raw === 'false' || raw === '0') mac_dinh = false;
      // nếu nhập linh tinh thì giữ mac_dinh = false
    }

    const payload = {
      ten_dia_chi,
      nguoi_nhan,
      so_dien_thoai,
      dia_chi_chi_tiet,
      phuong_xa,
      quan_huyen,
      tinh_thanh,
      ma_buu_dien,
      mac_dinh,
    };

    try {
      console.log("Saving address payload:", payload);
      await apiRequest("/users/me/addresses", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      alert('Địa chỉ đã được lưu vào hệ thống!');
      addressForm.reset();
    } catch (err) {
      console.error(err);
      alert('Không thể lưu địa chỉ. Vui lòng thử lại.');
    }
  };

  // mac_dinh được điều khiển qua ô text isDefaultInput (true/false)

  // === 4. ĐỔI MẬT KHẨU ===
const passwordForm = document.getElementById('passwordForm');
window.changePassword = async function changePassword() {
  if (!passwordForm) return;

  const currentPwd = document.getElementById('currentPassword').value;
  const newPwd = document.getElementById('newPassword').value;
  const confirmPwd = document.getElementById('confirmPassword').value;

  if (!currentPwd || !newPwd || !confirmPwd) {
    alert('Vui lòng nhập đầy đủ 3 trường mật khẩu.');
    return;
  }

  if (newPwd !== confirmPwd) {
    alert('Mật khẩu mới không khớp!');
    return;
  }
  if (newPwd.length < 6) {
    alert('Mật khẩu phải có ít nhất 6 ký tự!');
    return;
  }

  try {
    console.log("Sending change-password request");
    await apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({
        old_password: currentPwd,
        new_password: newPwd,
      }),
    });
    alert('Mật khẩu đã được thay đổi thành công!');
    passwordForm.reset();
  } catch (err) {
    console.error(err);
    alert('Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại hoặc thử lại sau.');
  }
};


  // === 5. ĐƠN HÀNG ===
  const orderList = document.getElementById('order-list');
  const tabBtns = document.querySelectorAll('.tab-btn');
  let allOrders = [];

  function updateCounts() {
    const counts = {
      all: 0, cho_xac_nhan: 0, da_xac_nhan: 0, dang_chuan_bi: 0,
      dang_giao: 0, da_giao: 0, da_huy: 0
    };

    allOrders.forEach(order => {
      counts.all++;
      const status = order.trang_thai_don_hang;
      if (counts.hasOwnProperty(status)) counts[status]++;
    });

    document.getElementById('count-all').textContent = counts.all;
    document.getElementById('count-cho_xac_nhan').textContent = counts.cho_xac_nhan;
    document.getElementById('count-da_xac_nhan').textContent = counts.da_xac_nhan;
    document.getElementById('count-dang_chuan_bi').textContent = counts.dang_chuan_bi;
    document.getElementById('count-dang_giao').textContent = counts.dang_giao;
    document.getElementById('count-da_giao').textContent = counts.da_giao;
    document.getElementById('count-da_huy').textContent = counts.da_huy;
  }

  function renderOrders(statusFilter = 'all') {
    orderList.innerHTML = '';
    const filtered = statusFilter === 'all' ? allOrders : allOrders.filter(o => o.trang_thai_don_hang === statusFilter);

    if (filtered.length === 0) {
      orderList.innerHTML = `<p style="text-align:center;color:#999;padding:30px;">Chưa có đơn hàng nào.</p>`;
      return;
    }

    filtered.forEach(order => {
      const canCancel = ['cho_xac_nhan', 'da_xac_nhan', 'dang_chuan_bi'].includes(order.trang_thai_don_hang);
      const canReturn = order.trang_thai_don_hang === 'da_giao' && order.trang_thai_thanh_toan === 'da_thanh_toan';

      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <div class="order-card-header">
          <div class="order-id">#${order.ma_don_hang}</div>
          <div class="order-date">${formatDate(order.ngay_tao)}</div>
        </div>
        <div style="margin:6px 0;color:#555;">
          <strong>${order.ten_nguoi_nhan}</strong> • ${order.so_dien_thoai}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0;">
          <div class="order-total">${formatPrice(order.tong_thanh_toan)}</div>
          <div class="order-status status-${order.trang_thai_don_hang}">${getStatusText(order.trang_thai_don_hang)}</div>
        </div>
        <div class="order-actions">
          <button class="btn-cancel" ${canCancel ? '' : 'disabled'} data-id="${order.ma_don_hang}">Hủy đơn</button>
          <button class="btn-edit" data-id="${order.ma_don_hang}">Sửa đơn</button>
        </div>
      `;
      card.addEventListener('click', e => !e.target.closest('button') && showOrderDetails(order));
      orderList.appendChild(card);
    });
  }

  function showOrderDetails(order) {
    const modal = document.getElementById('orderModal');
    document.getElementById('modal-ma-don').textContent = order.ma_don_hang;
    let html = '<div class="product-list">';
    order.san_pham.forEach(p => {
      html += `<div class="product-item">
        <img src="${p.hinh_anh}" alt="${p.ten_san_pham}">
        <div class="product-info">
          <div class="product-name">${p.ten_san_pham}</div>
          <div style="color:#888;">SL: ${p.so_luong} × ${formatPrice(p.don_gia)}</div>
        </div>
        <div class="product-price">${formatPrice(p.don_gia * p.so_luong)}</div>
      </div>`;
    });
    html += `</div><div style="margin-top:20px;line-height:1.7;">
      <div class="order-detail-item"><strong>Mã đơn:</strong> #${order.ma_don_hang}</div>
      <div class="order-detail-item"><strong>Người nhận:</strong> ${order.ten_nguoi_nhan}</div>
      <div class="order-detail-item"><strong>SĐT:</strong> ${order.so_dien_thoai}</div>
      <div class="order-detail-item"><strong>Địa chỉ:</strong> ${order.dia_chi_giao}</div>
      <div class="order-detail-item"><strong>PTTT:</strong> ${order.phuong_thuc_thanh_toan}</div>
      <div class="order-detail-item"><strong>Trạng thái thanh toán:</strong> <span style="color:#155724;font-weight:600;">${getPaymentText(order.trang_thai_thanh_toan)}</span></div>
      <div class="order-detail-item"><strong>Ngày thanh toán:</strong> ${order.ngay_thanh_toan ? formatDate(order.ngay_thanh_toan) : '—'}</div>
      <div class="order-detail-item"><strong>Ngày giao:</strong> ${order.ngay_giao_hang ? formatDate(order.ngay_giao_hang) : '—'}</div>
      <div class="order-detail-item"><strong>Trạng thái đơn:</strong> <span class="order-status status-${order.trang_thai_don_hang}">${getStatusText(order.trang_thai_don_hang)}</span></div>
      <div class="order-detail-item"><strong>Tổng tiền:</strong> <span style="color:#d32f2f;font-weight:700;">${formatPrice(order.tong_thanh_toan)}</span></div>
    </div>`;
    document.getElementById('modal-body').innerHTML = html;
    modal.style.display = 'flex';
  }

  // Đóng modal
  document.querySelector('.close').onclick = () => document.getElementById('orderModal').style.display = 'none';
  window.onclick = e => e.target === document.getElementById('orderModal') && (e.target.style.display = 'none');

  // Tab
  tabBtns.forEach(btn => btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderOrders(btn.dataset.status);
  }));

  // Nút hành động
  orderList.addEventListener('click', async e => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('btn-cancel')) {
      if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
      try {
        await apiRequest(`/orders/${id}/cancel`, { method: 'POST' });
        await loadOrdersFromBackend();
      } catch (err) {
        console.error(err);
        alert('Không thể hủy đơn hàng. Vui lòng thử lại.');
      }
    } else if (target.classList.contains('btn-edit')) {
      const order = allOrders.find(o => String(o.ma_don_hang) === String(id));
      if (!order) return;
      const status = order.trang_thai_don_hang;

      if (status === 'cho_xac_nhan') {
        if (!confirm('Hệ thống sẽ đưa các sản phẩm trong đơn này sang giỏ hàng để bạn chỉnh sửa, sau đó bạn có thể xác nhận lại đơn. Tiếp tục?')) {
          return;
        }

        try {
          window.localStorage.setItem('editingOrderId', String(order.ma_don_hang));

          const cart = await apiRequest('/cart');
          if (cart && Array.isArray(cart.items)) {
            for (const item of cart.items) {
              await apiRequest(`/cart/items/${item.item_id}`, { method: 'DELETE' });
            }
          }

          for (const p of order.san_pham) {
            await apiRequest('/cart/items', {
              method: 'POST',
              body: JSON.stringify({ book_id: p.ma_sach, quantity: p.so_luong }),
            });
          }

          alert('Đã chuyển sản phẩm trong đơn sang giỏ hàng. Bạn có thể chỉnh sửa rồi đặt lại đơn mới.');
          window.location.href = '/Front-end Khách hàng/QLGioHang/giohang.html';
        } catch (err) {
          console.error(err);
          const msg = err && err.message ? err.message : '';
          if (msg.includes('exceeds available stock')) {
            alert('Không đủ tồn kho cho một hoặc nhiều sách trong đơn. Vui lòng giảm số lượng hoặc bỏ bớt một số sách rồi thử lại.');
          } else {
            alert('Không thể chuẩn bị giỏ hàng để sửa đơn. Vui lòng thử lại.');
          }
        }
      } else if (status === 'da_xac_nhan' || status === 'dang_chuan_bi') {
        alert('Đơn đã được xác nhận/đang chuẩn bị. Vui lòng liên hệ Quản trị viên để được hỗ trợ sửa đơn hàng.');
      } else if (status === 'dang_giao' || status === 'da_giao') {
        alert('Đơn đã được gửi cho đơn vị vận chuyển, không thể sửa đơn hàng.');
      } else {
        alert('Đơn hàng ở trạng thái hiện tại không thể sửa.');
      }
    }
  });

  async function loadOrdersFromBackend() {
    const token = window.sessionStorage.getItem('accessToken');
    if (!token) {
      orderList.innerHTML = `<p style="text-align:center;color:#999;padding:30px;">Vui lòng đăng nhập để xem đơn hàng.</p>`;
      return;
    }

    try {
      const orders = await apiRequest('/orders');

      // Chuẩn bị cache sách cho tất cả sản phẩm trong các đơn
      const allItems = orders.flatMap(o => o.items || []);
      const uniqueBookIds = [...new Set(allItems.map(i => i.ma_sach))];
      for (const bookId of uniqueBookIds) {
        if (!orderBookCache[bookId]) {
          try {
            const book = await apiRequest(`/books/${bookId}`);
            orderBookCache[bookId] = book;
          } catch (err) {
            console.error('Không thể tải thông tin sách cho đơn hàng', bookId, err);
          }
        }
      }

      allOrders = orders.map(o => ({
        ma_don_hang: o.ma_don_hang,
        ma_don_hang_code: o.ma_don_hang_code,
        ten_nguoi_nhan: o.ten_nguoi_nhan,
        so_dien_thoai: o.so_dien_thoai,
        dia_chi_giao: o.dia_chi_giao_json && o.dia_chi_giao_json.address_line
          ? `${o.dia_chi_giao_json.address_line}, ${o.dia_chi_giao_json.ward || ''}, ${o.dia_chi_giao_json.district || ''}, ${o.dia_chi_giao_json.province || ''}`
          : '',
        phuong_thuc_thanh_toan: 'COD',
        trang_thai_thanh_toan: o.trang_thai_thanh_toan,
        trang_thai_don_hang: o.trang_thai_don_hang,
        ngay_thanh_toan: null,
        ngay_giao_hang: null,
        ngay_tao: o.ngay_tao,
        tong_thanh_toan: o.tong_thanh_toan,
        san_pham: o.items.map(i => {
          const book = orderBookCache[i.ma_sach];
          return {
            ma_sach: i.ma_sach,
            ten_san_pham: book && book.ten_sach ? book.ten_sach : `Sách #${i.ma_sach}`,
            so_luong: i.so_luong,
            don_gia: i.don_gia,
            hinh_anh: book && book.anh_bia
              ? book.anh_bia
              : 'https://via.placeholder.com/60x80?text=Sách',
          };
        })
      }));
      updateCounts();
      renderOrders();
    } catch (err) {
      console.error(err);
      orderList.innerHTML = `<p style="text-align:center;color:#999;padding:30px;">Không tải được đơn hàng từ server.</p>`;
    }
  }

  loadOrdersFromBackend();

  // Hàm hỗ trợ
  function formatDate(str) { return str ? new Date(str).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'; }
  function formatPrice(p) { return Number(p).toLocaleString('vi-VN') + ' đ'; }
  function getStatusText(s) {
    const map = { cho_xac_nhan: 'Chờ xác nhận', da_xac_nhan: 'Đã xác nhận', dang_chuan_bi: 'Đang chuẩn bị', dang_giao: 'Đang giao', da_giao: 'Đã giao', da_huy: 'Đã hủy'};
    return map[s] || s;
  }
  function getPaymentText(s) {
    const map = { chua_thanh_toan: 'Chưa thanh toán', da_thanh_toan: 'Đã thanh toán', hoan_tien: 'Đã hoàn tiền'};
    return map[s] || s;
  }
