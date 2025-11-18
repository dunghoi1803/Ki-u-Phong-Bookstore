// --- Runtime state (always loaded from backend) ---
let books = [];
let categories = [];

let customers = [
    { MaKhachHang: 'KH001', HoTen: 'Nguyễn Văn A', SDT: '0901234567' },
    { MaKhachHang: 'KH002', HoTen: 'Trần Thị B', SDT: '0909876543' },
    { MaKhachHang: 'KH003', HoTen: 'Lê Văn C', SDT: '0912345678' },
];
let currentLastCustomerId = 3; 

let orders = [];

// Định nghĩa các trạng thái Đơn hàng
const orderStatuses = {
    'cho_xac_nhan': { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800', next: ['da_xac_nhan', 'da_huy'] },
    'da_xac_nhan': { label: 'Đã xác nhận', color: 'bg-indigo-100 text-indigo-800', next: ['dang_chuan_bi', 'da_huy'] },
    'dang_chuan_bi': { label: 'Đang chuẩn bị', color: 'bg-blue-100 text-blue-800', next: ['dang_giao'] },
    'dang_giao': { label: 'Đang giao hàng', color: 'bg-purple-100 text-purple-800', next: ['da_giao'] },
    'da_giao': { label: 'Đã giao (Hoàn thành)', color: 'bg-green-100 text-green-800', next: [] },
    'da_huy': { label: 'Đã hủy', color: 'bg-red-100 text-red-800', next: [] },
};

// Định nghĩa các trạng thái Thanh toán
const paymentStatuses = {
    'chua_thanh_toan': { label: 'Chưa thanh toán', color: 'bg-red-500 text-white' },
    'da_thanh_toan': { label: 'Đã thanh toán', color: 'bg-green-500 text-white' },
};


// Biến toàn cục để theo dõi ID của mục đang chỉnh sửa
let editingItemId = null; 

// Biến toàn cục để lưu trữ options sản phẩm
let productOptions = '';
// Biến toàn cục cho sắp xếp sách, danh mục, đơn hàng
let bookSortField = null;
let bookSortDirection = 'asc';
let categorySortField = 'MaDanhMuc';
let categorySortDirection = 'asc';
let orderSortField = null;
let orderSortDirection = 'asc';

// --- Tải dữ liệu Sách từ backend (ghi đè mock nếu thành công) ---
async function loadBooksFromBackend() {
    try {
        const result = await adminApiRequest("/books?limit=100");
        if (!result || !Array.isArray(result.data)) {
            console.warn("Admin: backend returned an invalid book list; leaving books empty.");
            return;
        }

        books = result.data.map((b) => ({
            MaSach: String(b.ma_sach),
            MaSKU: b.ma_sku,
            TenSach: b.ten_sach,
            TacGia: (b.authors || []).map((a) => a.ten_tac_gia).join(", "),
            TheLoai: (b.categories && b.categories.length > 0) ? b.categories[0].ten_the_loai : "",
            GiaBan: b.gia_ban || 0,
            SoLuongTon: b.inventory ? b.inventory.so_luong_ton : 0,
            SoLuongGiuCho: b.inventory ? b.inventory.so_luong_giu_cho : 0,
            NhaXuatBan: b.publisher ? b.publisher.ten_nxb : "",
            MoTa: b.mo_ta || "",
            NgonNgu: b.ngon_ngu || "vi",
            Images: b.anh_bia ? [b.anh_bia] : [],
        }));

        // Cập nhật options sản phẩm cho phần đơn hàng
        productOptions = books
            .map(
                (b) =>
                    `<option value="${b.MaSach}" data-price="${b.GiaBan}" data-sku="${b.MaSKU}">${b.TenSach} (${b.GiaBan.toLocaleString(
                        "vi-VN"
                    )} VNĐ) - Tồn sẵn: ${b.SoLuongTon - b.SoLuongGiuCho}</option>`
            )
            .join("");

        // Nếu đang ở view book-list thì vẽ lại
        const activeLink = document.querySelector("aside nav a.bg-gray-700");
        const currentView = activeLink ? activeLink.getAttribute("data-view") : null;
        if (currentView === "book-list") {
            renderBookList(books);
        }
    } catch (error) {
        console.error("Admin: failed to load books from backend; leaving books empty.", error);
    }
}

// --- Tải danh mục từ backend ---
async function loadCategoriesFromBackend() {
    try {
        const result = await adminApiRequest("/categories");
        if (!Array.isArray(result)) {
            console.warn("Admin: backend returned an invalid category list; leaving categories empty.");
            return;
        }
        categories = result.map((c) => ({
            MaDanhMuc: String(c.ma_the_loai),
            TenDanhMuc: c.ten_the_loai,
            MoTa: "",
        }));
        const activeLink = document.querySelector("aside nav a.bg-gray-700");
        const currentView = activeLink ? activeLink.getAttribute("data-view") : null;
        if (currentView === "category-list") {
            renderCategoryList(categories);
        }
    } catch (error) {
        console.error("Admin: failed to load categories from backend; leaving categories empty.", error);
    }
}

// --- Tải đơn hàng admin từ backend ---
async function loadAdminOrdersFromBackend() {
    try {
        const result = await adminApiRequest("/admin/orders");
        if (!Array.isArray(result)) {
            console.warn("Admin: backend returned an invalid orders list; leaving orders empty.");
            return;
        }
        orders = result.map((o) => {
            const address = o.dia_chi_giao_json || {};
            const fullAddr = [
                address.address_line,
                address.ward,
                address.district,
                address.province,
            ]
                .filter(Boolean)
                .join(", ");

            const chiTiet = o.items.map((i) => ({
                MaSach: String(i.ma_sach),
                TenSach: `Sách #${i.ma_sach}`,
                SoLuong: i.so_luong,
                GiaBan: i.don_gia,
            }));

            const tongTienHang = chiTiet.reduce(
                (sum, item) => sum + item.SoLuong * item.GiaBan,
                0,
            );

            return {
                ma_don_hang: o.ma_don_hang,
                ma_don_hang_code: o.ma_don_hang_code,
                ma_khach_hang: null,
                ten_nguoi_nhan: o.ten_nguoi_nhan,
                so_dien_thoai: o.so_dien_thoai,
                dia_chi_giao_json: { full: fullAddr },
                tong_tien_hang: tongTienHang,
                phi_van_chuyen: 0,
                thue: 0,
                tong_thanh_toan: o.tong_thanh_toan,
                trang_thai_thanh_toan: o.trang_thai_thanh_toan,
                trang_thai_don_hang: o.trang_thai_don_hang,
                ngay_tao: o.ngay_tao,
                chi_tiet: chiTiet,
            };
        });
        const activeLink = document.querySelector("aside nav a.bg-gray-700");
        const currentView = activeLink ? activeLink.getAttribute("data-view") : null;
        if (currentView === "order-list") {
            renderOrderList(orders);
        }
    } catch (error) {
        console.error("Admin: failed to load admin orders from backend; leaving orders empty.", error);
    }
}


// --- Hàm Utility UI ---

/**
 * Tự động tạo mã đơn hàng duy nhất (DH + số tiếp theo)
 */
function generateUniqueOrderCode() {
    const lastOrder = orders.reduce((max, order) => {
        const num = parseInt(order.ma_don_hang_code.replace('DH', '')) || 0;
        return num > max ? num : max;
    }, 0);
    const newNum = lastOrder + 1;
    return 'DH' + newNum.toString().padStart(3, '0');
}

/**
 * Tự động tạo mã khách hàng duy nhất (KH + số tiếp theo)
 */
function generateNewCustomerId() {
    currentLastCustomerId++;
    return 'KH' + currentLastCustomerId.toString().padStart(3, '0');
}

/**
 * Hiển thị custom modal.
 * @param {string} title - Tiêu đề modal.
 * @param {string} message - Nội dung thông báo (có thể là HTML string).
 * @param {string} actionsHtml - Các nút hành động (HTML string).
 * @param {string} [maxWidthClass='max-w-sm'] - Class Tailwind để giới hạn chiều rộng (ví dụ: 'max-w-xl').
 */
function showModal(title, message, actionsHtml, maxWidthClass = 'max-w-sm') {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerHTML = message; // Sử dụng innerHTML để chấp nhận HTML
    
    const modalContent = document.getElementById('modal-content');
    modalContent.className = `bg-white p-6 rounded-xl shadow-2xl w-full transform transition-all duration-300 scale-95 opacity-0 ${maxWidthClass}`;

    document.getElementById('modal-actions').innerHTML = actionsHtml;
    const modalContainer = document.getElementById('modal-container');
    
    modalContainer.classList.remove('hidden');
    modalContainer.classList.add('flex');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

// Hàm ẩn custom modal
function hideModal() {
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modalContainer.classList.add('hidden');
        modalContainer.classList.remove('flex');
    }, 300);
}

// Hàm hiển thị thông báo thành công
function showSuccess(message) {
    const actions = `
        <button onclick="hideModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150">
            Đã hiểu
        </button>
    `;
    showModal('Thành Công', message, actions);
}

// Hàm xử lý xác nhận xóa / hủy
function confirmDelete(id, entityType) {
    let title = 'Xác nhận Xóa';
    let message = `Bạn có chắc chắn muốn xóa mục có ID: ${id} (${entityType}) không?`;
    let deleteText = 'Xóa';
    let buttonClass = 'bg-red-600 hover:bg-red-700';

    if (entityType === 'order') {
        title = 'Xác nhận Hủy Đơn';
        message = `Bạn có chắc chắn muốn HỦY Đơn hàng ${id} này không? Thao tác này sẽ hoàn lại tồn kho đã giữ chỗ.`;
        deleteText = 'Hủy Đơn';
    }

    const actions = `
        <button onclick="hideModal()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-150">
            Hủy
        </button>
        <button onclick="performDelete('${id}', '${entityType}')" class="px-4 py-2 ${buttonClass} text-white rounded-lg transition duration-150">
            ${deleteText}
        </button>
    `;
    showModal(title, message, actions);
}

