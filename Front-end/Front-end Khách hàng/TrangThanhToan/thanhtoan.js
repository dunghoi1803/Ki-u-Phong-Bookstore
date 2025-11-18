document.addEventListener("DOMContentLoaded", () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const thanhTienElement = document.getElementById("thanhtien");
  const phiVcElement = document.getElementById("phivc");
  const tongTienElement = document.getElementById("tongtien");
  const duKienElement = document.getElementById("dukien");
  const nguoiNhanInput = document.getElementById("nguoinhan");
  const sdtInput = document.getElementById("sdt");
  const tinhInput = document.getElementById("tinh");
  const huyenInput = document.getElementById("huyen");
  const xaInput = document.getElementById("xa");
  const diaChiInput = document.getElementById("diachi");
  const xacNhanBtn = document.getElementById("xacnhan");

  const checkoutItems = JSON.parse(window.localStorage.getItem("checkoutItems") || "[]");

  if (!checkoutItems.length) {
    cartItemsContainer.innerHTML = `
      <div class="cart-item empty">
        <p>Không có sản phẩm nào để thanh toán.</p>
        <a href="/Front-end Khách hàng/QLGioHang/giohang.html">Quay lại giỏ hàng</a>
      </div>
    `;
    thanhTienElement.textContent = "0đ";
    phiVcElement.textContent = "0đ";
    tongTienElement.textContent = "0đ";
    xacNhanBtn.disabled = true;
    return;
  }

  const ADDRESS_DATA = {
    "TP Hồ Chí Minh": {
      "Quận 1": ["Phường Bến Nghé", "Phường Bến Thành", "Phường Cầu Ông Lãnh"],
      "Quận 3": ["Phường 1", "Phường 2", "Phường 3"],
      "Quận 10": ["Phường 12", "Phường 13", "Phường 15"]
    },
    "Hà Nội": {
      "Quận Hoàn Kiếm": ["Phường Hàng Bạc", "Phường Hàng Bồ", "Phường Tràng Tiền"],
      "Quận Đống Đa": ["Phường Cát Linh", "Phường Quốc Tử Giám", "Phường Láng Hạ"]
    },
    "Đà Nẵng": {
      "Quận Hải Châu": ["Phường Hải Châu 1", "Phường Hải Châu 2"],
      "Quận Sơn Trà": ["Phường An Hải Bắc", "Phường An Hải Đông"]
    }
  };

  function populateTinh() {
    tinhInput.innerHTML = '<option value="">-- Chọn tỉnh --</option>';
    Object.keys(ADDRESS_DATA).forEach((tinh) => {
      const opt = document.createElement("option");
      opt.value = tinh;
      opt.textContent = tinh;
      tinhInput.appendChild(opt);
    });
    huyenInput.innerHTML = '<option value="">-- Chọn quận/huyện --</option>';
    xaInput.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
  }

  function populateHuyen() {
    const tinh = tinhInput.value;
    huyenInput.innerHTML = '<option value="">-- Chọn quận/huyện --</option>';
    xaInput.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
    if (!tinh || !ADDRESS_DATA[tinh]) return;
    Object.keys(ADDRESS_DATA[tinh]).forEach((huyen) => {
      const opt = document.createElement("option");
      opt.value = huyen;
      opt.textContent = huyen;
      huyenInput.appendChild(opt);
    });
  }

  function populateXa() {
    const tinh = tinhInput.value;
    const huyen = huyenInput.value;
    xaInput.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
    if (!tinh || !huyen || !ADDRESS_DATA[tinh] || !ADDRESS_DATA[tinh][huyen]) return;
    ADDRESS_DATA[tinh][huyen].forEach((xa) => {
      const opt = document.createElement("option");
      opt.value = xa;
      opt.textContent = xa;
      xaInput.appendChild(opt);
    });
  }

  function renderCart() {
    let html = "";
    let total = 0;

    checkoutItems.forEach((item) => {
      const lineTotal = item.subtotal ?? item.price * item.quantity;
      html += `
        <div class="cart-item">
          <span>${item.title || "Sản phẩm"} × ${item.quantity}</span>
          <span>${lineTotal.toLocaleString("vi-VN")}đ</span>
        </div>
      `;
      total += lineTotal;
    });

    cartItemsContainer.innerHTML = html;
    thanhTienElement.textContent = total.toLocaleString("vi-VN") + "đ";

    const ship = total >= 50000 ? 0 : 15000;
    phiVcElement.textContent = ship.toLocaleString("vi-VN") + "đ";
    tongTienElement.textContent = (total + ship).toLocaleString("vi-VN") + "đ";
    thanhtoanState.total = total;
    thanhtoanState.shippingFee = ship;
  }

  function updateDelivery() {
    const sdt = sdtInput.value.trim();
    const tinh = tinhInput.value;
    const huyen = huyenInput.value;
    const xa = xaInput.value;

    if (sdt.length >= 9 && tinh && huyen && xa) {
      const today = new Date();
      today.setDate(today.getDate() + 3);
      const date = today.toLocaleDateString("vi-VN");
      duKienElement.textContent = "Dự kiến giao ngày: " + date;
    } else {
      duKienElement.textContent = "Vui lòng điền đủ thông tin giao hàng...";
    }
  }

  tinhInput.addEventListener("change", () => {
    populateHuyen();
    updateDelivery();
  });

  huyenInput.addEventListener("change", () => {
    populateXa();
    updateDelivery();
  });

  [sdtInput, xaInput].forEach((el) => {
    el.addEventListener("change", updateDelivery);
  });

  xacNhanBtn.addEventListener("click", () => {
    const nguoiNhan = nguoiNhanInput.value.trim();
    const sdt = sdtInput.value.trim();
    const tinh = tinhInput.value;
    const huyen = huyenInput.value;
    const xa = xaInput.value;
    const diaChi = diaChiInput.value.trim();

    if (!nguoiNhan || !sdt || !tinh || !huyen || !xa || !diaChi) {
      alert("Vui lòng điền đầy đủ thông tin giao hàng trước khi đặt hàng.");
      return;
    }

    const token = window.sessionStorage.getItem("accessToken");
    if (!token) {
      alert("Vui lòng đăng nhập để đặt hàng.");
      window.location.href = "/Front-end Khách hàng/Login/dangnhap.html";
      return;
    }

    const shipping = {
      receiver_name: nguoiNhan,
      phone: sdt,
      address_line: diaChi,
      ward: xa,
      district: huyen,
      province: tinh,
      postal_code: null,
      shipping_fee: thanhtoanState.shippingFee || 0,
    };

    const editingOrderId = window.localStorage.getItem("editingOrderId");
    const path = editingOrderId ? `/orders/${editingOrderId}/replace-from-cart` : "/orders";

    apiRequest(path, {
      method: "POST",
      body: JSON.stringify({ shipping }),
    })
      .then(() => {
        alert(editingOrderId ? "Đơn hàng đã được cập nhật thành công!" : "Đặt hàng thành công! Đơn hàng đã được lưu trong hệ thống.");
        window.localStorage.removeItem("checkoutItems");
        if (editingOrderId) {
          window.localStorage.removeItem("editingOrderId");
        }
        window.location.href = "/Front-end Khách hàng/Taikhoan/taikhoan.html#donhang";
      })
      .catch((err) => {
        console.error(err);
        alert("Không thể xử lý đơn hàng. Vui lòng thử lại.");
      });
  });

  const thanhtoanState = { total: 0, shippingFee: 0 };
  renderCart();
  populateTinh();
});
