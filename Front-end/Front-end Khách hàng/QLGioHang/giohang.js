document.addEventListener("DOMContentLoaded", async function () {
  const cartItemsContainer = document.getElementById("cart-items");
  const totalPriceElement = document.getElementById("total-price");
  const selectedCountElement = document.getElementById("selected-count");
  const cartCountElement = document.querySelector(".cart-count");
  const selectAllCheckbox = document.getElementById("select-all");
  const checkoutBtn = document.getElementById("checkout-btn");

  const token = window.sessionStorage.getItem("accessToken");
  if (!token) {
    cartItemsContainer.innerHTML = `
      <tr>
        <td colspan="6" class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <p>Vui lòng đăng nhập để xem giỏ hàng.</p>
          <a href="/Front-end Khách hàng/Login/dangnhap.html">Đăng nhập</a>
        </td>
      </tr>
    `;
    totalPriceElement.textContent = "0 đ";
    selectedCountElement.textContent = "0";
    checkoutBtn.disabled = true;
    return;
  }

  let cartData = null;
  let itemsSelection = {};

  async function loadCart() {
    try {
      cartData = await apiRequest("/cart");
      if (!cartData || !Array.isArray(cartData.items)) {
        cartData = { items: [], total_amount: 0, total_quantity: 0 };
      }
      // default select all
      itemsSelection = {};
      cartData.items.forEach((item) => {
        itemsSelection[item.item_id] = true;
      });
      renderCart();
      updateCartCount();
    } catch (err) {
      console.error(err);
      cartItemsContainer.innerHTML = `
        <tr>
          <td colspan="6" class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <p>Không tải được giỏ hàng từ server.</p>
          </td>
        </tr>
      `;
      totalPriceElement.textContent = "0 đ";
      selectedCountElement.textContent = "0";
      checkoutBtn.disabled = true;
    }
  }

  function updateCartCount() {
    if (!cartData || !cartData.items) return;
    const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountElement) {
      cartCountElement.textContent = totalItems;
    }
  }

  function calculateTotal() {
    if (!cartData || !cartData.items) return;
    const selectedItems = cartData.items.filter((item) => itemsSelection[item.item_id]);
    const total = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const count = selectedItems.length;

    totalPriceElement.textContent = total.toLocaleString("vi-VN") + " đ";
    selectedCountElement.textContent = String(count);

    checkoutBtn.disabled = count === 0;
  }

  function updateSelectAllCheckbox() {
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      selectAllCheckbox.checked = false;
      return;
    }
    selectAllCheckbox.checked = cartData.items.every((item) => itemsSelection[item.item_id]);
  }

  function renderCart() {
    cartItemsContainer.innerHTML = "";

    if (!cartData || !cartData.items || cartData.items.length === 0) {
      cartItemsContainer.innerHTML = `
        <tr>
          <td colspan="6" class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <p>Giỏ hàng trống</p>
            <a href="/Front-end Khách hàng/TrangSP/product.html">Tiếp tục mua sắm</a>
          </td>
        </tr>
      `;
      totalPriceElement.textContent = "0 đ";
      selectedCountElement.textContent = "0";
      checkoutBtn.disabled = true;
      return;
    }

    cartData.items.forEach((item) => {
      const row = document.createElement("tr");
      const checked = itemsSelection[item.item_id] ? "checked" : "";
      const imgSrc = item.image || "https://via.placeholder.com/60x80?text=Sách";
      row.innerHTML = `
        <td>
          <input type="checkbox" class="item-checkbox" data-id="${item.item_id}" ${checked}>
        </td>
        <td class="product-info">
          <img src="${imgSrc}" alt="${item.title || ""}">
          <div>
            <div class="product-name">${item.title || "Sản phẩm"}</div>
          </div>
        </td>
        <td class="price">${item.price.toLocaleString("vi-VN")} đ</td>
        <td>
          <div class="quantity">
            <button class="qty-btn minus" data-id="${item.item_id}">-</button>
            <input type="number" value="${item.quantity}" min="1" class="qty-input" data-id="${item.item_id}">
            <button class="qty-btn plus" data-id="${item.item_id}">+</button>
          </div>
        </td>
        <td class="price">${item.subtotal.toLocaleString("vi-VN")} đ</td>
        <td>
          <span class="remove-btn" data-id="${item.item_id}"><i class="fas fa-trash"></i></span>
        </td>
      `;
      cartItemsContainer.appendChild(row);
    });

    calculateTotal();
    updateSelectAllCheckbox();
  }

  selectAllCheckbox.addEventListener("change", function () {
    const isChecked = this.checked;
    if (!cartData || !cartData.items) return;
    cartData.items.forEach((item) => {
      itemsSelection[item.item_id] = isChecked;
    });
    renderCart();
  });

  cartItemsContainer.addEventListener("change", async function (e) {
    const target = e.target;

    if (target.classList.contains("item-checkbox")) {
      const id = parseInt(target.dataset.id, 10);
      itemsSelection[id] = target.checked;
      calculateTotal();
      updateSelectAllCheckbox();
    }

    if (target.classList.contains("qty-input")) {
      const id = parseInt(target.dataset.id, 10);
      const value = parseInt(target.value, 10);
      if (!value || value <= 0) {
        const item = cartData.items.find((i) => i.item_id === id);
        target.value = item ? item.quantity : 1;
        return;
      }
      try {
        cartData = await apiRequest(`/cart/items/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity: value }),
        });
        cartData.items.forEach((item) => {
          if (!(item.item_id in itemsSelection)) {
            itemsSelection[item.item_id] = true;
          }
        });
        renderCart();
        updateCartCount();
      } catch (err) {
        console.error(err);
        alert("Không thể cập nhật số lượng. Vui lòng thử lại.");
      }
    }
  });

  cartItemsContainer.addEventListener("click", async function (e) {
    const btn = e.target.closest("button, span");
    if (!btn) return;
    const id = parseInt(btn.dataset.id, 10);
    if (Number.isNaN(id)) return;

    if (btn.classList.contains("minus") || btn.classList.contains("plus")) {
      const item = cartData.items.find((i) => i.item_id === id);
      if (!item) return;
      let newQty = item.quantity;
      if (btn.classList.contains("minus")) {
        if (newQty > 1) newQty -= 1;
      } else {
        newQty += 1;
      }
      try {
        cartData = await apiRequest(`/cart/items/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ quantity: newQty }),
        });
        cartData.items.forEach((i) => {
          if (!(i.item_id in itemsSelection)) {
            itemsSelection[i.item_id] = true;
          }
        });
        renderCart();
        updateCartCount();
      } catch (err) {
        console.error(err);
        alert("Không thể cập nhật số lượng. Vui lòng thử lại.");
      }
    } else if (btn.classList.contains("remove-btn")) {
      if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?")) {
        return;
      }
      try {
        await apiRequest(`/cart/items/${id}`, { method: "DELETE" });
        await loadCart();
      } catch (err) {
        console.error(err);
        alert("Không thể xóa sản phẩm khỏi giỏ hàng. Vui lòng thử lại.");
      }
    }
  });

  checkoutBtn.addEventListener("click", function () {
    const selectedItems = cartData.items.filter((item) => itemsSelection[item.item_id]);
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
      return;
    }
    window.localStorage.setItem("checkoutItems", JSON.stringify(selectedItems));
    window.location.href = "/Front-end Khách hàng/TrangThanhToan/thanhtoan.html";
  });

  await loadCart();
});
