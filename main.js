let allProducts = [];
let filteredProducts = [];
let itemsPerPage = 10;
let currentPage = 1;
let sortColumn = null;
let sortDirection = "asc";

// Tải sản phẩm từ API
async function loadProducts() {
    const loading = document.getElementById("loading");
    const error = document.getElementById("error");
    const tableWrapper = document.getElementById("tableWrapper");

    loading.classList.remove("d-none");
    error.classList.add("d-none");
    tableWrapper.classList.add("d-none");

    try {
        const response = await fetch("https://api.escuelajs.co/api/v1/products");

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allProducts = await response.json();
        filteredProducts = allProducts;
        currentPage = 1;
        displayProducts();
        setupPagination();

        loading.classList.add("d-none");
        document.getElementById("searchWrapper").classList.remove("d-none");
        document.getElementById("paginationControls").classList.remove("d-none");
        tableWrapper.classList.remove("d-none");
    } catch (err) {
        loading.classList.add("d-none");
        error.classList.remove("d-none");
        error.textContent = `Lỗi khi tải dữ liệu: ${err.message}`;
    }
}

// Hiển thị sản phẩm
function displayProducts() {
    const tbody = document.getElementById("productTableBody");
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const productsToShow = filteredProducts.slice(start, end);

    tbody.innerHTML = "";

    productsToShow.forEach((product) => {
        const row = document.createElement("tr");
        row.className = "product-row";

        // Lưu description vào data attribute
        row.dataset.description = product.description || "Không có mô tả cho sản phẩm này.";

        // Lấy ảnh đầu tiên
        const imageUrl =
            product.images && product.images.length > 0 ? cleanImageUrl(product.images[0]) : "https://placehold.co/80x80/e2e8f0/64748b?text=No+Image";

        row.innerHTML = `
                    <td><strong>#${product.id}</strong></td>
                    <td>${escapeHtml(product.title)}</td>
                    <td><span class="badge bg-success">$${product.price}</span></td>
                    <td>
                        <span class="badge bg-primary category-badge">
                            ${escapeHtml(product.category?.name || "N/A")}
                        </span>
                    </td>
                    <td>
                        <img src="${imageUrl}" 
                             alt="${escapeHtml(product.title)}" 
                             class="product-img"
                             onerror="handleImageError(this)"
                             loading="lazy">
                    </td>
                `;

        // Thêm event listeners cho tooltip
        row.addEventListener("mouseenter", showDescriptionTooltip);
        row.addEventListener("mousemove", moveDescriptionTooltip);
        row.addEventListener("mouseleave", hideDescriptionTooltip);

        // Thêm event listener cho click vào row
        row.style.cursor = "pointer";
        row.addEventListener("click", () => showProductDetail(product));

        tbody.appendChild(row);
    });

    // Cập nhật số lượng sản phẩm
    const productCount = document.getElementById("productCount");
    if (filteredProducts.length === 0) {
        productCount.textContent = "Không có sản phẩm nào";
    } else {
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, filteredProducts.length);
        productCount.textContent = `Hiển thị ${start}-${end} của ${filteredProducts.length} sản phẩm`;
    }
}

