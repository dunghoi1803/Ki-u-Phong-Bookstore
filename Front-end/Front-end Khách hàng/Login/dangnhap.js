// Simple in-memory OTP storage for demo only
const DB = {
    otpStore: {}
};

// Chuyển đổi tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Chọn phương thức OTP
document.querySelectorAll('.otp-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.otp-methods').querySelectorAll('.otp-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

// Toggle hiện/ẩn mật khẩu
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function() {
        const input = this.previousElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            this.textContent = 'Ẩn';
        } else {
            input.type = 'password';
            this.textContent = 'Hiện';
        }
    });
});

// Gửi OTP (Đăng ký)
let registerOTP = null;
let registerTimer = null;

document.getElementById('send-otp-btn').addEventListener('click', function() {
    const contact = document.getElementById('register-contact').value.trim();
    if (!contact) {
        showMessage('register', 'Vui lòng nhập số điện thoại hoặc email!', 'error');
        return;
    }

    const method = document.querySelector('#register-tab .otp-btn.active').dataset.method;
    registerOTP = Math.floor(100000 + Math.random() * 900000).toString();
    DB.otpStore[contact] = registerOTP;

    console.log(`OTP gửi qua ${method.toUpperCase()}: ${registerOTP}`);
    alert(`Mã OTP đã được gửi qua ${method === 'sms' ? 'SMS' : 'Zalo ZNS'}: ${registerOTP}\n(Trong thực tế, bạn sẽ nhận qua điện thoại)`);

    document.getElementById('otp-group').style.display = 'block';
    startTimer('register', 60);
});

// Gửi OTP (Quên mật khẩu)
let forgotOTP = null;
let forgotTimer = null;

document.getElementById('send-forgot-otp-btn').addEventListener('click', function() {
    const contact = document.getElementById('forgot-contact').value.trim();
    if (!contact) {
        showMessage('forgot', 'Vui lòng nhập email đã đăng ký!', 'error');
        return;
    }

    const method = document.querySelector('#forgot-password-modal .otp-btn.active').dataset.method;
    forgotOTP = Math.floor(100000 + Math.random() * 900000).toString();
    DB.otpStore[contact] = forgotOTP;

    console.log(`OTP khôi phục qua ${method.toUpperCase()}: ${forgotOTP}`);
    alert(`Mã OTP đã được gửi qua ${method === 'sms' ? 'SMS' : 'Zalo ZNS'}: ${forgotOTP}\n(Trong thực tế, đây chỉ là demo OTP).`);

    document.getElementById('forgot-otp-group').style.display = 'block';
    startTimer('forgot', 60);
});

// Timer OTP
function startTimer(type, seconds) {
    const timerElement = document.getElementById(type === 'register' ? 'timer' : 'forgot-timer');
    let timeLeft = seconds;

    if (type === 'register') {
        clearInterval(registerTimer);
        registerTimer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(registerTimer);
                registerOTP = null;
            }
        }, 1000);
    } else {
        clearInterval(forgotTimer);
        forgotTimer = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(forgotTimer);
                forgotOTP = null;
            }
        }, 1000);
    }
}

// Đăng ký
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const contact = document.getElementById('register-contact').value.trim();
    const otp = document.getElementById('register-otp').value.trim();
    const password = document.getElementById('register-password').value;

    if (!contact || !otp || !password) {
        showMessage('register', 'Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(contact)) {
        showMessage('register', 'Vui lòng nhập email hợp lệ (ví dụ: abc@gmail.com).', 'error');
        return;
    }

    if (otp !== DB.otpStore[contact]) {
        showMessage('register', 'Mã OTP không đúng!', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}${API_V1_PREFIX}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ho_ten: contact,
                email: contact,
                so_dien_thoai: null,
                password
            })
        });
        if (!res.ok) {
            const text = await res.text();
            console.error("Register error:", res.status, text);
            let msg = 'Đăng ký thất bại.';
            try {
                const json = JSON.parse(text);
                if (json.detail) msg = json.detail;
            } catch (_) {
                // keep default msg
            }
            showMessage('register', msg, 'error');
            return;
        }

        showMessage('register', 'Đăng ký thành công! Vui lòng đăng nhập.', 'success');
        setTimeout(() => {
            document.querySelector('.tab-btn[data-tab="login"]').click();
            document.getElementById('register-form').reset();
            document.getElementById('otp-group').style.display = 'none';
        }, 1500);
    } catch (err) {
        console.error(err);
        showMessage('register', 'Đăng ký thất bại do lỗi kết nối.', 'error');
    }
});