// Hàm thực hiện xóa
function performDelete(id, entityType) {
    hideModal();
    if (entityType === 'book') {
        const bookId = parseInt(id, 10);
        adminApiRequest(`/books/${bookId}`, {
            method: "DELETE",
        })
            .then(() => {
                showSuccess(`Đã xóa Sách ${id} khỏi hệ thống (đánh dấu ngưng kinh doanh).`);
                return loadBooksFromBackend();
            })
            .then(() => {
                renderBookList(books);
            })
            .catch((err) => {
                console.error(err);
                showModal('Lỗi', 'Không thể xóa sách trên hệ thống backend.', `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            });
    } else if (entityType === 'category') {
        const isUsed = books.some(
            (book) => book.TheLoai === categories.find((c) => c.MaDanhMuc === id)?.TenDanhMuc,
        );
        if (isUsed) {
            showModal('Lỗi', `Không thể xóa danh mục "${id}" vì đang có sách sử dụng.`, `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            return;
        }
        const categoryId = parseInt(id, 10);
        if (Number.isNaN(categoryId)) {
            showModal('Lỗi', 'Mã Danh Mục không hợp lệ, không thể xóa trên backend.', `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            return;
        }
        adminApiRequest(`/categories/${categoryId}`, {
            method: "DELETE",
        })
            .then(() => {
                showSuccess(`Đã xóa Danh Mục ${id} khỏi hệ thống!`);
                return loadCategoriesFromBackend();
            })
            .then(() => {
                renderCategoryList(categories);
            })
            .catch((err) => {
                console.error(err);
                showModal('Lỗi', 'Không thể xóa Danh Mục trên hệ thống backend.', `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            });
    } else if (entityType === 'order') {
        // Chỉ cho phép hủy/xóa đơn hàng chưa được xử lý (cho_xac_nhan)
        const orderIndex = orders.findIndex(o => o.ma_don_hang_code === id);
        if (orderIndex !== -1) {
            if (orders[orderIndex].trang_thai_don_hang === 'cho_xac_nhan') {
                updateOrderStatus(id, 'da_huy', true);
                showSuccess(`Đã hủy Đơn hàng ${id} thành công.`);
            } else {
                showModal('Lỗi', `Chỉ có thể hủy đơn hàng đang ở trạng thái "Chờ xác nhận".`, `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            }
        }
    }
}

// Hàm chuyển đổi Sidebar (cho Mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isHidden = sidebar.classList.contains('-translate-x-full');

    if (isHidden) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden', 'opacity-0');
        overlay.classList.add('block', 'opacity-50');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.remove('block', 'opacity-50');
        overlay.classList.add('hidden', 'opacity-0');
    }
}

// --- SPA Routing và View Rendering ---

/**
 * Hàm chuyển đổi view chính.
 * @param {string} viewId - ID của view muốn hiển thị.
 * @param {Object} [item=null] - Dữ liệu của mục nếu đang ở chế độ cập nhật/xem.
 */
function showView(viewId, item = null) {
    document.getElementById('view-container').innerHTML = '';
    editingItemId = null; // Reset ID đang chỉnh sửa
    
    // Ẩn sidebar trên mobile khi chuyển view
    if (window.innerWidth < 768) { 
         const sidebar = document.getElementById('sidebar');
         if (!sidebar.classList.contains('-translate-x-full')) {
            toggleSidebar();
         }
    }

    // Cập nhật productOptions cho Đơn hàng
    productOptions = books.map(b => `<option value="${b.MaSach}" data-price="${b.GiaBan}" data-sku="${b.MaSKU}">${b.TenSach} (${b.GiaBan.toLocaleString('vi-VN')} VNĐ) - Tồn sẵn: ${b.SoLuongTon - b.SoLuongGiuCho}</option>`).join('');


    switch (viewId) {
        case 'home':
            renderHomeView();
            break;
        case 'book-list':
            renderBookList(books);
            break;
        case 'book-add':
            renderBookForm('add');
            break;
        case 'book-update':
            editingItemId = item.MaSach;
            renderBookForm('update', item);
            break;
        case 'category-list':
            renderCategoryList(categories);
            break;
        case 'category-add':
            renderCategoryForm('add');
            break;
        case 'category-update':
            editingItemId = item.MaDanhMuc;
            renderCategoryForm('update', item);
            break;
        case 'order-list':
            renderOrderList(orders);
            break;
        case 'order-add':
            renderOrderForm('add');
            break;
        case 'order-update':
            editingItemId = item.ma_don_hang_code;
            renderOrderForm('update', item);
            break;
        case 'reports': // Báo cáo & Thống kê
            renderReportView(item);
            break;
        default:
            renderHomeView();
    }
}

// --- 1. Trang Chủ ---
function renderHomeView() {
    document.getElementById('view-container').innerHTML = `
        <div class="p-8 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center h-full min-h-[500px]">
            <h2 class="text-3xl font-extrabold text-gray-800 mb-3">Chào mừng</h2>
            <p class="text-4xl font-black text-indigo-600">HỆ THỐNG QUẢN LÝ SÁCH & ĐƠN HÀNG</p>
            <p class="mt-6 text-lg text-gray-500">Sử dụng thanh menu bên trái để bắt đầu quản lý.</p>
        </div>
    `;
}

// --- 2. Quản Lý Sách ---

// Hàm hiển thị chi tiết sách trong Modal
function showBookDetails(bookId) {
    const book = books.find(b => b.MaSach === bookId);
    if (!book) {
        showModal('Lỗi', `Không tìm thấy sách có mã: ${bookId}`, `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
        return;
    }
    
    // Tạo danh sách ảnh giả lập
    const imagesHtml = book.Images && book.Images.length > 0 ? 
        book.Images.map(img => `<span class="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">${img} (mock)</span>`).join(' ') :
        '<span class="text-gray-500 italic">Không có ảnh.</span>';

    const detailHtml = `
        <div class="space-y-3 text-sm">
            <p class="border-b pb-1"><strong>Mã Sách:</strong> <span class="float-right font-mono text-gray-800">${book.MaSach}</span></p>
            <p class="border-b pb-1"><strong>Mã SKU:</strong> <span class="float-right font-mono text-gray-800">${book.MaSKU}</span></p>
            <p class="border-b pb-1"><strong>Tên Sách:</strong> <span class="float-right font-medium text-gray-800">${book.TenSach}</span></p>
            <p class="border-b pb-1"><strong>Tác Giả:</strong> <span class="float-right text-gray-800">${book.TacGia}</span></p>
            <p class="border-b pb-1"><strong>Thể Loại:</strong> <span class="float-right text-indigo-600 font-semibold">${book.TheLoai}</span></p>
            <p class="border-b pb-1"><strong>Giá Bán:</strong> <span class="float-right text-green-600 font-bold">${book.GiaBan.toLocaleString('vi-VN')} VNĐ</span></p>
            <p class="border-b pb-1"><strong>Tồn Kho (Thực):</strong> <span class="float-right text-gray-800">${book.SoLuongTon}</span></p>
            <p class="border-b pb-1"><strong>Số lượng Giữ chỗ:</strong> <span class="float-right text-red-600">${book.SoLuongGiuCho}</span></p>
            <p class="border-b pb-1"><strong>Tồn Kho Sẵn Sàng:</strong> <span class="float-right text-blue-600 font-bold">${book.SoLuongTon - book.SoLuongGiuCho}</span></p>
            <p class="border-b pb-1"><strong>NXB:</strong> <span class="float-right text-gray-800">${book.NhaXuatBan}</span></p>
            <div class="pt-2">
                <p class="font-bold mb-1">Mô Tả:</p>
                <p class="text-gray-700 italic border p-2 rounded-lg bg-gray-50 max-h-32 overflow-y-auto">${book.MoTa || 'Không có mô tả.'}</p>
            </div>
            <div class="pt-2">
                <p class="font-bold mb-1">Ảnh Sản Phẩm:</p>
                <div class="space-x-1 space-y-1">${imagesHtml}</div>
            </div>
        </div>
    `;

    const actions = `
        <button onclick="hideModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150">
            Đóng
        </button>
    `;

    showModal(`Chi Tiết Sách: ${book.MaSach}`, detailHtml, actions, 'max-w-xl'); 
}

function renderBookList(bookList) {
      const sortedBooks = bookSortField
          ? [...bookList].sort((a, b) => {
                const dir = bookSortDirection === 'desc' ? -1 : 1;
                switch (bookSortField) {
                    case 'MaSKU':
                        return a.MaSKU.localeCompare(b.MaSKU) * dir;
                    case 'TacGia':
                        return (a.TacGia || '').localeCompare(b.TacGia || '') * dir;
                    case 'TheLoai':
                        return (a.TheLoai || '').localeCompare(b.TheLoai || '') * dir;
                    case 'NgonNgu':
                        return (a.NgonNgu || '').localeCompare(b.NgonNgu || '') * dir;
                    case 'GiaBan':
                        return (a.GiaBan - b.GiaBan) * dir;
                    case 'TonKho': {
                        const avA = a.SoLuongTon - a.SoLuongGiuCho;
                        const avB = b.SoLuongTon - b.SoLuongGiuCho;
                        return (avA - avB) * dir;
                    }
                    default:
                        return 0;
                }
            })
          : [...bookList];

      const bookRows = sortedBooks.map(book => `
          <tr class="hover:bg-indigo-50 transition duration-150">
              <td class="px-4 py-3 border-t whitespace-nowrap">${book.MaSKU}</td>
              <td class="px-4 py-3 border-t font-medium">${book.TenSach}</td>
            <td class="px-4 py-3 border-t">${book.TacGia}</td>
            <td class="px-4 py-3 border-t">${book.TheLoai}</td>
            <td class="px-4 py-3 border-t">${book.NgonNgu}</td>
            <td class="px-4 py-3 border-t whitespace-nowrap">${book.GiaBan.toLocaleString('vi-VN')} VNĐ</td>
            <td class="px-4 py-3 border-t text-sm ${book.SoLuongTon - book.SoLuongGiuCho < 50 ? 'text-red-500 font-bold' : 'text-green-600'}">${book.SoLuongTon - book.SoLuongGiuCho}</td>
            <td class="px-4 py-3 border-t text-center space-x-2 flex justify-center items-center">
                <button onclick="showBookDetails('${book.MaSach}')" class="text-gray-500 hover:text-indigo-600 transition duration-150 p-1 rounded-full hover:bg-gray-100" title="Xem Chi Tiết">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
                <button onclick="showView('book-update', books.find(b => b.MaSach === '${book.MaSach}'))" class="text-indigo-600 hover:text-indigo-800 transition duration-150 p-1 rounded-full hover:bg-indigo-100" title="Cập nhật">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="confirmDelete('${book.MaSach}', 'book')" class="text-red-600 hover:text-red-800 transition duration-150 p-1 rounded-full hover:bg-red-100" title="Xóa">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('view-container').innerHTML = `
        <div class="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Quản Lý Thông Tin Sách</h2>
            
            <div class="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                <div class="flex space-x-3 w-full sm:w-auto">
                    <button onclick="showView('book-add')" class="flex items-center px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Thêm Sách Mới
                    </button>
                </div>
                <div class="flex w-full sm:w-2/3 space-x-2">
                    <select id="book-search-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                        <option value="TenSach">Tên Sách</option>
                        <option value="TacGia">Tác Giả</option>
                        <option value="MaSKU">Mã SKU</option>
                        <option value="TheLoai">Thể Loại</option>
                    </select>
                    
                    <input type="text" id="book-search-input" placeholder="Nhập từ khóa tìm kiếm..." class="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                    <button onclick="searchBooks()" class="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-r-lg hover:bg-gray-300 transition duration-150">
                        Tìm kiếm
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onclick="setBookSort('MaSKU')">
                                Mã SKU
                                <span class="inline-block ml-1 text-gray-400">${bookSortField === 'MaSKU' ? (bookSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tên Sách</th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onclick="setBookSort('TacGia')">
                                Tác Giả
                                <span class="inline-block ml-1 text-gray-400">${bookSortField === 'TacGia' ? (bookSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onclick="setBookSort('TheLoai')">
                                Thể Loại
                                <span class="inline-block ml-1 text-gray-400">${bookSortField === 'TheLoai' ? (bookSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onclick="setBookSort('NgonNgu')">
                                Ngôn ngữ
                                <span class="inline-block ml-1 text-gray-400">${bookSortField === 'NgonNgu' ? (bookSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onclick="setBookSort('GiaBan')">
                                Giá Bán
                                <span class="inline-block ml-1 text-gray-400">${bookSortField === 'GiaBan' ? (bookSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer select-none" onclick="setBookSort('TonKho')">
                                Tồn Sẵn
                                <span class="inline-block ml-1 text-gray-400">${bookSortField === 'TonKho' ? (bookSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                        ${bookRows}
                    </tbody>
                </table>
            </div>
            ${bookList.length === 0 ? '<p class="text-center py-8 text-gray-500">Không tìm thấy sách nào.</p>' : ''}
            </div>
        `;
}

function setBookSort(field) {
    if (bookSortField === field) {
        bookSortDirection = bookSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        bookSortField = field;
        bookSortDirection = 'asc';
    }
    renderBookList(books);
}

// Hàm tìm kiếm Sách (Đã cập nhật bộ lọc)
function searchBooks() {
    const query = document.getElementById('book-search-input').value.toLowerCase().trim();
    const filterBy = document.getElementById('book-search-filter').value;
    
    const filteredBooks = books.filter(book => {
        let valueToSearch = '';
        switch (filterBy) {
            case 'TenSach':
                valueToSearch = book.TenSach;
                break;
            case 'TacGia':
                valueToSearch = book.TacGia;
                break;
            case 'MaSach':
                valueToSearch = book.MaSach;
                break;
            case 'MaSKU':
                valueToSearch = book.MaSKU;
                break;
            case 'TheLoai':
                valueToSearch = book.TheLoai;
                break;
            default:
                return (
                    book.TenSach.toLowerCase().includes(query) || 
                    book.TacGia.toLowerCase().includes(query) ||
                    book.MaSach.toLowerCase().includes(query) ||
                    book.MaSKU.toLowerCase().includes(query) ||
                    (book.TheLoai && book.TheLoai.toLowerCase().includes(query))
                );
        }
        return valueToSearch.toLowerCase().includes(query);
    });
    renderBookList(filteredBooks);
}

// Hàm render form Thêm/Cập nhật Sách (Sử dụng dữ liệu categories)
function renderBookForm(mode, bookData = {}) {
    const isUpdate = mode === 'update';
    const title = isUpdate ? `Cập Nhật Sách: ${bookData.MaSach}` : 'Thêm Sách Mới';
    const submitText = isUpdate ? 'Cập nhật Sách' : 'Thêm Sách Mới';
    
    // Lấy danh sách tên danh mục từ mảng categories
    const categoryOptions = categories.map(c => c.TenDanhMuc);
    
    // Tạo danh sách tên ảnh giả lập cho chế độ Update
    const currentImagesHtml = (isUpdate && bookData.Images && bookData.Images.length > 0) ?
        bookData.Images.map(img => `
            <div class="flex items-center space-x-2 text-sm text-gray-700 bg-gray-100 p-2 rounded-md">
                <span>${img}</span>
                <button type="button" onclick="this.closest('div').remove()" class="text-red-500 hover:text-red-700">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <input type="hidden" name="existing_images" value="${img}">
            </div>
        `).join('') : '<p class="text-sm text-gray-500 italic" id="no-current-images">Không có ảnh hiện tại.</p>';


    // Định nghĩa các trường dữ liệu
    const fields = [
        { id: 'MaSach', label: 'Mã Sách (Mã SP)', type: 'text', value: bookData.MaSach || '', readOnly: isUpdate },
        { id: 'MaSKU', label: 'Mã SKU', type: 'text', value: bookData.MaSKU || '' },
        { id: 'TenSach', label: 'Tên Sách', type: 'text', value: bookData.TenSach || '' },
        { id: 'TacGia', label: 'Tác Giả', type: 'text', value: bookData.TacGia || '' },
        {
            id: 'TheLoai',
            label: 'Thể Loại',
            type: 'select',
              // Khi cập nhật: giữ nguyên thể loại hiện tại của sách
              // Khi thêm mới: mặc định option đầu tiên (nếu có)
              value: isUpdate ? (bookData.TheLoai || '') : (categoryOptions[0] || ''),
              options: categoryOptions,
          },
        {
            id: 'NgonNgu',
            label: 'Ngôn ngữ',
            type: 'select',
            value: bookData.NgonNgu || 'vi',
            options: ['vi', 'en', 'ja', 'fr'],
        },
        { id: 'GiaBan', label: 'Giá Bán (VNĐ)', type: 'number', value: bookData.GiaBan || '' },
        { id: 'SoLuongTon', label: 'Số Lượng Tồn Kho', type: 'number', value: bookData.SoLuongTon || 0, readOnly: isUpdate },
        { id: 'NhaXuatBan', label: 'Nhà Xuất Bản', type: 'text', value: bookData.NhaXuatBan || '' },
        { id: 'MoTa', label: 'Mô Tả', type: 'textarea', value: bookData.MoTa || '' },
        { id: 'AnhBia', label: 'Ảnh bìa (URL hoặc đường dẫn)', type: 'text', value: (bookData.Images && bookData.Images[0]) || '' },
    ];

    const formFieldsHtml = fields.map(field => `
        <div class="${field.type === 'textarea' ? 'sm:col-span-2' : 'sm:col-span-1'}">
            <label for="${field.id}" class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
            ${field.type === 'select' ? `
                ${
                    field.id === 'NgonNgu'
                        ? (() => {
                              const langValue = field.value || 'vi';
                              return `
                                <select id="NgonNgu" name="NgonNgu" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                                    <option value="vi" ${langValue === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
                                    <option value="en" ${langValue === 'en' ? 'selected' : ''}>Tiếng Anh</option>
                                    <option value="ja" ${langValue === 'ja' ? 'selected' : ''}>Tiếng Nhật</option>
                                    <option value="fr" ${langValue === 'fr' ? 'selected' : ''}>Tiếng Pháp</option>
                                </select>
                              `;
                          })()
                        : `<select id="${field.id}" name="${field.id}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" ${
                              field.readOnly ? 'readonly disabled' : ''
                          }>
                               ${(field.options || [])
                                   .map(
                                       (opt) =>
                                           `<option value="${opt}" ${
                                               opt === field.value ? 'selected' : ''
                                           }>${opt}</option>`,
                                   )
                                   .join('')}
                           </select>`
                }
            ` : field.type === 'textarea' ? `
                <textarea id="${field.id}" name="${field.id}" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">${field.value}</textarea>
            ` : `
                <input type="${field.type}" id="${field.id}" name="${field.id}" value="${field.value}" ${field.readOnly ? 'readonly class="bg-gray-100"' : ''} 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            `}
        </div>
    `).join('');

    document.getElementById('view-container').innerHTML = `
        <div class="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">${title}</h2>
            <form id="book-form">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    ${formFieldsHtml}
                </div>
                
                <div class="sm:col-span-2 mb-8 border-t pt-4">
                    <h3 class="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Quản Lý Hình Ảnh</h3>
                    
                    <div class="mb-4">
                        <label for="image_upload" class="block text-sm font-medium text-gray-700 mb-1">Chọn Ảnh Mới (Nhiều file)</label>
                        <input type="file" id="image_upload" name="image_upload[]" multiple accept="image/*" 
                               onchange="displayNewImages(event)"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    
                    ${isUpdate ? `
                        <div class="mb-4">
                            <p class="text-sm font-medium text-gray-700 mb-1">Ảnh Hiện Tại (Nhấp vào để xóa):</p>
                            <div id="current-images-list" class="flex flex-wrap gap-2">
                                ${currentImagesHtml}
                            </div>
                        </div>
                    ` : ''}

                    <div class="mb-4">
                         <p class="text-sm font-medium text-gray-700 mb-1">Ảnh Mới Sẽ Tải Lên:</p>
                        <div id="new-images-preview" class="flex flex-wrap gap-2 text-sm text-yellow-700 italic">
                            </div>
                    </div>
                </div>
                
                ${isUpdate ? `
                <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 mb-6 rounded-r-lg sm:col-span-2">
                    <p class="text-sm text-yellow-700"><b>Lưu ý:</b> Số lượng tồn kho được quản lý thông qua quy trình Nhập/Xuất kho riêng biệt (chức năng giả lập). Trường này chỉ để hiển thị.</p>
                </div>
                ` : ''}
                <div class="flex justify-end space-x-4 border-t pt-4 sm:col-span-2">
                    <button type="button" onclick="showView('book-list')" class="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition duration-150">
                        Hủy
                    </button>
                    <button type="submit" class="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150">
                        ${submitText}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Gán event listener cho form sau khi nó được render
    document.getElementById('book-form').onsubmit = (e) => handleBookSubmit(e, mode);
}

// Hàm hiển thị tên file ảnh mới được chọn
function displayNewImages(event) {
    const fileList = event.target.files;
    const previewContainer = document.getElementById('new-images-preview');
    previewContainer.innerHTML = '';
    
    if (fileList.length > 0) {
        for (const file of fileList) {
            const fileElement = document.createElement('div');
            fileElement.className = 'bg-yellow-50 text-yellow-800 px-2 py-1 rounded';
            fileElement.innerText = file.name;
            previewContainer.appendChild(fileElement);
        }
    }
}


// Hàm xử lý submit form Sách (ĐÃ CẬP NHẬT LOGIC ẢNH)
function handleBookSubmit(event, mode) {
    event.preventDefault();
    const form = event.target;
    
    // 1. Thu thập ảnh hiện tại (chỉ áp dụng cho update)
    let finalImages = [];
    if (mode === 'update') {
        const existingImageInputs = form.querySelectorAll('input[name="existing_images"]');
        existingImageInputs.forEach(input => {
            finalImages.push(input.value);
        });
    }

    // 2. Thu thập ảnh mới (Giả lập)
    const newImageInput = document.getElementById('image_upload');
    if (newImageInput && newImageInput.files.length > 0) {
        for (const file of newImageInput.files) {
            // Giả lập lưu trữ tên file mới
            finalImages.push(`new_${file.name}`);
        }
    }


    const payload = {
        ma_sku: form.MaSKU.value.trim().toUpperCase(),
        ten_sach: form.TenSach.value.trim(),
        gia_ban: parseInt(form.GiaBan.value, 10) || 0,
        gia_bia: parseInt(form.GiaBan.value, 10) || 0,
        mo_ta: form.MoTa.value,
        so_luong_ton: parseInt(form.SoLuongTon.value, 10) || 0,
        trang_thai: "active",
        anh_bia: form.AnhBia.value.trim() || null,
        ngon_ngu: form.NgonNgu ? form.NgonNgu.value.trim() || "vi" : "vi",
        author_name: form.TacGia ? form.TacGia.value.trim() || null : null,
        category_name: form.TheLoai ? form.TheLoai.value.trim() || null : null,
        publisher_name: form.NhaXuatBan ? form.NhaXuatBan.value.trim() || null : null,
    };

    if (!payload.ma_sku || !payload.ten_sach) {
        showModal('Lỗi', 'Vui lòng nhập đầy đủ Mã SKU và Tên Sách.', `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
        return;
    }

    if (mode === 'add') {
        adminApiRequest("/books", {
            method: "POST",
            body: JSON.stringify(payload),
        })
            .then((created) => {
                showSuccess('Đã thêm Sách mới vào hệ thống!');
                return loadBooksFromBackend();
            })
            .then(() => {
                showView('book-list');
            })
            .catch((err) => {
                console.error(err);
                showModal('Lỗi', 'Không thể thêm sách vào hệ thống backend.', `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            });
    } else if (mode === 'update') {
        const bookId = parseInt(editingItemId, 10);
        adminApiRequest(`/books/${bookId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        })
            .then(() => {
                showSuccess(`Đã cập nhật Sách ${editingItemId} trên hệ thống!`);
                return loadBooksFromBackend();
            })
            .then(() => {
                showView('book-list');
            })
            .catch((err) => {
                console.error(err);
                showModal('Lỗi', 'Không thể cập nhật sách trên hệ thống backend.', `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            });
    }
}

// --- 3. Quản Lý Danh Mục (Categories) ---

// Hàm hiển thị chi tiết danh mục trong Modal
function showCategoryDetails(categoryCode) {
    const category = categories.find(c => c.MaDanhMuc === categoryCode);
    if (!category) {
        showModal('Lỗi', `Không tìm thấy danh mục có mã: ${categoryCode}`, `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
        return;
    }

    const detailHtml = `
        <div class="space-y-3 text-sm">
            <p class="border-b pb-1"><strong>Mã Danh Mục:</strong> <span class="float-right font-mono text-gray-800">${category.MaDanhMuc}</span></p>
            <p class="border-b pb-1"><strong>Tên Danh Mục:</strong> <span class="float-right font-medium text-indigo-600">${category.TenDanhMuc}</span></p>
            <div class="pt-2">
                <p class="font-bold mb-1">Mô Tả:</p>
                <p class="text-gray-700 italic border p-2 rounded-lg bg-gray-50 max-h-32 overflow-y-auto">${category.MoTa || 'Không có mô tả.'}</p>
            </div>
            
        </div>
    `;

    const actions = `
        <button onclick="hideModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150">
            Đóng
        </button>
    `;

    showModal(`Chi Tiết Danh Mục: ${category.MaDanhMuc}`, detailHtml, actions, 'max-w-md'); 
}

function renderCategoryList(categoryList) {
      const sortedCategories = [...categoryList].sort((a, b) => {
          const dir = categorySortDirection === 'desc' ? -1 : 1;
          if (categorySortField === 'MaDanhMuc') {
              return a.MaDanhMuc.localeCompare(b.MaDanhMuc) * dir;
          }
          if (categorySortField === 'TenDanhMuc') {
              return (a.TenDanhMuc || '').localeCompare(b.TenDanhMuc || '') * dir;
          }
          return 0;
      });

      const categoryRows = sortedCategories.map(cat => `
        <tr class="hover:bg-indigo-50 transition duration-150">
            <td class="px-4 py-3 border-t whitespace-nowrap">${cat.MaDanhMuc}</td>
            <td class="px-4 py-3 border-t font-medium">${cat.TenDanhMuc}</td>
            <td class="px-4 py-3 border-t text-sm text-gray-600">${cat.MoTa}</td>
            <td class="px-4 py-3 border-t text-center space-x-2 flex justify-center items-center">
                <button onclick="showCategoryDetails('${cat.MaDanhMuc}')" class="text-gray-500 hover:text-indigo-600 transition duration-150 p-1 rounded-full hover:bg-gray-100" title="Xem Chi Tiết">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
                <button onclick="showView('category-update', categories.find(c => c.MaDanhMuc === '${cat.MaDanhMuc}'))" class="text-indigo-600 hover:text-indigo-800 transition duration-150 p-1 rounded-full hover:bg-indigo-100" title="Cập nhật">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </button>
                <button onclick="confirmDelete('${cat.MaDanhMuc}', 'category')" class="text-red-600 hover:text-red-800 transition duration-150 p-1 rounded-full hover:bg-red-100" title="Xóa">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('view-container').innerHTML = `
        <div class="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Quản Lý Danh Mục Sách</h2>
            
            <div class="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                <div class="flex space-x-3 w-full sm:w-auto">
                    <button onclick="showView('category-add')" class="flex items-center px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Thêm Danh Mục
                    </button>
                </div>
                <div class="flex w-full sm:w-2/3 space-x-2">
                    <input type="text" id="category-search-input" placeholder="Tìm kiếm theo Mã hoặc Tên Danh Mục..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                    <button onclick="searchCategories()" class="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-r-lg hover:bg-gray-300 transition duration-150">
                        Tìm kiếm
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/5 cursor-pointer select-none" onclick="setCategorySort('MaDanhMuc')">
                                Mã Danh Mục
                                <span class="inline-block ml-1 text-gray-400">${categorySortField === 'MaDanhMuc' ? (categorySortDirection === 'asc' ? '▲' : '▼') : ''}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4 cursor-pointer select-none" onclick="setCategorySort('TenDanhMuc')">
                                Tên Danh Mục
                                <span class="inline-block ml-1 text-gray-400">${categorySortField === 'TenDanhMuc' ? (categorySortDirection === 'asc' ? '▲' : '▼') : ''}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mô Tả</th>
                            <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                        ${categoryRows}
                    </tbody>
                </table>
            </div>
            ${categoryList.length === 0 ? '<p class="text-center py-8 text-gray-500">Không tìm thấy danh mục nào.</p>' : ''}
        </div>
    `;
}

function setCategorySort(field) {
    if (categorySortField === field) {
        categorySortDirection = categorySortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        categorySortField = field;
        categorySortDirection = 'asc';
    }
    renderCategoryList(categories);
}

function setOrderSort(field) {
    if (orderSortField === field) {
        orderSortDirection = orderSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        orderSortField = field;
        orderSortDirection = 'asc';
    }
    renderOrderList(orders);
}

// Hàm tìm kiếm Danh mục
function searchCategories() {
    const query = document.getElementById('category-search-input').value.toLowerCase().trim();
    const filteredCategories = categories.filter(cat => 
        cat.MaDanhMuc.toLowerCase().includes(query) || 
        cat.TenDanhMuc.toLowerCase().includes(query)
    );
    renderCategoryList(filteredCategories);
}

// Hàm render form Thêm/Cập nhật Danh mục
function renderCategoryForm(mode, catData = {}) {
    const isUpdate = mode === 'update';
    const title = isUpdate ? `Cập Nhật Danh Mục: ${catData.MaDanhMuc}` : 'Thêm Danh Mục Mới';
    const submitText = isUpdate ? 'Cập nhật Danh Mục' : 'Thêm Danh Mục Mới';
    
    // Định nghĩa các trường dữ liệu
    const fields = [
        { id: 'MaDanhMuc', label: 'Mã Danh Mục (Code)', type: 'text', value: catData.MaDanhMuc || '', readOnly: isUpdate },
        { id: 'TenDanhMuc', label: 'Tên Danh Mục', type: 'text', value: catData.TenDanhMuc || '' },
        { id: 'MoTa', label: 'Mô Tả Chi Tiết', type: 'textarea', value: catData.MoTa || '' },
    ];

    const formFieldsHtml = fields.map(field => `
        <div class="${field.type === 'textarea' ? 'sm:col-span-2' : 'sm:col-span-1'}">
            <label for="${field.id}" class="block text-sm font-medium text-gray-700 mb-1">${field.label}</label>
            ${field.type === 'textarea' ? `
                <textarea id="${field.id}" name="${field.id}" rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">${field.value}</textarea>
            ` : `
                <input type="${field.type}" id="${field.id}" name="${field.id}" value="${field.value}" ${field.readOnly ? 'readonly class="bg-gray-100"' : ''} 
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            `}
        </div>
    `).join('');

    document.getElementById('view-container').innerHTML = `
        <div class="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">${title}</h2>
            <form id="category-form">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    ${formFieldsHtml}
                </div>
                <div class="flex justify-end space-x-4 border-t pt-4">
                    <button type="button" onclick="showView('category-list')" class="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition duration-150">
                        Hủy
                    </button>
                    <button type="submit" class="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150">
                        ${submitText}
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Gán event listener cho form sau khi nó được render
    document.getElementById('category-form').onsubmit = (e) => handleCategorySubmit(e, mode);
}

// Hàm xử lý submit form Danh mục
function handleCategorySubmit(event, mode) {
    event.preventDefault();
    const form = event.target;
    
    const tenDanhMuc = form.TenDanhMuc.value.trim();
    const moTa = form.MoTa.value;

    if (!tenDanhMuc) {
        showModal(
            'Lỗi',
            'Vui lòng nhập Tên Danh Mục.',
            `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`,
        );
        return;
    }

    const payload = {
        ten_the_loai: tenDanhMuc,
        ma_the_loai_cha: null,
    };

    if (mode === 'add') {
        adminApiRequest("/categories", {
            method: "POST",
            body: JSON.stringify(payload),
        })
            .then(() => {
                showSuccess('Đã thêm Danh Mục mới vào hệ thống!');
                return loadCategoriesFromBackend();
            })
            .then(() => {
                showView('category-list');
            })
            .catch((err) => {
                console.error(err);
                showModal(
                    'Lỗi',
                    'Không thể thêm Danh Mục trên hệ thống backend.',
                    `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`,
                );
            });
    } else if (mode === 'update') {
        const categoryId = parseInt(editingItemId, 10);
        if (Number.isNaN(categoryId)) {
            showModal(
                'Lỗi',
                'Mã Danh Mục không hợp lệ, không thể cập nhật trên backend.',
                `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`,
            );
            return;
        }

        adminApiRequest(`/categories/${categoryId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        })
            .then(() => {
                showSuccess(`Đã cập nhật Danh Mục ${editingItemId} trên hệ thống!`);
                return loadCategoriesFromBackend();
            })
            .then(() => {
                showView('category-list');
            })
            .catch((err) => {
                console.error(err);
                showModal(
                    'Lỗi',
                    'Không thể cập nhật Danh Mục trên hệ thống backend.',
                    `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`,
                );
            });
    }
}

// --- 4. Quản Lý Đơn Hàng ---

// Hàm cập nhật trạng thái đơn hàng và điều chỉnh tồn kho
function updateOrderStatus(orderCode, newStatus, isCancel = false) {
    const order = orders.find(o => o.ma_don_hang_code === orderCode);
    if (!order) return false;

    const orderId = order.ma_don_hang;
    if (!orderId) {
        console.warn('Order is missing ma_don_hang id, cannot sync to backend');
        return false;
    }

    adminApiRequest(`/admin/orders/${orderId}/status?new_status=${encodeURIComponent(newStatus)}`, {
        method: "POST",
    })
        .then(() => {
            showSuccess(`Đã cập nhật Đơn hàng ${orderCode} sang trạng thái: ${orderStatuses[newStatus].label}!`);
            return loadAdminOrdersFromBackend();
        })
        .then(() => {
            renderOrderList(orders);
        })
        .catch((err) => {
            console.error(err);
            showModal(
                'Lỗi',
                'Không thể cập nhật trạng thái Đơn hàng trên hệ thống backend.',
                `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`,
            );
        });

    return true;
}

// Hàm cập nhật trạng thái THANH TOÁN
function updatePaymentStatus(orderCode, newPaymentStatus) {
    const order = orders.find(o => o.ma_don_hang_code === orderCode);
    if (!order) return false;

    const orderId = order.ma_don_hang;
    if (!orderId) {
        console.warn('Order is missing ma_don_hang id, cannot sync payment status');
        return false;
    }

    adminApiRequest(`/admin/orders/${orderId}/payment-status?new_payment_status=${encodeURIComponent(newPaymentStatus)}`, {
        method: "POST",
    })
        .then(() => {
            showSuccess(
                `Đã cập nhật Trạng thái Thanh toán của Đơn hàng ${orderCode} sang: ${paymentStatuses[newPaymentStatus].label}!`,
            );
            return loadAdminOrdersFromBackend();
        })
        .then(() => {
            renderOrderList(orders);
        })
        .catch((err) => {
            console.error(err);
            showModal(
                'Lỗi',
                'Không thể cập nhật Trạng thái Thanh toán trên hệ thống backend.',
                `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`,
            );
        });

    return true;
}


// Hàm hiển thị chi tiết đơn hàng trong Modal
function showOrderDetails(orderCode) {
    const order = orders.find(o => o.ma_don_hang_code === orderCode);
    if (!order) { /* ... xử lý lỗi... */ return; }

    const address = order.dia_chi_giao_json;

    const productsHtml = order.chi_tiet.map(item => `
        <li class="flex justify-between py-1 text-gray-700">
            <span>${item.TenSach} (x${item.SoLuong})</span>
            <span class="font-medium">${(item.SoLuong * item.GiaBan).toLocaleString('vi-VN')} VNĐ</span>
        </li>
    `).join('');

    const detailHtml = `
        <div class="space-y-4 text-sm">
            <div class="grid grid-cols-2 gap-x-4 border-b pb-3">
                <p><strong>Mã Đơn:</strong> <span class="float-right font-mono">${order.ma_don_hang_code}</span></p>
                <p><strong>Ngày Tạo:</strong> <span class="float-right">${order.ngay_tao}</span></p>
                <p><strong>Khách Hàng:</strong> <span class="float-right">${order.ma_khach_hang || 'Khách Vãng Lai'}</span></p>
                <p><strong>SĐT:</strong> <span class="float-right">${order.so_dien_thoai}</span></p>
            </div>

            <div class="border-b pb-3 grid grid-cols-2 gap-4">
                <div>
                    <p class="font-bold mb-1">Trạng thái Đơn hàng:</p>
                    <div class="flex justify-between">
                        <span>Trạng thái:</span>
                        <span class="font-bold text-base ${orderStatuses[order.trang_thai_don_hang].color.replace('bg-', 'text-').replace('-100', '-800')}">${orderStatuses[order.trang_thai_don_hang].label}</span>
                    </div>
                </div>
                <div>
                    <p class="font-bold mb-1">Trạng thái Thanh toán:</p>
                    <div class="flex justify-between">
                        <span>Trạng thái:</span>
                        <span class="font-bold text-base ${paymentStatuses[order.trang_thai_thanh_toan].color.replace('bg-', 'text-').replace('-500', '-700')}">${paymentStatuses[order.trang_thai_thanh_toan].label}</span>
                    </div>
                </div>
            </div>

            <div class="border-b pb-3">
                <p class="font-bold mb-1">Địa chỉ Giao hàng:</p>
                <p class="text-gray-700">${order.ten_nguoi_nhan}</p>
                <p class="text-gray-500 text-xs">${address.full}</p>
            </div>
            
            <div class="border-b pb-3">
                <p class="font-bold mb-1">Sản phẩm (${order.chi_tiet.length}):</p>
                <ul class="list-disc list-inside text-xs space-y-1 pl-2 max-h-40 overflow-y-auto">
                    ${productsHtml}
                </ul>
            </div>

            <div class="pt-2 font-semibold space-y-1">
                <div class="flex justify-between"><span>Tổng tiền hàng:</span><span class="font-normal">${order.tong_tien_hang.toLocaleString('vi-VN')} VNĐ</span></div>
                <div class="flex justify-between pt-2 border-t border-dashed">
                    <span class="text-lg">Tổng Thanh Toán:</span>
                    <span class="text-lg text-indigo-600">${order.tong_thanh_toan.toLocaleString('vi-VN')} VNĐ</span>
                </div>
            </div>
        </div>
    `;

    const actions = `
        <button onclick="hideModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150">
            Đóng
        </button>
    `;

    showModal(`Chi Tiết Đơn Hàng: ${order.ma_don_hang_code}`, detailHtml, actions, 'max-w-xl'); 
}

function renderOrderList(orderList) {
    // Tạo options cho thanh select trạng thái Đơn hàng (Bao gồm TẤT CẢ trạng thái)
    const allStatusOptions = Object.keys(orderStatuses).map(key => ({
        key: key,
        label: orderStatuses[key].label
    }));

    // Tạo options cho thanh select trạng thái Thanh toán (TẤT CẢ trạng thái)
    const allPaymentOptions = Object.keys(paymentStatuses).map(key => ({
        key: key,
        label: paymentStatuses[key].label
    }));

    const sortedOrders = orderSortField
        ? [...orderList].sort((a, b) => {
              const dir = orderSortDirection === 'desc' ? -1 : 1;
              switch (orderSortField) {
                  case 'ngay_tao':
                      return (a.ngay_tao || '').localeCompare(b.ngay_tao || '') * dir;
                  case 'tong_thanh_toan':
                      return (a.tong_thanh_toan - b.tong_thanh_toan) * dir;
                  case 'trang_thai_don_hang':
                      return (a.trang_thai_don_hang || '').localeCompare(b.trang_thai_don_hang || '') * dir;
                  case 'trang_thai_thanh_toan':
                      return (a.trang_thai_thanh_toan || '').localeCompare(b.trang_thai_thanh_toan || '') * dir;
                  default:
                      return 0;
              }
          })
        : [...orderList];

    const orderRows = sortedOrders.map(order => {
        const statusInfo = orderStatuses[order.trang_thai_don_hang];
        const paymentInfo = paymentStatuses[order.trang_thai_thanh_toan];

        // Tạo option cho select trạng thái Đơn hàng
        const statusSelectOptions = allStatusOptions.map(status => {
            const isCurrent = status.key === order.trang_thai_don_hang;
            
            // LOGIC: Luôn hiển thị TẤT CẢ các trạng thái trong dropdown
            return `<option value="${status.key}" ${isCurrent ? 'selected' : ''}>${status.label}</option>`;
        }).join('');
        
        // Tạo option cho select trạng thái Thanh toán
        const paymentSelectOptions = allPaymentOptions.map(payment => {
            const isCurrent = payment.key === order.trang_thai_thanh_toan;
            return `<option value="${payment.key}" ${isCurrent ? 'selected' : ''}>${payment.label}</option>`;
        }).join('');
        
        // Nút Hủy Đơn/Xóa (chỉ hiển thị khi trạng thái là 'cho_xac_nhan')
        const deleteButton = order.trang_thai_don_hang === 'cho_xac_nhan' ? `
            <button onclick="confirmDelete('${order.ma_don_hang_code}', 'order')" class="text-red-600 hover:text-red-800 transition duration-150 p-1 rounded-full hover:bg-red-100" title="Hủy Đơn">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        ` : '';
        
        // Gộp Xem Chi Tiết và Hủy/Xóa vào một cột duy nhất
        const actionButtons = `
            <button onclick="showOrderDetails('${order.ma_don_hang_code}')" class="text-gray-500 hover:text-indigo-600 transition duration-150 p-1 rounded-full hover:bg-gray-100" title="Xem Chi Tiết">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            ${deleteButton}
        `;


        return `
            <tr class="hover:bg-indigo-50 transition duration-150">
                <td class="px-4 py-3 border-t whitespace-nowrap">${order.ma_don_hang_code}</td>
                <td class="px-4 py-3 border-t font-medium whitespace-nowrap">${order.ten_nguoi_nhan}</td>
                <td class="px-4 py-3 border-t whitespace-nowrap">${order.ngay_tao}</td>
                <td class="px-4 py-3 border-t whitespace-nowrap">${order.tong_thanh_toan.toLocaleString('vi-VN')} VNĐ</td>
                
                <td class="px-4 py-3 border-t whitespace-nowrap">
                    <select onchange="updateOrderStatus('${order.ma_don_hang_code}', this.value)" 
                            class="px-2 py-1 text-xs font-semibold rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ${statusInfo.color.replace('bg-', 'text-').replace('-100', '-800')}">
                        ${statusSelectOptions}
                    </select>
                </td>
                
                <td class="px-4 py-3 border-t whitespace-nowrap">
                    <select onchange="updatePaymentStatus('${order.ma_don_hang_code}', this.value)" 
                            class="px-2 py-1 text-xs font-semibold rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ${paymentInfo.color.replace('bg-', 'text-').replace('-500', '-700')}">
                        ${paymentSelectOptions}
                    </select>
                </td>
                
                <td class="px-4 py-3 border-t text-center space-x-1 flex justify-center items-center">
                    ${actionButtons}
                </td>
            </tr>
        `;
    }).join('');

    // Thanh lựa chọn bộ lọc trạng thái (vẫn giữ nguyên)
    const statusOptions = Object.keys(orderStatuses).map(key => {
        const label = orderStatuses[key].label;
        return `<option value="${key}">${label}</option>`;
    }).join('');

    document.getElementById('view-container').innerHTML = `
        <div class="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Quản Lý Đơn Hàng</h2>
            
            <div class="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
                <div class="flex space-x-3 w-full sm:w-auto">
                    <button id="add-order-btn" class="flex items-center px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                        Tạo Đơn Hàng
                    </button>
                </div>
                
                <div class="flex w-full sm:w-2/3 space-x-2">
                    <select id="order-status-filter" onchange="searchOrders()" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                        <option value="all">-- Lọc theo Trạng thái --</option>
                        ${statusOptions}
                    </select>

                    <input type="text" id="order-search-input" placeholder="Tìm kiếm Mã Đơn/Người nhận/SĐT..." class="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                    <button onclick="searchOrders()" class="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-r-lg hover:bg-gray-300 transition duration-150">
                        Tìm kiếm
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Mã Đơn</th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Người Nhận</th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onclick="setOrderSort('ngay_tao')">
                                Ngày Tạo
                                <span class="inline-block ml-1 text-gray-400">${orderSortField === 'ngay_tao' ? (orderSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onclick="setOrderSort('tong_thanh_toan')">
                                Tổng Tiền
                                <span class="inline-block ml-1 text-gray-400">${orderSortField === 'tong_thanh_toan' ? (orderSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onclick="setOrderSort('trang_thai_don_hang')">
                                Trạng Thái Đơn
                                <span class="inline-block ml-1 text-gray-400">${orderSortField === 'trang_thai_don_hang' ? (orderSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onclick="setOrderSort('trang_thai_thanh_toan')">
                                Thanh Toán
                                <span class="inline-block ml-1 text-gray-400">${orderSortField === 'trang_thai_thanh_toan' ? (orderSortDirection === 'asc' ? '▲' : '▼') : '↕'}</span>
                            </th>
                            <th class="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-100 text-sm text-gray-700">
                        ${orderRows}
                    </tbody>
                </table>
            </div>
            ${orderList.length === 0 ? '<p class="text-center py-8 text-gray-500">Không tìm thấy đơn hàng nào.</p>' : ''}
        </div>
    `;
    
    // Gán Event Listener cho nút Tạo Đơn Hàng
    document.getElementById('add-order-btn').addEventListener('click', () => showView('order-add'));
}

// Hàm tìm kiếm và lọc Đơn hàng
function searchOrders() {
    const query = document.getElementById('order-search-input').value.toLowerCase().trim();
    const statusFilter = document.getElementById('order-status-filter').value;
    
    const filteredOrders = orders.filter(order => {
        const matchesQuery = (
            order.ma_don_hang_code.toLowerCase().includes(query) || 
            order.ten_nguoi_nhan.toLowerCase().includes(query) ||
            order.so_dien_thoai.includes(query)
        );

        const matchesStatus = (statusFilter === 'all' || order.trang_thai_don_hang === statusFilter);

        return matchesQuery && matchesStatus;
    });
    renderOrderList(filteredOrders);
}

// Hàm render form Tạo Đơn Hàng Mới
function renderOrderForm(mode, orderData = {}) {
    const isUpdate = mode === 'update';
    const title = isUpdate ? `Cập Nhật Đơn Hàng: ${orderData.ma_don_hang_code}` : 'Tạo Đơn Hàng Mới';
    const submitText = isUpdate ? 'Cập nhật Đơn Hàng' : 'Tạo Đơn Hàng';
    
    // Chỉ cho phép cập nhật khi đơn hàng đang ở trạng thái chờ xác nhận
    if (isUpdate && orderData.trang_thai_don_hang !== 'cho_xac_nhan') {
        document.getElementById('view-container').innerHTML = `
            <div class="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg mt-8">
                <div class="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-6 rounded-r-lg">
                    <p class="font-bold">Không thể chỉnh sửa!</p>
                    <p>Đơn hàng ${orderData.ma_don_hang_code} đã ở trạng thái "${orderStatuses[orderData.trang_thai_don_hang].label}" và không thể sửa đổi chi tiết.</p>
                </div>
                <button onclick="showView('order-list')" class="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-150">
                    Quay lại Danh sách Đơn hàng
                </button>
            </div>
        `;
        return;
    }
    
    let initialProducts = orderData.chi_tiet || [];
    let initialCustomerId = orderData.ma_khach_hang || '';
    let isCustomerOld = initialCustomerId !== '';
    
    const customerOptions = customers.map(c => 
        `<option value="${c.MaKhachHang}" data-name="${c.HoTen}" data-sdt="${c.SDT}" ${c.MaKhachHang === initialCustomerId ? 'selected' : ''}>${c.MaKhachHang} - ${c.HoTen} (${c.SDT})</option>`
    ).join('');
    
    // Options cho Trạng thái Thanh toán
    const paymentOptionsHtml = Object.keys(paymentStatuses).map(key => {
        const status = paymentStatuses[key];
        const isCurrent = key === (orderData.trang_thai_thanh_toan || 'chua_thanh_toan');
        return `<option value="${key}" ${isCurrent ? 'selected' : ''}>${status.label}</option>`;
    }).join('');

    
    const formHtml = `
        <div class="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <h2 class="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">${title}</h2>
            <form id="order-form" onsubmit="handleOrderSubmit(event, '${mode}')">
                
                <h3 class="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Thông Tin Khách Hàng & Giao Hàng</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label for="ma_don_hang_code" class="block text-sm font-medium text-gray-700 mb-1">Mã Đơn Hàng</label>
                        <input type="text" id="ma_don_hang_code" name="ma_don_hang_code" value="${orderData.ma_don_hang_code || generateUniqueOrderCode()}" readonly class="bg-gray-100 w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label for="customer_type" class="block text-sm font-medium text-gray-700 mb-1">Loại Khách Hàng</label>
                        <select id="customer_type" onchange="toggleCustomerType()" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="old" ${isCustomerOld ? 'selected' : ''}>Khách hàng cũ</option>
                            <option value="new" ${!isCustomerOld ? 'selected' : ''}>Khách hàng mới</option>
                        </select>
                    </div>

                    <div id="old_customer_fields" class="${!isCustomerOld ? 'hidden' : ''}">
                        <label for="select_khach_hang" class="block text-sm font-medium text-gray-700 mb-1">Chọn Khách Hàng</label>
                        <select id="select_khach_hang" onchange="autoFillCustomerInfo()" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                            ${customerOptions}
                        </select>
                        <input type="hidden" id="ma_khach_hang" name="ma_khach_hang" value="${initialCustomerId}">
                    </div>
                    
                    <div id="new_customer_fields" class="${isCustomerOld ? 'hidden' : ''} sm:col-span-2 grid grid-cols-2 gap-6">
                        <div>
                            <label for="ten_nguoi_nhan" class="block text-sm font-medium text-gray-700 mb-1">Tên Người Nhận</label>
                            <input type="text" id="ten_nguoi_nhan" name="ten_nguoi_nhan" value="${orderData.ten_nguoi_nhan || ''}" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </div>
                        <div>
                            <label for="so_dien_thoai" class="block text-sm font-medium text-gray-700 mb-1">Số Điện Thoại (10 số)</label>
                            <input type="tel" id="so_dien_thoai" name="so_dien_thoai" value="${orderData.so_dien_thoai || ''}" required minlength="10" maxlength="10"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </div>
                    </div>

                    <div class="sm:col-span-2">
                        <label for="full_address" class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ Giao Hàng</label>
                        <input type="text" id="full_address" name="full_address" 
                               placeholder="VD: 123 Đường ABC, Phường X, Quận Y, TP.HCM"
                               value="${orderData.dia_chi_giao_json?.full || ''}" required 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        <p class="mt-1 text-xs text-gray-500 italic">
                            Vui lòng nhập đầy đủ theo thứ tự: Số nhà/Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố.
                        </p>
                    </div>
                    </div>

                <h3 class="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Chi Tiết Sản Phẩm</h3>
                
                <div id="product-list" class="space-y-4 mb-6">
                    </div>

                <button type="button" id="add-product-btn" class="flex items-center text-indigo-600 hover:text-indigo-800 transition duration-150 mb-6">
                    <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Thêm Sản Phẩm
                </button>


                <h3 class="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Tổng Kết & Thanh Toán</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label for="trang_thai_thanh_toan" class="block text-sm font-medium text-gray-700 mb-1">Trạng Thái Thanh Toán</label>
                        <select id="trang_thai_thanh_toan" name="trang_thai_thanh_toan" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                            ${paymentOptionsHtml}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tổng Tiền Hàng</label>
                        <p id="display_tong_tien_hang" class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-bold text-gray-700">0 VNĐ</p>
                        <input type="hidden" id="tong_tien_hang" name="tong_tien_hang" value="${orderData.tong_tien_hang || 0}">
                    </div>

                    <input type="hidden" id="phi_van_chuyen" name="phi_van_chuyen" value="0">
                    
                    <div class="sm:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tổng Thanh Toán Cuối Cùng</label>
                        <p id="display_tong_thanh_toan" class="w-full px-4 py-2 bg-indigo-50 border border-indigo-300 rounded-lg text-lg font-extrabold text-indigo-700">0 VNĐ</p>
                        <input type="hidden" id="tong_thanh_toan" name="tong_thanh_toan" value="${orderData.tong_thanh_toan || 0}">
                        <input type="hidden" id="thue" name="thue" value="0">
                        <input type="hidden" id="trang_thai_don_hang" name="trang_thai_don_hang" value="${orderData.trang_thai_don_hang || 'cho_xac_nhan'}">
                    </div>
                </div>

                <div class="flex justify-end space-x-4 border-t pt-4">
                    <button type="button" onclick="showView('order-list')" class="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition duration-150">
                        Hủy
                    </button>
                    <button type="submit" class="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150">
                        ${submitText}
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('view-container').innerHTML = formHtml;

    // --- LOGIC GẮN HÀM XỬ LÝ (MỚI) ---
    
    // Hàm thêm hàng sản phẩm (được định nghĩa cục bộ trong renderOrderForm)
    const addProductRow = (MaSach = '', SoLuong = 1) => {
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000);
        const productRow = document.createElement('div');
        productRow.className = 'flex space-x-2 items-end border-b pb-3';
        productRow.innerHTML = `
            <div class="flex-1">
                <label for="product_id_${uniqueId}" class="block text-xs font-medium text-gray-500 mb-1">Sản phẩm</label>
                <select id="product_id_${uniqueId}" name="product_id" onchange="calculateOrderTotals()" required
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">-- Chọn sản phẩm --</option>
                    ${productOptions}
                </select>
            </div>
            <div class="w-20">
                <label for="quantity_${uniqueId}" class="block text-xs font-medium text-gray-500 mb-1">SL</label>
                <input type="number" id="quantity_${uniqueId}" name="quantity" value="${SoLuong}" oninput="calculateOrderTotals()" min="1" required
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <button type="button" onclick="this.closest('.flex').remove(); calculateOrderTotals();" 
                    class="p-2 text-red-500 hover:text-red-700 transition duration-150 rounded-lg" title="Xóa">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        `;

        document.getElementById('product-list').appendChild(productRow);
        
        // Cập nhật giá trị nếu có dữ liệu truyền vào
        if (MaSach) {
             productRow.querySelector(`[id^="product_id_"]`).value = MaSach;
        }
    };
    
    // 1. Gán Event Listener cho nút "Thêm Sản Phẩm"
    document.getElementById('add-product-btn').addEventListener('click', () => addProductRow());

    // 2. Khởi tạo các hàng sản phẩm nếu ở chế độ update (hoặc nếu là form rỗng)
    if (initialProducts.length === 0) {
        addProductRow();
    } else {
        initialProducts.forEach(item => {
            addProductRow(item.MaSach, item.SoLuong);
        });
    }

    // 3. Khởi tạo thông tin khách hàng cũ nếu có
    if (isCustomerOld) {
        autoFillCustomerInfo(true, initialCustomerId);
    }
    
    // 4. Tính toán lại tổng tiền khi load form
    calculateOrderTotals();
    
    // --- KẾT THÚC LOGIC GẮN HÀM XỬ LÝ ---
}

// Hàm chuyển đổi giữa Khách hàng cũ và Khách hàng mới
function toggleCustomerType() {
    const type = document.getElementById('customer_type').value;
    const oldFields = document.getElementById('old_customer_fields');
    const newFields = document.getElementById('new_customer_fields');
    const tenNguoiNhan = document.getElementById('ten_nguoi_nhan');
    const sdt = document.getElementById('so_dien_thoai');

    if (type === 'old') {
        oldFields.classList.remove('hidden');
        newFields.classList.add('hidden');
        
        // Auto-fill thông tin từ KH đầu tiên trong danh sách
        autoFillCustomerInfo(false, document.getElementById('select_khach_hang').value);
        
    } else {
        oldFields.classList.add('hidden');
        newFields.classList.remove('hidden');
        
        // Reset thông tin người nhận
        document.getElementById('ma_khach_hang').value = '';
        tenNguoiNhan.value = '';
        sdt.value = '';
    }
}

// Hàm tự động điền thông tin khách hàng cũ
function autoFillCustomerInfo(isInitialLoad = false, selectedId = null) {
    const selectCustomer = document.getElementById('select_khach_hang');
    const customerId = selectedId || selectCustomer.value;
    const customer = customers.find(c => c.MaKhachHang === customerId);
    
    const tenNguoiNhan = document.getElementById('ten_nguoi_nhan');
    const sdt = document.getElementById('so_dien_thoai');
    const maKhachHangInput = document.getElementById('ma_khach_hang');

    if (customer) {
        if (!isInitialLoad) {
            // Không thay đổi giá trị nếu đang là initial load (đã có giá trị sẵn)
            tenNguoiNhan.value = customer.HoTen;
            sdt.value = customer.SDT;
        }
        maKhachHangInput.value = customer.MaKhachHang;
    }
}


// Hàm tính toán tổng tiền đơn hàng (ĐÃ XÓA PHÍ VẬN CHUYỂN)
function calculateOrderTotals() {
    const productRows = document.querySelectorAll('#product-list > div');
    let tongTienHang = 0;
    
    productRows.forEach(row => {
        const select = row.querySelector('[name="product_id"]');
        const quantityInput = row.querySelector('[name="quantity"]');
        
        if (select && quantityInput && select.value) {
            const selectedBook = books.find(b => b.MaSach === select.value);
            const quantity = parseInt(quantityInput.value) || 0;
            if (selectedBook && quantity > 0) {
                tongTienHang += selectedBook.GiaBan * quantity;
            }
        }
    });

    const phiVanChuyen = 0; // ĐÃ XÓA PHÍ VẬN CHUYỂN KHỎI LOGIC
    const thue = 0; 
    const chietKhau = 0;

    const tongThanhToan = tongTienHang + phiVanChuyen + thue;

    // Cập nhật các trường ẩn
    document.getElementById('tong_tien_hang').value = tongTienHang;
    document.getElementById('tong_thanh_toan').value = tongThanhToan;

    // Cập nhật hiển thị
    document.getElementById('display_tong_tien_hang').innerText = tongTienHang.toLocaleString('vi-VN') + ' VNĐ';
    document.getElementById('display_tong_thanh_toan').innerText = tongThanhToan.toLocaleString('vi-VN') + ' VNĐ';
}

// Hàm xử lý submit form Đơn hàng (ĐÃ XÓA PHÍ VẬN CHUYỂN & THÊM TRẠNG THÁI THANH TOÁN)
function handleOrderSubmit(event, mode) {
    event.preventDefault();
    const form = event.target;
    
    // 1. Kiểm tra SĐT 10 số (Chỉ khi nhập thủ công)
    const sdtInput = form.so_dien_thoai;
    let finalTenNguoiNhan = form.ten_nguoi_nhan.value;
    let finalSDT = form.so_dien_thoai.value;

    if (form.customer_type.value === 'new') {
        const sdtValue = sdtInput.value.trim();
        if (!sdtValue.match(/^\d{10}$/)) {
            showModal('Lỗi Dữ liệu', 'Số Điện Thoại phải nhập đủ 10 chữ số.', `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            return;
        }
    } else {
         // Nếu là Khách cũ, lấy thông tin đã được auto-fill vào trường nhập
         finalTenNguoiNhan = form.ten_nguoi_nhan.value;
         finalSDT = form.so_dien_thoai.value;
    }


    // 2. Xử lý logic Khách hàng
    let finalMaKhachHang = form.ma_khach_hang.value.trim();

    if (form.customer_type.value === 'new') {
        finalMaKhachHang = generateNewCustomerId();
        // Giả lập thêm khách hàng mới vào danh sách mock data
        customers.push({ MaKhachHang: finalMaKhachHang, HoTen: finalTenNguoiNhan, SDT: finalSDT });
    } 


    // 3. Lấy chi tiết sản phẩm và kiểm tra tồn kho
    const productRows = document.querySelectorAll('#product-list > div');
    const chiTiet = [];
    let inventoryCheck = {}; 

    productRows.forEach(row => {
        const select = row.querySelector('[name="product_id"]');
        const quantityInput = row.querySelector('[name="quantity"]');
        if (select.value && parseInt(quantityInput.value) > 0) {
            const book = books.find(b => b.MaSach === select.value);
            const SoLuong = parseInt(quantityInput.value);

            if (book) {
                chiTiet.push({
                    MaSach: book.MaSach,
                    TenSach: book.TenSach,
                    SoLuong: SoLuong,
                    GiaBan: book.GiaBan,
                });
                inventoryCheck[book.MaSach] = (inventoryCheck[book.MaSach] || 0) + SoLuong;
            }
        }
    });

    if (chiTiet.length === 0) {
        showModal('Lỗi', 'Đơn hàng phải có ít nhất một sản phẩm.', `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
        return;
    }
    
    // Kiểm tra tồn kho sẵn sàng
    let outOfStock = [];
    let isInventoryOK = true;

    for (const MaSach in inventoryCheck) {
        const required = inventoryCheck[MaSach];
        const book = books.find(b => b.MaSach === MaSach);
        // Nếu đang chỉnh sửa, loại bỏ giữ chỗ cũ trước khi kiểm tra (Giả lập)
        let existingOrderQuantity = 0;
        if (mode === 'update') {
            const oldOrder = orders.find(o => o.ma_don_hang_code === editingItemId);
            existingOrderQuantity = oldOrder.chi_tiet.filter(i => i.MaSach === MaSach).reduce((sum, i) => sum + i.SoLuong, 0);
        }
        
        // Tồn kho sẵn sàng hiện tại (loại trừ số lượng đang giữ chỗ của đơn hàng cũ này)
        const availableStock = (book.SoLuongTon || 0) - (book.SoLuongGiuCho || 0) + existingOrderQuantity;


        if (required > availableStock) {
            outOfStock.push(`Sách ${book.MaSach} (${book.TenSach}): Yêu cầu ${required}, Tồn sẵn ${availableStock}`);
            isInventoryOK = false;
        }
    }

    if (!isInventoryOK) {
        const errorMsg = `
            <p class="font-bold text-red-700 mb-3">Lỗi tồn kho:</p>
            <ul class="list-disc list-inside space-y-1 text-sm bg-red-50 p-3 rounded-lg">
                ${outOfStock.map(msg => `<li>${msg}</li>`).join('')}
            </ul>
            <p class="mt-3">Vui lòng điều chỉnh số lượng sản phẩm.</p>
        `;
        showModal('Lỗi Tồn Kho', errorMsg, `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`, 'max-w-xl');
        return;
    }

    // 4. Tạo đối tượng Đơn hàng
    const newOrder = {
        ma_don_hang_code: form.ma_don_hang_code.value.trim().toUpperCase(),
        ma_khach_hang: finalMaKhachHang,
        ten_nguoi_nhan: finalTenNguoiNhan,
        so_dien_thoai: finalSDT,
        // *** ĐÃ SỬA: CHỈ LƯU TRƯỜNG 'full' ĐỊA CHỈ ***
        dia_chi_giao_json: {
            full: form.full_address.value.trim(),
        },
        // *** KẾT THÚC SỬA ***
        tong_tien_hang: parseInt(form.tong_tien_hang.value),
        chiet_khau: 0, // Đã loại bỏ
        phi_van_chuyen: 0, // ĐÃ XÓA PHÍ VẬN CHUYỂN
        thue: 0,
        tong_thanh_toan: parseInt(form.tong_thanh_toan.value),
        trang_thai_thanh_toan: form.trang_thai_thanh_toan.value, // THÊM TRẠNG THÁI THANH TOÁN
        trang_thai_don_hang: 'cho_xac_nhan', // Luôn bắt đầu ở trạng thái chờ xác nhận khi tạo mới
        ngay_tao: new Date().toISOString().substring(0, 10),
        chi_tiet: chiTiet,
    };

    // 5. Xử lý Thêm mới
    if (mode === 'add') {
         if (orders.some(o => o.ma_don_hang_code === newOrder.ma_don_hang_code)) {
            showModal('Lỗi', 'Mã Đơn Hàng đã tồn tại. Vui lòng nhập mã khác.', `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            return;
        }
        
        // Giữ chỗ tồn kho cho đơn hàng mới
        newOrder.chi_tiet.forEach(item => {
            const book = books.find(b => b.MaSach === item.MaSach);
            if (book) {
                book.SoLuongGiuCho += item.SoLuong;
            }
        });

        orders.push(newOrder);
        showSuccess('Đã tạo Đơn hàng mới thành công! (Đang ở trạng thái "Chờ xác nhận")');

    } else if (mode === 'update') {
         // Logic phức tạp hơn: cần hoàn lại giữ chỗ cũ, sau đó giữ chỗ mới
        const index = orders.findIndex(o => o.ma_don_hang_code === editingItemId);
        if (index !== -1) {
            const oldOrder = orders[index];

            // 1. Hoàn lại giữ chỗ cũ
            oldOrder.chi_tiet.forEach(item => {
                const book = books.find(b => b.MaSach === item.MaSach);
                if (book) {
                    book.SoLuongGiuCho -= item.SoLuong;
                }
            });

            // 2. Cập nhật dữ liệu đơn hàng
            orders[index] = { ...orders[index], ...newOrder };

            // 3. Giữ chỗ mới
            newOrder.chi_tiet.forEach(item => {
                const book = books.find(b => b.MaSach === item.MaSach);
                if (book) {
                    book.SoLuongGiuCho += item.SoLuong;
                }
            });

            showSuccess(`Đã cập nhật Đơn hàng ${editingItemId} thành công!`);
        } else {
            showModal('Lỗi', `Không tìm thấy Đơn hàng có mã ${editingItemId} để cập nhật.`, `<button onclick="hideModal()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Đóng</button>`);
            return;
        }
    }
    showView('order-list');
}


// --- 5. Báo Cáo & Thống Kê ---

// *********** KHAI BÁO BIẾN CẦN THIẾT ************
const reportItems = [
    { id: 'report_book', label: 'Báo cáo chi tiết Sách (Tồn kho)', type: 'report' },
    { id: 'report_customer', label: 'Báo cáo chi tiết Khách hàng', type: 'report' },
    { id: 'report_order', label: 'Báo cáo chi tiết Đơn hàng', type: 'report' },
    { id: 'stats_book', label: 'Thống kê Tổng quan Sách', type: 'stats' },
    { id: 'stats_customer', label: 'Thống kê Tổng quan Khách hàng', type: 'stats' },
    { id: 'stats_order', label: 'Thống kê Tổng quan Đơn hàng', type: 'stats' },
];
// ************************************************


function calculateDashboardMetrics() {
    const totalInventoryValue = books.reduce(
        (sum, book) => sum + (book.SoLuongTon - book.SoLuongGiuCho) * book.GiaBan,
        0,
    );
    const totalProducts = books.length;

    const totalOrders = orders.length;
    const completedPaidOrders = orders.filter(
        (order) =>
            order.trang_thai_don_hang === 'da_giao' &&
            order.trang_thai_thanh_toan === 'da_thanh_toan',
    );
    const totalRevenue = completedPaidOrders.reduce(
        (sum, order) => sum + Number(order.tong_thanh_toan || 0),
        0,
    );

    const totalCategories = categories.length;

    const revenueByCategory = {};
    completedPaidOrders.forEach((order) => {
        (order.chi_tiet || []).forEach((item) => {
            const book = books.find((b) => b.MaSach === item.MaSach);
            const catName = (book && book.TheLoai) ? book.TheLoai : 'Khác / Không rõ';
            const lineRevenue = item.SoLuong * item.GiaBan;
            revenueByCategory[catName] = (revenueByCategory[catName] || 0) + lineRevenue;
        });
    });

    return {
        totalInventoryValue,
        totalOrders,
        totalRevenue,
        totalCategories,
        totalProducts,
        revenueByCategory,
    };
}


/**
 * Hàm render View chính của trang Báo cáo (CHỈ RENDER DASHBOARD)
 */
function renderReportView(defaultReportId = 'dashboard') {
    // Gọi hàm render Dashboard trực tiếp vào view-container
    renderDashboardReport(document.getElementById('view-container'));
}

/**
 * Hàm render Nội dung chi tiết cho các báo cáo phụ (hiển thị trong Modal).
 */
function renderDetailReport(reportId) {
    let title = '';
    let reportHtml = '';
    
    // Kích thước font cơ bản cho bảng (text-xs)
    const textSize = 'text-xs'; 
    
    // Tạo nội dung báo cáo chi tiết
    switch (reportId) {
        // --- BÁO CÁO (Chi tiết) ---
        case 'report_book':
            title = 'Báo Cáo Chi Tiết Sách (Tồn kho)';
            const bookReportRows = books.map(book => `
                <tr class="hover:bg-gray-50">
                    <td class="px-2 py-1 border-t ${textSize}">${book.MaSKU}</td>
                    <td class="px-2 py-1 border-t ${textSize}">${book.TenSach}</td>
                    <td class="px-2 py-1 border-t ${textSize}">${book.TheLoai}</td>
                    <td class="px-2 py-1 border-t ${textSize} text-right">${book.SoLuongTon.toLocaleString('vi-VN')}</td>
                    <td class="px-2 py-1 border-t ${textSize} text-right">${book.SoLuongGiuCho.toLocaleString('vi-VN')}</td>
                    <td class="px-2 py-1 border-t ${textSize} text-right font-bold text-indigo-600">${(book.SoLuongTon - book.SoLuongGiuCho).toLocaleString('vi-VN')}</td>
                </tr>
            `).join('');
            
            reportHtml = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-indigo-50">
                            <tr>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">Mã SKU</th>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">Tên Sách</th>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">Thể Loại</th>
                                <th class="px-2 py-1.5 text-right ${textSize} font-bold text-indigo-700 uppercase">SL Tồn (Thực)</th>
                                <th class="px-2 py-1.5 text-right ${textSize} font-bold text-indigo-700 uppercase">SL Giữ Chỗ</th>
                                <th class="px-2 py-1.5 text-right ${textSize} font-bold text-indigo-700 uppercase">SL Sẵn Sàng</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">${bookReportRows}</tbody>
                    </table>
                </div>
            `;
            break;

        case 'report_customer':
            title = 'Báo Cáo Chi Tiết Khách Hàng (Lịch sử Mua hàng)';
            const customerReportRows = customers.map(cust => {
                const customerOrders = orders.filter(o => o.ma_khach_hang === cust.MaKhachHang && o.trang_thai_don_hang === 'da_giao');
                const totalOrders = customerOrders.length;
                const totalRevenue = customerOrders.reduce((sum, o) => sum + o.tong_thanh_toan, 0);

                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-2 py-1 border-t ${textSize}">${cust.MaKhachHang}</td>
                        <td class="px-2 py-1 border-t ${textSize} font-medium">${cust.HoTen}</td>
                        <td class="px-2 py-1 border-t ${textSize}">${cust.SDT}</td>
                        <td class="px-2 py-1 border-t ${textSize} text-right font-bold text-indigo-600">${totalOrders}</td>
                        <td class="px-2 py-1 border-t ${textSize} text-right font-bold text-green-600">${totalRevenue.toLocaleString('vi-VN')} VNĐ</td>
                    </tr>
                `;
            }).join('');
            
            reportHtml = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-indigo-50">
                            <tr>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">Mã KH</th>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">Tên Khách Hàng</th>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">SĐT</th>
                                <th class="px-2 py-1.5 text-right ${textSize} font-bold text-indigo-700 uppercase">Tổng SL Đơn (Hoàn thành)</th>
                                <th class="px-2 py-1.5 text-right ${textSize} font-bold text-indigo-700 uppercase">Tổng Doanh Thu</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">${customerReportRows}</tbody>
                    </table>
                </div>
            `;
            break;

        case 'report_order':
            title = 'Báo Cáo Chi Tiết Đơn Hàng';
            const orderReportRows = orders.map(order => {
                const statusLabel = orderStatuses[order.trang_thai_don_hang].label;
                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-2 py-1 border-t ${textSize} font-mono">${order.ma_don_hang_code}</td>
                        <td class="px-2 py-1 border-t ${textSize}">${order.ten_nguoi_nhan}</td>
                        <td class="px-2 py-1 border-t ${textSize}">${order.ngay_tao}</td>
                        <td class="px-2 py-1 border-t ${textSize} text-right">${order.tong_thanh_toan.toLocaleString('vi-VN')} VNĐ</td>
                        <td class="px-2 py-1 border-t ${textSize}">${statusLabel}</td>
                    </tr>
                `;
            }).join('');
            
            reportHtml = `
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-indigo-50">
                            <tr>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">Mã Đơn</th>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">Người Nhận</th>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">Ngày Tạo</th>
                                <th class="px-2 py-1.5 text-right ${textSize} font-bold text-indigo-700 uppercase">Tổng Thanh Toán</th>
                                <th class="px-2 py-1.5 text-left ${textSize} font-bold text-indigo-700 uppercase">Trạng Thái</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-100">${orderReportRows}</tbody>
                    </table>
                </div>
            `;
            break;
            
        // --- THỐNG KÊ (Tổng hợp - Hiển thị dưới dạng card) ---
        case 'stats_book':
            title = 'Thống Kê Tổng Quan Sách';
            const totalStock = books.reduce((sum, b) => sum + b.SoLuongTon, 0);
            const totalReserved = books.reduce((sum, b) => sum + b.SoLuongGiuCho, 0);
            const totalAvailable = totalStock - totalReserved;
            const uniqueCategories = new Set(books.map(b => b.TheLoai)).size;

            reportHtml = `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
                    ${createStatCard('Tổng số Sách (SP)', books.length, 'sách', 'bg-indigo-500', 'text-white', 'text-lg')}
                    ${createStatCard('Tổng SL Tồn Kho', totalStock.toLocaleString('vi-VN'), 'cuốn', 'bg-yellow-500', 'text-white', 'text-lg')}
                    ${createStatCard('Tổng SL Giữ Chỗ', totalReserved.toLocaleString('vi-VN'), 'cuốn', 'bg-red-500', 'text-white', 'text-lg')}
                    ${createStatCard('Tổng SL Sẵn Sàng', totalAvailable.toLocaleString('vi-VN'), 'cuốn', 'bg-green-500', 'text-white', 'text-lg')}
                    ${createStatCard('Số lượng Danh mục', uniqueCategories.toLocaleString('vi-VN'), 'danh mục', 'bg-blue-500', 'text-white', 'text-lg')}
                </div>
            `;
            break;
            
        case 'stats_customer':
            title = 'Thống Kê Tổng Quan Khách Hàng';
            const distinctReceivers = new Set(orders.map(o => o.ten_nguoi_nhan || '')).size;
            const completedOrders = orders.filter(o => o.trang_thai_don_hang === 'da_giao');
            const activeOrders = completedOrders.length;
            const totalRevenueAll = completedOrders.reduce(
                (sum, o) => sum + Number(o.tong_thanh_toan || 0),
                0,
            );
            const avgRevenue = distinctReceivers > 0 ? totalRevenueAll / distinctReceivers : 0;

            reportHtml = `
                <div class="grid grid-cols-2 md:grid-cols-2 gap-3 text-center">
                    ${createStatCard('Số người nhận khác nhau', distinctReceivers.toLocaleString('vi-VN'), 'người nhận', 'bg-purple-500', 'text-white', 'text-lg')}
                    ${createStatCard('Tổng Đơn đã hoàn thành', activeOrders.toLocaleString('vi-VN'), 'đơn', 'bg-blue-500', 'text-white', 'text-lg')}
                    ${createStatCard('Tổng Doanh thu (Hoàn thành)', totalRevenueAll.toLocaleString('vi-VN'), 'VNĐ', 'bg-green-500', 'text-white', 'text-lg')}
                    ${createStatCard('Doanh thu TB/Người nhận', avgRevenue.toLocaleString('vi-VN'), 'VNĐ', 'bg-pink-500', 'text-white', 'text-lg')}
                </div>
            `;
            break;

        case 'stats_order':
            title = 'Thống Kê Tổng Quan Đơn Hàng';
            const totalOrders = orders.length;
            
            const ordersByStatus = orders.reduce((acc, order) => {
                const statusKey = order.trang_thai_don_hang;
                acc[statusKey] = (acc[statusKey] || 0) + 1;
                return acc;
            }, {});
            
            const statusCards = Object.keys(ordersByStatus).map(statusKey => {
                const status = orderStatuses[statusKey];
                const count = ordersByStatus[statusKey];
                return createStatCard(status.label, count.toLocaleString('vi-VN'), 'đơn', status.color.replace('-100', '-500'), 'text-white', 'text-lg');
            }).join('');

            reportHtml = `
                <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-center">
                    ${createStatCard('Tổng số Đơn hàng', totalOrders.toLocaleString('vi-VN'), 'đơn', 'bg-indigo-600', 'text-white', 'text-xl')}
                    ${statusCards}
                </div>
            `;
            break;
            
        default:
            title = 'Lỗi Báo cáo';
            reportHtml = '<p class="text-gray-500 text-center py-10">Không tìm thấy báo cáo chi tiết.</p>';
            break;
    }

    const actions = `
        <button onclick="hideModal()" class="px-3 py-1.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-150 text-sm">
            Đóng
        </button>
        <button onclick="console.log('Xuất Excel')" class="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-150 text-sm">
            Xuất Excel
        </button>
    `;

    // Thiết lập kích thước modal nhỏ hơn
    showModal(title, `<div class="p-1">${reportHtml}</div>`, actions, 'max-w-2xl'); 
}

function renderDashboardReport(contentArea) {
    const metrics = calculateDashboardMetrics();
    
    const iconInventory = '<svg class="w-8 h-8 opacity-70 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>';
    const iconOrders = '<svg class="w-8 h-8 opacity-70 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4V9m2-5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z"></path></svg>';
    const iconRevenue = '<svg class="w-8 h-8 opacity-70 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 12v2m8-8a8 8 0 11-16 0 8 8 0 0116 0z"></path></svg>';
    const iconCategories = '<svg class="w-8 h-8 opacity-70 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"></path></svg>';
    const iconProducts = '<svg class="w-8 h-8 opacity-70 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 4v.01M12 11l-3 3 3 3m5-3v.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"></path></svg>';


    const metricCards = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            ${createDashboardCard(
                'Tổng giá trị tồn kho', 
                metrics.totalInventoryValue.toLocaleString('vi-VN') + ' đ', 
                'text-2xl font-bold text-blue-800', 
                iconInventory,
                'bg-blue-50'
            )}
            ${createDashboardCard(
                'Tổng số Đơn hàng', 
                metrics.totalOrders.toLocaleString('vi-VN') + ' đơn', 
                'text-2xl font-bold text-green-800', 
                iconOrders,
                'bg-green-50'
            )}
             ${createDashboardCard(
                'Tổng doanh thu', 
                metrics.totalRevenue.toLocaleString('vi-VN') + ' đ', 
                'text-2xl font-bold text-emerald-800', 
                iconRevenue,
                'bg-emerald-50'
            )}
             ${createDashboardCard(
                'Tổng số Danh mục', 
                metrics.totalCategories.toLocaleString('vi-VN') + ' danh mục', 
                'text-2xl font-bold text-yellow-800', 
                iconCategories,
                'bg-yellow-50'
            )}
            ${createDashboardCard(
                'Tổng số sản phẩm', 
                metrics.totalProducts.toLocaleString('vi-VN') + ' sản phẩm', 
                'text-2xl font-bold text-red-800', 
                iconProducts,
                'bg-red-50'
            )}
        </div>
    `;

    // Tạo options cho nút 'Tạo báo cáo mới'
    const reportOptionsHtml = reportItems.map(item => `<option value="${item.id}">${item.label}</option>`).join('');

    // Phần Lọc (Giả lập)
    const filterSection = `
        <div class="p-4 bg-white rounded-xl shadow mb-8 border border-gray-200">
            <div class="flex flex-wrap items-center gap-4">
                
                <div class="flex items-center space-x-2">
                    <label class="text-sm text-gray-600">Từ ngày:</label>
                    <input type="date" value="2025-01-01" class="px-3 py-1 border rounded text-sm">
                </div>
                <div class="flex items-center space-x-2">
                    <label class="text-sm text-gray-600">Đến ngày:</label>
                    <input type="date" value="2025-11-15" class="px-3 py-1 border rounded text-sm">
                </div>
                 <div class="flex items-center space-x-2">
                    <label class="text-sm text-gray-600">Danh mục:</label>
                    <select class="px-3 py-1 border rounded text-sm">
                        <option>Tất cả danh mục</option>
                        ${categories.map(c => `<option>${c.TenDanhMuc}</option>`).join('')}
                    </select>
                </div>
                <button class="px-4 py-1.5 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">Lọc</button>
            </div>
        </div>
    `;

    const revenueEntries = Object.entries(metrics.revenueByCategory);
    const hasRevenueData = revenueEntries.length > 0;
    const maxRevenue = hasRevenueData
        ? Math.max(...revenueEntries.map(([, value]) => value))
        : 0;

    const chartSection = `
        <div class="p-4 bg-white rounded-xl shadow border border-gray-200">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Doanh thu theo danh mục (đơn đã giao & đã thanh toán)</h3>
            ${
                !hasRevenueData
                    ? '<p class="text-gray-500 text-sm">Chưa có dữ liệu doanh thu để vẽ biểu đồ.</p>'
                    : `<div class="w-full overflow-x-auto">
                        <div class="flex items-end gap-4 h-56 px-2">
                            ${(() => {
                                const barColors = [
                                    { bg: 'bg-emerald-500', light: 'bg-emerald-100' },
                                    { bg: 'bg-blue-500', light: 'bg-blue-100' },
                                    { bg: 'bg-indigo-500', light: 'bg-indigo-100' },
                                    { bg: 'bg-purple-500', light: 'bg-purple-100' },
                                    { bg: 'bg-pink-500', light: 'bg-pink-100' },
                                    { bg: 'bg-orange-500', light: 'bg-orange-100' },
                                    { bg: 'bg-teal-500', light: 'bg-teal-100' },
                                ];
                                return revenueEntries
                                    .map(([cat, value], idx) => {
                                        const percent = maxRevenue > 0 ? Math.max(8, (value / maxRevenue) * 100) : 0;
                                        const palette = barColors[idx % barColors.length];
                                        return `
                                            <div class="flex flex-col items-center space-y-1 min-w-[72px]">
                                                <div class="w-9 ${palette.light} rounded-t-md overflow-hidden h-40 flex items-end">
                                                    <div class="w-full ${palette.bg}" style="height: ${percent}%;"></div>
                                                </div>
                                                <div class="text-[11px] text-gray-700 text-center truncate w-16" title="${cat}">${cat}</div>
                                                <div class="text-[11px] font-semibold text-gray-800">${value.toLocaleString('vi-VN')} đ</div>
                                            </div>
                                        `;
                                    })
                                    .join('');
                            })()}
                        </div>
                      </div>`
            }
        </div>
    `;


    contentArea.innerHTML = `
        <div class="p-6 sm:p-8 bg-white rounded-xl shadow-lg">
            <div class="flex justify-between items-center mb-6 border-b pb-3">
                <h2 class="text-3xl font-bold text-gray-800">Báo cáo thống kê</h2>
                <div class="space-x-2 flex items-center">
                    <button class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Xuất PDF</button>
                    <button class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Xuất Excel</button>
                    <select onchange="renderDetailReport(this.value); this.value=''" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 cursor-pointer">
                        <option value="" disabled selected>Tạo báo cáo mới</option>
                        ${reportOptionsHtml}
                    </select>
                </div>
            </div>
        
            ${metricCards}
            ${filterSection}
            ${chartSection}
        </div>
    `;
}

/**
 * Hàm tạo thẻ Dashboard
 */
function createDashboardCard(label, value, valueClass, iconHtml, wrapperBg) {
    return `
        <div class="p-4 rounded-xl shadow-md flex items-center space-x-4 ${wrapperBg}">
            <div class="p-3 rounded-full bg-white bg-opacity-70">
                ${iconHtml}
            </div>
            <div>
                <p class="text-sm font-medium text-gray-500">${label}</p>
                <p class="${valueClass}">${value}</p>
            </div>
        </div>
    `;
}

/**
 * Hàm tạo thẻ thống kê nhanh (cho các mục stats)
 */
function createStatCard(label, value, unit, bgColor, textColor, valueSize = 'text-3xl') {
    return `
        <div class="p-6 rounded-xl shadow-lg ${bgColor} ${textColor}">
            <p class="text-sm font-medium opacity-80 mb-2">${label.toUpperCase()}</p>
            <p class="font-extrabold ${valueSize}">${value}</p>
            <p class="text-xs mt-1 opacity-80">${unit}</p>
        </div>
    `;
}


// Khởi tạo ứng dụng khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        loadBooksFromBackend(),
        loadCategoriesFromBackend(),
        loadAdminOrdersFromBackend(),
    ]);

    // Sau khi dữ liệu chính đã load, lấy thêm summary khách hàng cho dashboard
    try {
        const summary = await adminApiRequest("/admin/customers/summary");
        if (summary && typeof summary.total_customers === "number") {
            // Gán vào một biến toàn cục đơn giản để renderDashboardReport có thể sử dụng
            window.__adminCustomerSummary = summary;
        }
    } catch (err) {
        console.warn("Admin: failed to load customer summary", err);
    }

    showView('home'); // Bắt đầu ở trang chủ
});