// Thiết lập phân trang
function setupPagination() {
    const paginationList = document.getElementById("paginationList");
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    paginationList.innerHTML = "";

    if (totalPages <= 1) {
        return;
    }

    // Nút Previous
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Previous</a>`;
    paginationList.appendChild(prevLi);

    // Các số trang
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? "active" : ""}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>`;
        paginationList.appendChild(li);
    }

    // Nút Next
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Next</a>`;
    paginationList.appendChild(nextLi);
}

// Đổi trang
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    displayProducts();
    setupPagination();

    // Cuộn lên đầu bảng
    document.querySelector(".table-container").scrollIntoView({ behavior: "smooth" });
}

// Sắp xếp sản phẩm
function sortProducts(column) {
    // Nếu click vào cùng cột, đổi hướng sắp xếp
    if (sortColumn === column) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
        sortColumn = column;
        sortDirection = "asc";
    }

    // Sắp xếp filteredProducts
    filteredProducts.sort((a, b) => {
        let valueA, valueB;

        if (column === "title") {
            valueA = a.title.toLowerCase();
            valueB = b.title.toLowerCase();
        } else if (column === "price") {
            valueA = a.price;
            valueB = b.price;
        }

        if (valueA < valueB) {
            return sortDirection === "asc" ? -1 : 1;
        }
        if (valueA > valueB) {
            return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
    });

    // Cập nhật icon sắp xếp
    updateSortIcons();

    // Reset về trang 1 và hiển thị lại
    currentPage = 1;
    displayProducts();
    setupPagination();
}

// Cập nhật biểu tượng sắp xếp
function updateSortIcons() {
    // Xóa active class từ tất cả
    document.querySelectorAll(".sortable").forEach((th) => {
        th.classList.remove("active");
        const icon = th.querySelector(".sort-icon");
        if (icon) {
            icon.textContent = "⇅";
        }
    });

    // Thêm active class và cập nhật icon cho cột đang sắp xếp
    if (sortColumn) {
        const activeHeader = document.getElementById(`sort${sortColumn.charAt(0).toUpperCase() + sortColumn.slice(1)}`);
        if (activeHeader) {
            activeHeader.classList.add("active");
            const icon = activeHeader.querySelector(".sort-icon");
            if (icon) {
                icon.textContent = sortDirection === "asc" ? "↑" : "↓";
            }
        }
    }
}

// Thay đổi số sản phẩm mỗi trang
function changeItemsPerPage() {
    const select = document.getElementById("itemsPerPageSelect");
    itemsPerPage = parseInt(select.value);
    currentPage = 1;
    displayProducts();
    setupPagination();
}

// Làm sạch URL hình ảnh (API này đôi khi trả về URL với dấu ngoặc)
function cleanImageUrl(url) {
    if (!url) return "https://placehold.co/80x80/e2e8f0/64748b?text=No+Image";

    let cleanUrl = url.replace(/[\[\]"]/g, "").trim();

    // Kiểm tra URL có hợp lệ không
    try {
        new URL(cleanUrl);
        // Chặn các domain có vấn đề
        if (cleanUrl.includes("placeimg.com") || cleanUrl.includes("picsum.photos") || (cleanUrl.endsWith(".jpg") && !cleanUrl.startsWith("http"))) {
            return "https://placehold.co/80x80/e2e8f0/64748b?text=No+Image";
        }

        // Trả về URL gốc, để onerror handler xử lý nếu fail
        return cleanUrl;
    } catch (e) {
        return "https://placehold.co/80x80/e2e8f0/64748b?text=No+Image";
    }
}

// Xử lý lỗi ảnh với fallback thông minh
function handleImageError(img) {
    const originalSrc = img.getAttribute("data-original-src") || img.src;
    const placeholderUrl = "https://placehold.co/80x80/e2e8f0/64748b?text=No+Image";

    // Nếu đã là placeholder thì không làm gì nữa
    if (img.src === placeholderUrl || img.src.includes("placehold.co")) {
        img.onerror = null;
        return;
    }

    // Lưu URL gốc
    if (!img.getAttribute("data-original-src")) {
        img.setAttribute("data-original-src", originalSrc);
    }

    // Thử dùng proxy imgproxy.net (miễn phí, không rate limit)
    if (!img.getAttribute("data-proxy-tried")) {
        img.setAttribute("data-proxy-tried", "true");
        const encodedUrl = encodeURIComponent(originalSrc);
        img.src = `https://imgproxy.net/?url=${encodedUrl}`;
        return;
    }

    // Nếu proxy cũng fail, dùng placeholder
    img.src = placeholderUrl;
    img.onerror = null;
}

// Escape HTML để tránh XSS
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// Tìm kiếm sản phẩm theo title
function searchProducts() {
    const searchInput = document.getElementById("searchInput");
    const searchTerm = searchInput.value.toLowerCase().trim();
    const searchResultText = document.getElementById("searchResultText");

    if (searchTerm === "") {
        filteredProducts = allProducts;
        searchResultText.textContent = "";
    } else {
        filteredProducts = allProducts.filter((product) => product.title.toLowerCase().includes(searchTerm));

        if (filteredProducts.length === 0) {
            searchResultText.textContent = `Không tìm thấy sản phẩm nào phù hợp với "${searchInput.value}"`;
        } else {
            searchResultText.textContent = `Tìm thấy ${filteredProducts.length} sản phẩm phù hợp`;
        }
    }

    currentPage = 1;
    displayProducts();
    setupPagination();
}

