document.addEventListener('DOMContentLoaded', () => {
    // --- 0. State & Data Layers ---
    let products = [
        { id: 1, name: "BTD Summer Shirt", price: "4,500 DZD", color: "Port", img: "teaser_1.jpg", badge: "-15%" },
        { id: 2, name: "BTD Summer Shirt", price: "4,500 DZD", color: "Deep Forest", img: "teaser_2.jpg" },
        { id: 3, name: "BTD Summer Shirt", price: "4,500 DZD", color: "Bone", img: "teaser_3.jpg", badge: "-14%" },
        { id: 4, name: "BTD Summer Shirt", price: "4,500 DZD", color: "Charcoal", img: "teaser_4_new.jpg" }
    ];

    let cartItems = JSON.parse(localStorage.getItem('btd_cart')) || [];
    let userState = JSON.parse(localStorage.getItem('btd_user_state')) || {
        isLoggedIn: false,
        name: "",
        email: "",
        orders: []
    };

    let currentProductData = null;
    let isTorn = false;
    let isDragging = false;
    let startX = 0;

    // --- 1. Core Engines ---

    // Dynamic Shop Rendering
    const renderProducts = async () => {
        const grid = document.querySelector('.best-seller-grid');
        if (!grid) return;

        // Fetch Dynamic Products from Admin
        try {
            const res = await fetch('api.php', { method: 'POST', body: JSON.stringify({ action: 'get_products' }) });
            const serverProducts = await res.json();
            if (serverProducts && serverProducts.length > 0) {
                // Map server data to shop format
                products = serverProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    color: p.category || "Summer Essential",
                    img: p.image || "teaser_1.jpg"
                }));
            }
        } catch (e) { console.log("Using static fallback products"); }

        grid.innerHTML = products.map(p => `
            <div class="bs-product-card interactive-card" data-product="${p.name}" data-price="${p.price}"
                data-color="${p.color}" data-img="${p.img}">
                <div class="bs-img-box">
                    ${p.badge ? `<div class="bs-badge">${p.badge}</div>` : ''}
                    <img src="${p.img}" alt="${p.color}">
                </div>
                <div class="bs-info">
                    <h3>${p.name}</h3>
                    <p class="bs-price">${p.price}</p>
                </div>
            </div>
        `).join('');
        attachProductListeners();
    };

    const attachProductListeners = () => {
        document.querySelectorAll('.interactive-card').forEach(card => {
            card.addEventListener('click', () => openProductModal(card));
        });
    };

    // Preloader Logic
    const loader = document.querySelector('.loader');
    if (loader) {
        setTimeout(() => loader.classList.add('fade-out'), 3500);
    }

    // Scroll Reveal Engine
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                if (entry.target.id === 'about') document.body.style.backgroundColor = '#f4eadd';
                else if (entry.target.id === 'shop') document.body.style.backgroundColor = '#fdfaf5';
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal, section').forEach(el => revealObserver.observe(el));

    // --- 2. Interaction Handlers ---

    // Navbar & Panels
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    const togglePanel = (id, active) => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('active', active);
            document.body.style.overflow = el.classList.contains('active') ? 'hidden' : '';
        }
    };

    document.getElementById('searchTrigger')?.addEventListener('click', () => togglePanel('topPanel', true));
    document.getElementById('closePanel')?.addEventListener('click', () => togglePanel('topPanel', false));
    document.getElementById('cartTrigger')?.addEventListener('click', () => togglePanel('cartSidebar', true));
    document.getElementById('closeCart')?.addEventListener('click', () => togglePanel('cartSidebar', false));
    document.getElementById('accountTrigger')?.addEventListener('click', () => togglePanel('accountPanel', true));
    document.getElementById('closeAccount')?.addEventListener('click', () => togglePanel('accountPanel', false));

    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // Cart Engine
    const updateCartUI = () => {
        const list = document.getElementById('cartItemsList');
        const count = document.querySelector('.cart-count');
        const subtotal = document.getElementById('cartSubtotal');

        if (count) count.textContent = cartItems.length;
        if (!list) return;

        if (cartItems.length === 0) {
            list.innerHTML = '<div class="empty-cart-msg">Your bag is empty.</div>';
            if (subtotal) subtotal.textContent = '0 DZD';
            return;
        }

        let total = 0;
        list.innerHTML = cartItems.map((item, index) => {
            const price = parseInt(item.price.replace(/[^\d]/g, ''));
            total += price;
            return `
                <div class="cart-item">
                    <img src="${item.img}" class="cart-item-img">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <span class="cart-item-meta">${item.color} | Size: ${item.selectedSize || 'M'}</span>
                        <div class="cart-item-price">${item.price}</div>
                    </div>
                    <button class="remove-cart-item" onclick="removeFromCart(${index})"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
        }).join('');
        if (subtotal) subtotal.textContent = total.toLocaleString() + ' DZD';
    };

    window.removeFromCart = (index) => {
        cartItems.splice(index, 1);
        localStorage.setItem('btd_cart', JSON.stringify(cartItems));
        updateCartUI();
    };

    const addToCart = (product) => {
        cartItems.push({ ...product, id: Date.now() });
        localStorage.setItem('btd_cart', JSON.stringify(cartItems));
        updateCartUI();
        togglePanel('cartSidebar', true);
    };

    // --- 3. Modal & Boarding Pass Logic ---
    const openProductModal = (card) => {
        // Color Map for BTD Summer Shirts
        const colorMap = {
            "Port": { hex: "#682a2a", img: "teaser_1.jpg" },
            "Deep Forest": { hex: "#1f3a2d", img: "teaser_2.jpg" },
            "Bone": { hex: "#e0d5c1", img: "teaser_3.jpg" },
            "Charcoal": { hex: "#333333", img: "teaser_4_new.jpg" }
        };

        currentProductData = {
            name: card.getAttribute('data-product'),
            price: card.getAttribute('data-price'),
            color: card.getAttribute('data-color'), // Original color
            img: card.getAttribute('data-img'),
            selectedSize: 'M',
            selectedColor: card.getAttribute('data-color') // Init with clicked color
        };

        const sheet = document.getElementById('productSheet');
        const ticket = document.getElementById('ticketStep');
        const modal = document.getElementById('productModal');

        if (sheet) {
            sheet.style.display = 'block';
            sheet.style.opacity = '1';
            document.getElementById('sheetImg').src = currentProductData.img;
            document.getElementById('sheetName').textContent = currentProductData.name;
            document.getElementById('sheetPrice').textContent = currentProductData.price;

            // Render Interactive Color Dots
            const colorsContainer = document.querySelector('.sheet-colors');
            if (colorsContainer) {
                colorsContainer.innerHTML = ''; // Clear static dots
                Object.keys(colorMap).forEach(colorKey => {
                    const dot = document.createElement('div');
                    dot.className = `color-dot ${colorKey === currentProductData.selectedColor ? 'active' : ''}`;
                    dot.style.background = colorMap[colorKey].hex;
                    dot.title = colorKey; // Tooltip
                    dot.onclick = () => {
                        // Update State (Keep original image)
                        currentProductData.selectedColor = colorKey;

                        // Update UI Visuals (Dots only)
                        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                        dot.classList.add('active');
                    };
                    colorsContainer.appendChild(dot);
                });
            }
        }
        if (ticket) ticket.style.display = 'none';

        isTorn = false;
        document.getElementById('tagSystem')?.classList.remove('is-torn', 'is-flipped');
        document.getElementById('tearPart').style.transform = '';

        document.getElementById('modalImg').src = currentProductData.img;
        document.getElementById('modalName').textContent = currentProductData.name;
        document.getElementById('modalPrice').textContent = currentProductData.price;

        // Size Selection Logic
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent === 'M') btn.classList.add('active'); // Reset to default

            btn.onclick = (e) => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentProductData.selectedSize = e.target.textContent;
            };
        });

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Close Button for Ticket/Sheet Modal
    document.getElementById('modalClose')?.addEventListener('click', () => {
        document.querySelectorAll('.product-modal').forEach(m => m.classList.remove('active'));
    });

    document.getElementById('confirmSheet')?.addEventListener('click', () => {
        const sheet = document.getElementById('productSheet');
        const ticket = document.getElementById('ticketStep');
        sheet.style.opacity = '0';

        // Update Ticket Details
        document.getElementById('modalName').textContent = currentProductData.name;
        // Show Color Dot + Name | Size
        const colorHex = {
            "Port": "#682a2a",
            "Deep Forest": "#1f3a2d",
            "Bone": "#e0d5c1",
            "Charcoal": "#333333"
        }[currentProductData.selectedColor] || "#000";

        document.getElementById('modalMeta').innerHTML = `
            <span style="display:inline-block; width:12px; height:12px; background:${colorHex}; border-radius:50%; margin-right:5px; border:1px solid #ddd; vertical-align:middle;"></span>
            <span style="display:inline-block; vertical-align:middle;">${currentProductData.selectedColor}</span>
            <span style="color:#ddd; margin:0 8px;">|</span>
            <span style="display:inline-block; vertical-align:middle;">Size: ${currentProductData.selectedSize}</span>
        `;

        // Dynamic Date Barcode
        const today = new Date().toISOString().split('T')[0];
        document.querySelector('.barcode-id').textContent = `BTD-${today}`;

        setTimeout(() => {
            sheet.style.display = 'none';
            ticket.style.display = 'flex';
            ticket.style.opacity = '1';
        }, 400);
    });

    const tearPart = document.getElementById('tearPart');
    if (tearPart) {
        tearPart.addEventListener('pointerdown', (e) => {
            if (isTorn) return;
            startX = e.clientX;
            isDragging = true;
            tearPart.setPointerCapture(e.pointerId);
        });

        tearPart.addEventListener('pointermove', (e) => {
            if (!isDragging || isTorn) return;
            const deltaX = e.clientX - startX;
            if (deltaX < -10) {
                tearPart.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 10}deg)`;
            }
        });

        tearPart.addEventListener('pointerup', (e) => {
            if (!isDragging || isTorn) return;
            isDragging = false;
            const deltaX = e.clientX - startX;
            if (deltaX < -30) { // Super easy threshold (was -60)
                isTorn = true;
                document.getElementById('tagSystem').classList.add('is-torn');
                tearPart.style.transform = '';
                addToCart(currentProductData);
                if (window.navigator.vibrate) window.navigator.vibrate([40, 20, 40]);
            } else {
                tearPart.style.transform = '';
            }
        });
    }

    // --- 4. Checkout & Backend ---
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        // Phone Mask Logic
        const phoneInput = document.getElementById('custPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})/);
                e.target.value = !x[2] ? x[1] : x[1] + (x[2] ? ' ' + x[2] : '') + (x[3] ? ' ' + x[3] : '') + (x[4] ? ' ' + x[4] : '') + (x[5] ? ' ' + x[5] : '');
            });
        }

        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = checkoutForm.querySelector('button[type="submit"]'); // Generic selector
            submitBtn.innerHTML = '<span>PROCESSING...</span><div class="btn-shine"></div>';

            const orderId = Math.floor(100000 + Math.random() * 900000);
            const total = document.getElementById('summaryTotal').textContent;

            const orderData = {
                id: orderId,
                customer: {
                    name: document.getElementById('custName').value,
                    phone: document.getElementById('custPhone').value,
                    address: document.getElementById('custAddress').value,
                    wilaya: document.getElementById('custWilaya').value
                },
                items: cartItems,
                total: total,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                status: "Processing"
            };

            // 1. Always Save Order Locally (Offline-First Mode)
            userState.orders.unshift(orderData);
            localStorage.setItem('btd_user_state', JSON.stringify(userState));

            // 2. Clear Cart
            cartItems = [];
            localStorage.setItem('btd_cart', '[]');
            updateCartUI();

            // 3. Attempt Backend Sync (Silent Fail)
            try {
                fetch('api.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'place_order', data: orderData })
                }).catch(() => console.log("Backend offline - Order saved locally"));
            } catch (e) {
                // Ignore backend errors
            }

            // 4. Success UI & WhatsApp
            const msg = `🚀 *NEW ORDER #${orderId}*\nTotal: ${total}`;
            // Optional: Uncomment to auto-open WhatsApp
            // window.open(`https://wa.me/213555555555?text=${encodeURIComponent(msg)}`, '_blank');

            document.getElementById('checkoutModal').classList.remove('active');
            document.getElementById('successModal').classList.add('active');

            document.getElementById('checkoutModal').classList.remove('active');
            document.getElementById('successModal').classList.add('active');

            submitBtn.innerHTML = '<span>CONFIRM ORDER</span><div class="btn-shine"></div>';
        });
    }

    // Init
    renderProducts();
    updateCartUI();

    // Account View
    const updateOrdersUI = () => {
        const list = document.getElementById('dynamicOrdersList');
        if (!list) return;
        list.innerHTML = userState.orders.map(o => `
            <div class="order-summary-header">
                <div><span>#${o.id}</span></div>
                <div><strong>${o.date}</strong></div>
                <div><span class="status">${o.status}</span></div>
            </div>
        `).join('') || '<p>No orders yet.</p>';
    };

    document.getElementById('openOrdersBtn')?.addEventListener('click', () => {
        document.getElementById('accountMenuView').classList.remove('active');
        document.getElementById('ordersListView').classList.add('active');
        updateOrdersUI();
    });

    document.getElementById('backToAccount')?.addEventListener('click', () => {
        document.getElementById('ordersListView').classList.remove('active');
        document.getElementById('accountMenuView').classList.add('active');
    });

    // Close Modal on Esc
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.product-modal').forEach(m => m.classList.remove('active'));
        }
    });

    // --- 5. Technical Integrations: Search & Checkout Trigger ---

    const openCheckout = () => {
        if (cartItems.length === 0) {
            alert("Your bag is empty.");
            return;
        }

        // Close side panels
        togglePanel('cartSidebar', false);
        togglePanel('topPanel', false);

        // Sync Total
        // Sync Total to Receipt
        const cartTotal = document.getElementById('cartSubtotal').textContent;
        document.getElementById('summaryTotal').textContent = cartTotal;
        document.getElementById('receiptFinal').textContent = cartTotal;

        // Open Modal
        document.getElementById('checkoutModal').classList.add('active');
    };

    // Connect all "Checkout" buttons
    document.querySelectorAll('button, a.btn').forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === 'checkout') {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openCheckout();
            });
        }
    });

    // Close Checkout Modal
    document.getElementById('closeCheckout')?.addEventListener('click', () => {
        document.getElementById('checkoutModal').classList.remove('active');
    });

    // Search Logic
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const allCards = document.querySelectorAll('.interactive-card');

            let hasResults = false;
            allCards.forEach(card => {
                const name = card.getAttribute('data-product').toLowerCase();
                const color = card.getAttribute('data-color').toLowerCase();

                if (name.includes(term) || color.includes(term)) {
                    card.style.display = 'block';
                    hasResults = true;
                } else {
                    card.style.display = 'none';
                }
            });

            const grid = document.querySelector('.best-seller-grid');
            let noResMsg = document.getElementById('no-results-msg');

            if (!hasResults) {
                if (!noResMsg) {
                    noResMsg = document.createElement('div');
                    noResMsg.id = 'no-results-msg';
                    noResMsg.textContent = 'No products found.';
                    noResMsg.style.textAlign = 'center';
                    noResMsg.style.gridColumn = '1 / -1';
                    noResMsg.style.padding = '40px';
                    noResMsg.style.color = '#777';
                    grid.appendChild(noResMsg);
                }
            } else {
                if (noResMsg) noResMsg.remove();
            }
        });
    }

    // Visual Receipt Interaction
    const visualSide = document.querySelector('.checkout-visual-side');
    if (visualSide) {
        visualSide.addEventListener('click', (e) => {
            const msg = document.getElementById('visualMessage');
            const receipt = document.querySelector('.digital-receipt');

            // Toggle logic
            if (msg.classList.contains('active')) {
                msg.classList.remove('active');
                receipt.style.filter = 'none';
                receipt.style.opacity = '1';
                receipt.style.pointerEvents = 'auto';
            } else {
                // Only show message if clicking outside receipt
                if (!e.target.closest('.digital-receipt')) {
                    msg.classList.add('active');
                    receipt.style.filter = 'blur(5px)';
                    receipt.style.opacity = '0.4';
                    receipt.style.pointerEvents = 'none';
                }
            }
        });
    }

    // --- 6. Auth Logic System ---
    const updateAccountView = () => {
        const menuView = document.getElementById('accountMenuView');
        const authView = document.getElementById('authView');
        const ordersView = document.getElementById('ordersListView');
        const profileView = document.getElementById('profileDetailView');

        if (!menuView || !authView) return;

        // Reset views
        [menuView, authView, ordersView, profileView].forEach(v => v?.classList.remove('active'));

        if (userState.isLoggedIn) {
            menuView.classList.add('active');
            const title = menuView.querySelector('.editorial-title');
            if (title && userState.name) title.textContent = `Hi, ${userState.name.split(' ')[0]}`;
        } else {
            authView.classList.add('active');
        }
    };

    // Improve Account Trigger
    const accTrigger = document.getElementById('accountTrigger');
    if (accTrigger) {
        accTrigger.addEventListener('click', () => {
            // Defer slightly to ensure panel opened
            setTimeout(updateAccountView, 50);
        });
    }

    // Auth Toggles - Simple Tab Switching
    document.querySelectorAll('.auth-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active from all btns
            document.querySelectorAll('.auth-toggle-btn').forEach(b => b.classList.remove('active'));
            // Remove active from all forms
            document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

            // Set active
            e.target.classList.add('active');

            if (e.target.id === 'showLoginBtn') {
                document.getElementById('loginForm').classList.add('active');
            } else {
                document.getElementById('signupForm').classList.add('active');
            }
        });
    });

    // Handle Signup (Direct - No OTP)
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = signupForm.querySelector('button');
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;

            btn.textContent = 'CREATING ACCOUNT...';

            setTimeout(() => {
                userState.isLoggedIn = true;
                userState.name = name;
                userState.email = email;
                localStorage.setItem('btd_user_state', JSON.stringify(userState));

                btn.textContent = 'CREATE ACCOUNT';
                signupForm.reset();
                updateAccountView(); // Switch to profile view
            }, 1000);
        });
    }

    // Handle Login (Mock)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'VERIFYING...';

            setTimeout(() => {
                userState.isLoggedIn = true;
                userState.name = "Welcome Back";
                userState.email = document.getElementById('loginEmail').value;
                localStorage.setItem('btd_user_state', JSON.stringify(userState));

                btn.textContent = originalText;
                loginForm.reset();
                updateAccountView();
            }, 1000);
        });
    }

    // Sub-view transitions
    document.getElementById('openProfileBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        [document.getElementById('accountMenuView'),
        document.getElementById('authView'),
        document.getElementById('ordersListView')].forEach(v => v?.classList.remove('active'));

        const pv = document.getElementById('profileDetailView');
        if (pv) {
            pv.classList.add('active');
            document.getElementById('profNameDisplay').textContent = userState.name || "N/A";
            document.getElementById('profEmailDisplay').textContent = userState.email || "N/A";
        }
    });

    document.getElementById('backToMenu')?.addEventListener('click', () => {
        document.getElementById('profileDetailView')?.classList.remove('active');
        document.getElementById('accountMenuView')?.classList.add('active');
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        userState.isLoggedIn = false;
        userState.name = "";
        userState.email = "";
        localStorage.setItem('btd_user_state', JSON.stringify(userState));
        updateAccountView();
    });
    // --- 7. Cinematic Lookbook Logic ---
    const lbOverlay = document.getElementById('lookbookOverlay');
    const viewMoreBtn = document.querySelector('.view-more-btn');
    const closeLbBtn = document.getElementById('closeLookbook');
    const lbSlides = document.querySelectorAll('.lb-slide');
    const nextLb = document.querySelector('.lb-nav-btn.next');
    const prevLb = document.querySelector('.lb-nav-btn.prev');
    const progressFill = document.querySelector('.progress-fill');

    let currentLbSlide = 0;
    let lbInterval;

    const updateLbSlides = () => {
        lbSlides.forEach((s, i) => {
            s.classList.toggle('active', i === currentLbSlide);
        });
        // Reset progress
        progressFill.style.transition = 'none';
        progressFill.style.width = '0%';
        setTimeout(() => {
            progressFill.style.transition = 'width 6s linear';
            progressFill.style.width = '100%';
        }, 50);
    };

    const nextSlideFunc = () => {
        currentLbSlide = (currentLbSlide + 1) % lbSlides.length;
        updateLbSlides();
    };

    if (viewMoreBtn) {
        viewMoreBtn.addEventListener('click', () => {
            lbOverlay.classList.add('active');
            updateLbSlides();
            lbInterval = setInterval(nextSlideFunc, 6000);
        });
    }

    if (closeLbBtn) {
        closeLbBtn.addEventListener('click', () => {
            lbOverlay.classList.remove('active');
            clearInterval(lbInterval);
        });
    }

    if (nextLb) nextLb.addEventListener('click', () => {
        clearInterval(lbInterval);
        nextSlideFunc();
        lbInterval = setInterval(nextSlideFunc, 6000);
    });

    if (prevLb) prevLb.addEventListener('click', () => {
        clearInterval(lbInterval);
        currentLbSlide = (currentLbSlide - 1 + lbSlides.length) % lbSlides.length;
        updateLbSlides();
        lbInterval = setInterval(nextSlideFunc, 6000);
    });
});
