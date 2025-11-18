/**
 * book-detail.js
 * Trang chi tiết sản phẩm - VERSION VỚI DỮ LIỆU ẢO
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');

  const els = {
    image: document.getElementById('bookImage'),
    title: document.getElementById('bookTitle'),
    author: document.getElementById('bookAuthor'),
    publisher: document.getElementById('bookPublisher'),
    year: document.getElementById('bookYear'),
    pages: document.getElementById('bookPages'),
    language: document.getElementById('bookLanguage'),
    size: document.getElementById('bookSize'),
    price: document.getElementById('bookPrice'),
    variant: document.getElementById('variantSelect'),
    qty: document.getElementById('quantity'),
    shippingInfo: document.getElementById('shippingInfo'),
    details: document.getElementById('details'),
    description: document.getElementById('description')
  };

  let currentBook = null;
  let selectedRating = 0;

  // ===== DỮ LIỆU ẢO CHO SÁCH =====
  const mockBookData = {
    ma_sach: '1',
    ma_sku: 'BOOK001',
    ten_sach: 'Nhà Giả Kim - The Alchemist',
    ten_tac_gia: 'Paulo Coelho',
    ten_nxb: 'NXB Hội Nhà Văn',
    nam_xuat_ban: 2020,
    so_trang: 227,
    ngon_ngu: 'Tiếng Việt',
    kich_thuoc_rong: 130,
    kich_thuoc_cao: 200,
    khoi_luong: 250,
    do_day: 15,
    ma_isbn: '978-604-58-7610-3',
    gia_ban: 79000,
    gia_bia: 95000,
    anh_bia: 'https://salt.tikicdn.com/cache/w1200/ts/product/5e/18/24/2a6154ba08df6ce6161c13f4303fa19e.jpg',
    mo_ta: `"Nhà Giả Kim" là một trong những tác phẩm văn học nổi tiếng nhất thế giới, được dịch ra hơn 80 ngôn ngữ.

Cuốn sách kể về hành trình của Santiago - một chàng chăn cừu trẻ người Tây Ban Nha, từ quê nhà đến sa mạc Sahara để tìm kiếm kho báu ẩn giấu gần Kim tự tháp Ai Cập.

Trong suốt cuộc hành trình, Santiago gặp gỡ nhiều con người đặc biệt: người vua của Salem, người bán pha lê, nhà giả kim... Mỗi người đều mang đến cho cậu những bài học quý giá về cuộc sống, về tình yêu, và về "Huyền thoại của riêng mình".

<strong>Thông điệp chính của cuốn sách:</strong>
• Hãy theo đuổi ước mơ của chính mình
• Kho báu lớn nhất thường nằm ngay trong chính bạn
• Vũ trụ luôn âm thầm giúp đỡ những ai theo đuổi ước mơ
• Hãy sống ở hiện tại và trân trọng từng khoảnh khắc

"Nhà Giả Kim" không chỉ là một câu chuyện phiêu lưu, mà còn là một tác phẩm triết lý sâu sắc về ý nghĩa cuộc sống, khuyến khích mỗi người dũng cảm theo đuổi ước mơ của mình.`,
    variants: [
      { ma_sku: 'BOOK001-BIA-MEM', ten_phien_ban: 'Bìa mềm' },
      { ma_sku: 'BOOK001-BIA-CUNG', ten_phien_ban: 'Bìa cứng' },
      { ma_sku: 'BOOK001-SPECIAL', ten_phien_ban: 'Phiên bản đặc biệt' }
    ]
  };

  // ===== DỮ LIỆU ẢO CHO ĐÁNH GIÁ =====
  const mockReviews = [
    {
      username: 'Nguyễn Văn A',
      rating: 5,
      content: 'Cuốn sách tuyệt vời! Tôi đã đọc đi đọc lại nhiều lần và mỗi lần đọc lại thấy thêm nhiều điều hay. Câu chuyện về Santiago và hành trình tìm kiếm kho báu thực sự truyền cảm hứng. Phong cách viết của Paulo Coelho rất dễ đọc, sâu sắc mà không hề khô khan. Đặc biệt là những bài học về việc theo đuổi ước mơ và lắng nghe tiếng gọi của trái tim.',
      anonymous: false
    },
    {
      username: 'Người dùng ẩn danh',
      rating: 5,
      content: 'Một trong những cuốn sách hay nhất tôi từng đọc. Nó không chỉ là một câu chuyện phiêu lưu mà còn chứa đựng nhiều triết lý sâu sắc về cuộc sống. Mỗi trang sách đều có những câu nói đáng suy ngẫm. Tôi nghĩ ai cũng nên đọc cuốn sách này ít nhất một lần trong đời.',
      anonymous: true
    },
    {
      username: 'Trần Thị B',
      rating: 4,
      content: 'Sách hay, nhưng có một số đoạn hơi chậm. Tuy nhiên, thông điệp của cuốn sách rất ý nghĩa và đáng để suy ngẫm. Phần cuối của câu chuyện đặc biệt cảm động và bất ngờ. Bản dịch tiếng Việt cũng khá mượt mà, dễ hiểu. Giao hàng nhanh, sách mới 100%.',
      anonymous: false
    },
    {
      username: 'Phạm Minh C',
      rating: 5,
      content: 'Đây là cuốn sách đã thay đổi cách nhìn của tôi về cuộc sống. Nó dạy tôi rằng hãy dũng cảm theo đuổi ước mơ của mình, và đừng bao giờ từ bỏ. Câu chuyện của Santiago như một tấm gương phản chiếu chính bản thân mình. Rất khuyến khích mọi người đọc!',
      anonymous: false
    },
    {
      username: 'Người dùng ẩn danh',
      rating: 4,
      content: 'Cuốn sách đáng đọc cho những ai đang tìm kiếm động lực trong cuộc sống. Có những đoạn rất triết lý, có thể cần đọc nhiều lần mới hiểu hết ý nghĩa. Chất lượng in ấn tốt, giá cả hợp lý. Shop giao hàng đúng hẹn.',
      anonymous: true
    }
  ];

  // ===== LOAD SÁCH TỪ BACKEND (fallback dữ liệu ảo nếu lỗi) =====
  async function loadBook() {
    try {
      let data;
      if (bookId) {
        const res = await fetch(`${API_BASE}${API_V1_PREFIX}/books/${encodeURIComponent(bookId)}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        data = await res.json();
      } else {
        data = mockBookData;
      }
      currentBook = data;

      // Cập nhật title trang
      if (document.getElementById('pageTitle')) {
        document.getElementById('pageTitle').textContent = data.ten_sach;
      }

      els.image.src = data.anh_bia || 'https://via.placeholder.com/380x500?text=No+Image';
      els.image.alt = data.ten_sach;
      els.title.textContent = data.ten_sach;
      const authorName =
        data.ten_tac_gia ||
        (data.authors && data.authors.length ? data.authors[0].ten_tac_gia : 'Không rõ');
      els.author.textContent = authorName;
      const publisherName =
        data.ten_nxb || (data.publisher ? data.publisher.ten_nxb : 'Không rõ');
      els.publisher.textContent = publisherName;
      els.year.textContent = data.nam_xuat_ban || '—';
      els.pages.textContent = data.so_trang ? `${data.so_trang} trang` : '—';
      els.language.textContent = data.ngon_ngu || 'Tiếng Việt';
      els.size.textContent =
        data.kich_thuoc_rong && data.kich_thuoc_cao
          ? `${data.kich_thuoc_rong}x${data.kich_thuoc_cao} mm`
          : '—';

      // Giá
      const price = formatCurrency(data.gia_ban);
      const old = data.gia_bia > data.gia_ban
        ? `<span class="old-price-large">${formatCurrency(data.gia_bia)}</span>`
        : '';
      els.price.innerHTML = price + old;

      // Tabs
      els.description.innerHTML = data.mo_ta ? data.mo_ta.replace(/\n/g, '<br>') : 'Chưa có mô tả.';
      els.details.innerHTML = `
        <p><strong>ISBN:</strong> ${data.ma_isbn || '—'}</p>
        <p><strong>Khối lượng:</strong> ${data.khoi_luong ? data.khoi_luong + 'g' : '—'}</p>
        <p><strong>Độ dày:</strong> ${data.do_day ? data.do_day + 'mm' : '—'}</p>
        <p><strong>Hình thức:</strong> Bìa mềm</p>
        <p><strong>Loại bìa:</strong> Bìa gáy vuông</p>
      `;

      renderVariants(data.variants || []);
    } catch (err) {
      console.error('Lỗi tải sách, fallback dữ liệu ảo:', err);
      const data = mockBookData;
      currentBook = data;
      els.image.src = data.anh_bia || 'https://via.placeholder.com/380x500?text=No+Image';
      els.image.alt = data.ten_sach;
      els.title.textContent = data.ten_sach;
      els.author.textContent = data.ten_tac_gia || 'Không rõ';
      els.publisher.textContent = data.ten_nxb || 'Không rõ';
      els.year.textContent = data.nam_xuat_ban || '—';
      els.pages.textContent = data.so_trang ? `${data.so_trang} trang` : '—';
      els.language.textContent = data.ngon_ngu || 'Tiếng Việt';
      els.size.textContent =
        data.kich_thuoc_rong && data.kich_thuoc_cao
          ? `${data.kich_thuoc_rong}x${data.kich_thuoc_cao} mm`
          : '—';
      const price = formatCurrency(data.gia_ban);
      const old =
        data.gia_bia > data.gia_ban
          ? `<span class="old-price-large">${formatCurrency(data.gia_bia)}</span>`
          : '';
      els.price.innerHTML = price + old;
      els.description.innerHTML = data.mo_ta ? data.mo_ta.replace(/\n/g, '<br>') : 'Chưa có mô tả.';
      els.details.innerHTML = `
        <p><strong>ISBN:</strong> ${data.ma_isbn || '—'}</p>
        <p><strong>Khối lượng:</strong> ${data.khoi_luong ? data.khoi_luong + 'g' : '—'}</p>
        <p><strong>Độ dày:</strong> ${data.do_day ? data.do_day + 'mm' : '—'}</p>
        <p><strong>Hình thức:</strong> Bìa mềm</p>
        <p><strong>Loại bìa:</strong> Bìa gáy vuông</p>
      `;
      renderVariants(data.variants || []);
    }
  }

  // ===== XỬ LÝ CHỌN SAO =====
  document.querySelectorAll("#starRating i").forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = star.dataset.rate;

      document.querySelectorAll("#starRating i").forEach(s => s.classList.remove("active"));
      for (let i = 0; i < selectedRating; i++) {
        document.querySelectorAll("#starRating i")[i].classList.add("active");
      }
    });
  });

  // ===== GỬI ĐÁNH GIÁ =====
  document.getElementById("submitReview").addEventListener("click", async () => {
    const text = document.getElementById("reviewText").value.trim();
    const anonymous = document.getElementById("anonymousToggle").checked;

    if (selectedRating === 0) {
      alert("Bạn chưa chọn số sao!");
      return;
    }
    if (text.length < 40) {
      alert("Bài đánh giá nên tối thiểu khoảng 40 ký tự để mô tả cảm nhận của bạn.");
      return;
    }

    const token = window.sessionStorage.getItem("accessToken");
    if (!token) {
      alert("Vui lòng đăng nhập để đánh giá sản phẩm.");
      window.location.href = "/Front-end Khách hàng/Login/dangnhap.html";
      return;
    }

    try {
      await apiRequest(`/books/${bookId}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          diem_danh_gia: Number(selectedRating),
          tieu_de: null,
          noi_dung: text,
        }),
      });

      alert("Đã gửi đánh giá!");
      document.getElementById("reviewText").value = "";
      selectedRating = 0;
      document.querySelectorAll("#starRating i").forEach((s) => s.classList.remove("active"));
      await loadReviews();
    } catch (err) {
      console.error("Lỗi gửi đánh giá:", err);
      alert("Không thể gửi đánh giá. Vui lòng thử lại sau.");
    }
  });

  // Mua ngay: thêm vào giỏ xong chuyển sang trang giỏ hàng
  document.getElementById('buyNow').onclick = async () => {
    await addToCart();
    window.location.href = "/Front-end Khách hàng/QLGioHang/giohang.html";
  };

  // ===== LOAD ĐÁNH GIÁ TỪ BACKEND =====
  async function loadReviews() {
    const list = document.getElementById("reviewList");
    list.innerHTML = "";

    try {
      const data = await apiRequest(`/books/${bookId}/reviews`);

      if (!Array.isArray(data) || data.length === 0) {
        list.innerHTML =
          '<p style="color: #999; text-align: center; padding: 20px;">Chưa có đánh giá nào.</p>';
        return;
      }
    
      data.forEach((r) => {
        const div = document.createElement("div");
        div.classList.add("review-item");

        const stars = "★".repeat(r.diem_danh_gia) + "☆".repeat(5 - r.diem_danh_gia);
        const author = r.author_name || "Người dùng";

        div.innerHTML = `
          <div class="review-author">${author}</div>
          <div class="review-stars">${stars}</div>
          <div class="review-text">${r.noi_dung || ""}</div>
        `;

        list.appendChild(div);
      });
    } catch (err) {
      console.error("Không tải được đánh giá:", err);
      list.innerHTML =
        '<p style="color: #999; text-align: center; padding: 20px;">Không tải được danh sách đánh giá.</p>';
    }
  }

  // ===== RENDER PHÂN LOẠI =====
  function renderVariants(variants) {
    const select = els.variant;
    select.innerHTML = '<option value="">Chọn phiên bản</option>';
    if (!variants.length) {
      select.style.display = 'none';
      return;
    }
    variants.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.ma_sku;
      opt.textContent = v.ten_phien_ban;
      select.appendChild(opt);
    });
  }

  // ===== SỐ LƯỢNG =====
  document.getElementById('qtyDec').onclick = () => {
    if (parseInt(els.qty.value) > 1) els.qty.value = parseInt(els.qty.value) - 1;
  };
  document.getElementById('qtyInc').onclick = () => {
    els.qty.value = parseInt(els.qty.value) + 1;
  };

  // ===== TABS =====
  document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    };
  });

  // ===== GIỎ HÀNG =====
  async function addToCart() {
    const qty = parseInt(els.qty.value, 10) || 1;
    const id = bookId || currentBook.ma_sach || mockBookData.ma_sach;

    const token = window.sessionStorage.getItem("accessToken");
    if (!token) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      window.location.href = "../Login/dangnhap.html";
      return;
    }

    try {
      await apiRequest("/cart/items", {
        method: "POST",
        body: JSON.stringify({ book_id: Number(id), quantity: qty }),
      });
      alert(`Đã thêm ${qty} sản phẩm vào giỏ hàng!`);
    } catch (err) {
      console.error("Lỗi thêm vào giỏ:", err);
      alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
    }
  }

  document.getElementById('addToCart').onclick = addToCart;
  document.getElementById('buyNow').onclick = async () => {
    await addToCart();
    alert('Chuyển đến trang giỏ hàng...');
    // Bỏ comment để chuyển trang thật
    window.location.href = '/QLGioHang/giohang.html';
  };

  // ===== FORMAT TIỀN =====
  function formatCurrency(v) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  }

  // ===== KHỞI CHẠY =====
  loadBook();
  loadReviews();

  console.log('✅ Trang chi tiết sách đã load với backend');
});