// Xóa tìm kiếm
function clearSearch() {
    document.getElementById("searchInput").value = "";
    searchProducts();
}

// Export dữ liệu hiện tại ra CSV
function exportToCSV() {
    if (filteredProducts.length === 0) {
        alert("Không có dữ liệu để export!");
        return;
    }

    // Tạo header CSV
    const headers = ["ID", "Title", "Price", "Category", "Description"];
    let csvContent = headers.join(",") + "\n";

    // Thêm dữ liệu
    filteredProducts.forEach((product) => {
        const row = [
            product.id,
            `"${escapeCSV(product.title)}"`,
            product.price,
            `"${escapeCSV(product.category?.name || "N/A")}"`,
            `"${escapeCSV(product.description || "Không có mô tả")}"`,
        ];
        csvContent += row.join(",") + "\n";
    });

    // Tạo Blob và download
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `products_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Hiển thị thông báo
    alert(`Đã export ${filteredProducts.length} sản phẩm ra file CSV!`);
}

// Escape dữ liệu cho CSV (xử lý dấu ngoặc kép và dấu phẩy)
function escapeCSV(text) {
    if (!text) return "";
    return String(text).replace(/"/g, '""').replace(/\n/g, " ");
}

// Hiển thị tooltip description
function showDescriptionTooltip(event) {
    const tooltip = document.getElementById("descriptionTooltip");
    const description = event.currentTarget.dataset.description;

    tooltip.textContent = description;
    tooltip.style.display = "block";

    moveDescriptionTooltip(event);
}

// Di chuyển tooltip theo chuột
function moveDescriptionTooltip(event) {
    const tooltip = document.getElementById("descriptionTooltip");
    const offset = 15;

    let x = event.clientX + offset;
    let y = event.clientY + offset;

    // Kiểm tra nếu tooltip vượt ra ngoài viewport
    const tooltipRect = tooltip.getBoundingClientRect();
    if (x + tooltipRect.width > window.innerWidth) {
        x = event.clientX - tooltipRect.width - offset;
    }
    if (y + tooltipRect.height > window.innerHeight) {
        y = event.clientY - tooltipRect.height - offset;
    }

    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
}

// Ẩn tooltip
function hideDescriptionTooltip() {
    const tooltip = document.getElementById("descriptionTooltip");
    tooltip.style.display = "none";
}

// Hiển thị modal tạo sản phẩm
function showCreateModal() {
    // Reset form
    document.getElementById("createForm").reset();

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById("createProductModal"));
    modal.show();
}

// Tạo sản phẩm mới
async function createProduct() {
    const title = document.getElementById("createTitle").value.trim();
    const price = parseFloat(document.getElementById("createPrice").value);
    const description = document.getElementById("createDescription").value.trim();
    const categoryId = parseInt(document.getElementById("createCategoryId").value);
    const image1 = document.getElementById("createImage1").value.trim();
    const image2 = document.getElementById("createImage2").value.trim();
    const image3 = document.getElementById("createImage3").value.trim();

    // Validation
    if (!title) {
        alert("Vui lòng nhập tên sản phẩm!");
        return;
    }
    if (!price || price <= 0) {
        alert("Vui lòng nhập giá hợp lệ!");
        return;
    }
    if (!categoryId) {
        alert("Vui lòng chọn danh mục!");
        return;
    }
    if (!image1) {
        alert("Vui lòng nhập ít nhất 1 URL hình ảnh!");
        return;
    }

    // Tạo mảng images
    const images = [image1];
    if (image2) images.push(image2);
    if (image3) images.push(image3);

    try {
        const response = await fetch("https://api.escuelajs.co/api/v1/products/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: title,
                price: price,
                description: description,
                categoryId: categoryId,
                images: images,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const newProduct = await response.json();

        // Thêm sản phẩm vào đầu danh sách
        allProducts.unshift(newProduct);
        filteredProducts.unshift(newProduct);

        // Quay về trang 1 và hiển thị lại
        currentPage = 1;
        displayProducts();
        setupPagination();

        // Đóng modal
        const modal = bootstrap.Modal.getInstance(document.getElementById("createProductModal"));
        modal.hide();

        alert(`Đã tạo sản phẩm "${newProduct.title}" thành công!`);
    } catch (err) {
        alert(`Lỗi khi tạo sản phẩm: ${err.message}`);
    }
}

// Hiển thị chi tiết sản phẩm trong modal
let currentProduct = null;

function showProductDetail(product) {
    currentProduct = product;

    // Hiển thị thông tin sản phẩm
    document.getElementById("modalId").textContent = product.id;
    document.getElementById("modalTitle").textContent = product.title;
    document.getElementById("modalPrice").textContent = `$${product.price}`;
    document.getElementById("modalCategory").textContent = product.category?.name || "N/A";
    document.getElementById("modalDescription").textContent = product.description || "Không có mô tả";

    // Hiển thị ảnh
    if (product.images && product.images.length > 0) {
        const mainImage = cleanImageUrl(product.images[0]);
        document.getElementById("modalMainImage").src = mainImage;

        // Hiển thị gallery
        const gallery = document.getElementById("modalImageGallery");
        gallery.innerHTML = "";
        product.images.forEach((img, index) => {
            const cleanUrl = cleanImageUrl(img);
            const imgEl = document.createElement("img");
            imgEl.src = cleanUrl;
            imgEl.alt = `Image ${index + 1}`;
            imgEl.onerror = () => handleImageError(imgEl);
            imgEl.onclick = () => {
                document.getElementById("modalMainImage").src = cleanUrl;
            };
            gallery.appendChild(imgEl);
        });
    } else {
        document.getElementById("modalMainImage").src = "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image";
        document.getElementById("modalImageGallery").innerHTML = "";
    }

    // Đảm bảo ở view mode
    document.getElementById("viewMode").classList.remove("d-none");
    document.getElementById("editMode").classList.add("d-none");
    document.getElementById("viewModeButtons").classList.remove("d-none");
    document.getElementById("editModeButtons").classList.add("d-none");

    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById("productModal"));
    modal.show();
}

// Chuyển đổi giữa view mode và edit mode
function toggleEditMode() {
    const viewMode = document.getElementById("viewMode");
    const editMode = document.getElementById("editMode");
    const viewButtons = document.getElementById("viewModeButtons");
    const editButtons = document.getElementById("editModeButtons");

    if (viewMode.classList.contains("d-none")) {
        // Chuyển về view mode
        viewMode.classList.remove("d-none");
        editMode.classList.add("d-none");
        viewButtons.classList.remove("d-none");
        editButtons.classList.add("d-none");
    } else {
        // Chuyển sang edit mode
        viewMode.classList.add("d-none");
        editMode.classList.remove("d-none");
        viewButtons.classList.add("d-none");
        editButtons.classList.remove("d-none");

        // Điền thông tin vào form
        document.getElementById("editProductId").value = currentProduct.id;
        document.getElementById("editTitle").value = currentProduct.title;
        document.getElementById("editPrice").value = currentProduct.price;
        document.getElementById("editDescription").value = currentProduct.description || "";
    }
}

// Lưu thay đổi sản phẩm
async function saveProduct() {
    const id = document.getElementById("editProductId").value;
    const title = document.getElementById("editTitle").value;
    const price = parseFloat(document.getElementById("editPrice").value);
    const description = document.getElementById("editDescription").value;

    if (!title || !price) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    try {
        const response = await fetch(`https://api.escuelajs.co/api/v1/products/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                title: title,
                price: price,
                description: description,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const updatedProduct = await response.json();

        // Cập nhật trong danh sách
        const index = allProducts.findIndex((p) => p.id === parseInt(id));
        if (index !== -1) {
            allProducts[index] = { ...allProducts[index], ...updatedProduct };
        }

        const filteredIndex = filteredProducts.findIndex((p) => p.id === parseInt(id));
        if (filteredIndex !== -1) {
            filteredProducts[filteredIndex] = { ...filteredProducts[filteredIndex], ...updatedProduct };
        }

        // Cập nhật currentProduct
        currentProduct = { ...currentProduct, ...updatedProduct };

        // Hiển thị lại thông tin
        displayProducts();
        showProductDetail(currentProduct);

        alert("Đã cập nhật sản phẩm thành công!");
    } catch (err) {
        alert(`Lỗi khi cập nhật: ${err.message}`);
    }
}

// Tải sản phẩm khi trang load
window.onload = loadProducts;