// Đăng nhập
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const contact = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(contact)) {
        showMessage('login', 'Vui lòng nhập email hợp lệ (ví dụ: abc@gmail.com).', 'error');
        return;
    }

    try {
        const loginResponse = await fetch(`${API_BASE}${API_V1_PREFIX}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                username: contact,
                password
            })
        });
        if (!loginResponse.ok) {
            const text = await loginResponse.text();
            console.error("Login error:", loginResponse.status, text);
            let msg = 'Tên đăng nhập hoặc mật khẩu không đúng!';
            try {
                const json = JSON.parse(text);
                if (json.detail) msg = json.detail;
            } catch (_) {
                // keep default
            }
            showMessage('login', msg, 'error');
            return;
        }
        const tokenPayload = await loginResponse.json();
        window.sessionStorage.setItem("accessToken", tokenPayload.access_token);

        const currentUser = await apiRequest("/auth/me");
        window.sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
        window.localStorage.setItem("logged_in", "true");

        const isAdmin = (currentUser.roles || []).some(
            (role) => role.ma_vai_tro_code === "admin"
        );

        if (isAdmin) {
            window.location.href = "/Front-end Admin/QLy Sách.html";
        } else {
            window.location.href = "/Front-end Khách hàng/Taikhoan/taikhoan.html";
        }
    } catch (err) {
        console.error(err);
        showMessage('login', 'Đăng nhập thất bại do lỗi kết nối.', 'error');
    }
});

// Khôi phục mật khẩu
document.getElementById('forgot-password-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const contact = document.getElementById('forgot-contact').value.trim();
    const otp = document.getElementById('forgot-otp').value.trim();
    const newPassword = document.getElementById('new-password').value;

    if (!contact || !otp || !newPassword) {
        showMessage('forgot', 'Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }

    if (otp !== DB.otpStore[contact]) {
        showMessage('forgot', 'Mã OTP không đúng (demo).', 'error');
        return;
    }

    // Chưa có API đổi mật khẩu backend, nên chỉ demo thông báo
    showMessage('forgot', 'Đây chỉ là demo OTP, chưa đổi mật khẩu thật trên server.', 'success');
    setTimeout(() => {
        closeForgotPassword();
        document.getElementById('forgot-password-form').reset();
        document.getElementById('forgot-otp-group').style.display = 'none';
    }, 1500);
});

// Hiển thị thông báo
function showMessage(formType, message, type) {
    const formMap = {
        'register': 'register-form',
        'login': 'login-form',
        'forgot': 'forgot-password-form'
    };
    
    const form = document.getElementById(formMap[formType]);
    const existingMsg = form.querySelector('.error-message, .success-message');
    if (existingMsg) existingMsg.remove();

    const div = document.createElement('div');
    div.className = type === 'error' ? 'error-message' : 'success-message';
    div.textContent = message;
    form.insertBefore(div, form.firstChild);

    setTimeout(() => div.remove(), 3000);
}

// Hiển thị modal quên mật khẩu
function showForgotPassword() {
    document.getElementById('forgot-password-modal').style.display = 'block';
}

function closeForgotPassword() {
    document.getElementById('forgot-password-modal').style.display = 'none';
}

document.querySelector('.close').addEventListener('click', closeForgotPassword);

window.addEventListener('click', function(e) {
    const modal = document.getElementById('forgot-password-modal');
    if (e.target === modal) {
        closeForgotPassword();
    }
});

// Các function này không còn cần thiết vì đã chuyển sang trang riêng
// Nhưng giữ lại để tương thích nếu cần
function showAccountInfo(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = '/Taikhoan/taikhoan.html';
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '/dangnhap.html';
}
