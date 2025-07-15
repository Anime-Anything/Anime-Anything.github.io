/**
 * 简单用户认证逻辑 - 支持数据库存储和VIP功能
 */

// API配置
const AUTH_API_BASE = 'https://anime-anything-github-io.vercel.app/api/auth';
const USER_KEY = 'anime_user_info';

// DOM元素
const elements = {
    // 标签页
    loginTab: document.getElementById('loginTab'),
    registerTab: document.getElementById('registerTab'),

    // 表单
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),

    // 登录表单元素
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    loginSubmit: document.getElementById('loginBtn'),

    // 注册表单元素
    registerUsername: document.getElementById('registerUsername'),
    registerPassword: document.getElementById('registerPassword'),
    registerConfirmPassword: document.getElementById('confirmPassword'),
    registerSubmit: document.getElementById('registerBtn'),

    // 切换链接
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),

    // 消息提示
    authMessage: document.getElementById('authMessage'),
    messageText: document.getElementById('messageText')
};

/**
 * 初始化事件监听器
 */
function initializeEventListeners() {
    // 标签页切换
    elements.loginTab.addEventListener('click', () => switchTab('login'));
    elements.registerTab.addEventListener('click', () => switchTab('register'));

    // 表单底部链接切换
    elements.showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('register');
    });

    elements.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('login');
    });

    // 表单提交
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);

    // 实时输入验证
    elements.registerUsername.addEventListener('input', validateUsernameInput);
    elements.registerPassword.addEventListener('input', validatePasswordInput);
    elements.registerConfirmPassword.addEventListener('input', validateConfirmPassword);
    elements.loginUsername.addEventListener('input', clearFieldError);
    elements.loginPassword.addEventListener('input', clearFieldError);
}

/**
 * 切换标签页
 */
function switchTab(tab) {
    // 更新标签样式
    elements.loginTab.classList.toggle('active', tab === 'login');
    elements.registerTab.classList.toggle('active', tab === 'register');

    // 切换表单显示
    elements.loginForm.classList.toggle('active', tab === 'login');
    elements.registerForm.classList.toggle('active', tab === 'register');

    // 清除消息
    hideMessage();

    // 清除表单错误状态
    clearAllErrors();
}

/**
 * 处理登录表单提交
 */
async function handleLogin(event) {
    event.preventDefault();

    const username = elements.loginUsername.value.trim();
    const password = elements.loginPassword.value;

    if (!username || !password) {
        showMessage('请填写完整的登录信息', 'error');
        return;
    }

    try {
        elements.loginSubmit.disabled = true;
        elements.loginSubmit.textContent = '登录中...';

        const response = await fetch('/api/auth?action=login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            // 保存用户信息到本地存储
            localStorage.setItem('currentUser', JSON.stringify({
                username: data.user.username,
                isVIP: data.user.isVIP,
                loginTime: new Date().toISOString()
            }));

            const vipText = data.user.isVIP ? '（VIP用户）' : '';
            showMessage(`登录成功！欢迎回来 ${data.user.username}${vipText}`, 'success');

            // 延迟跳转，让用户看到成功消息
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } else {
            showMessage(data.message || '登录失败', 'error');
        }

    } catch (error) {
        console.error('登录错误:', error);
        showMessage('登录失败：' + error.message, 'error');
    } finally {
        elements.loginSubmit.disabled = false;
        elements.loginSubmit.textContent = '登录';
    }
}

/**
 * 处理注册表单提交
 */
async function handleRegister(event) {
    event.preventDefault();

    const username = elements.registerUsername.value.trim();
    const password = elements.registerPassword.value;
    const confirmPassword = elements.registerConfirmPassword.value;

    // 基本验证
    if (!username || !password || !confirmPassword) {
        showMessage('请填写完整的注册信息', 'error');
        return;
    }

    if (!validateUsername(username)) {
        showMessage('用户名必须是3-20位字母、数字或下划线', 'error');
        return;
    }

    if (!validatePassword(password)) {
        showMessage('密码必须至少6位', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }

    try {
        elements.registerSubmit.disabled = true;
        elements.registerSubmit.textContent = '注册中...';

        const response = await fetch('/api/auth?action=register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage('注册成功！请登录您的账号', 'success');

            // 清空注册表单
            elements.registerForm.reset();
            updateValidationUI();

            // 切换到登录页面并预填用户名
            setTimeout(() => {
                switchTab('login');
                elements.loginUsername.value = username;
                elements.loginUsername.focus();
                showMessage('请输入密码完成登录', 'info');
            }, 1500);

        } else {
            showMessage(data.message || '注册失败', 'error');
        }

    } catch (error) {
        console.error('注册错误:', error);
        showMessage('注册失败：' + error.message, 'error');
    } finally {
        elements.registerSubmit.disabled = false;
        elements.registerSubmit.textContent = '注册账号';
    }
}

/**
 * 验证所有注册字段
 */
function validateAllFields(username, password, confirmPassword) {
    let isValid = true;

    // 验证用户名
    if (!validateUsernameValue(username)) {
        isValid = false;
    }

    // 验证密码
    if (!validatePasswordValue(password)) {
        isValid = false;
    }

    // 验证确认密码
    if (!validateConfirmPasswordValue(password, confirmPassword)) {
        isValid = false;
    }

    return isValid;
}

/**
 * 简单验证函数 - 供注册使用
 */
function validateUsername(username) {
    return username && username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username);
}

function validatePassword(password) {
    return password && password.length >= 6;
}

function updateValidationUI() {
    // 清除所有验证状态
    const formGroups = elements.registerForm.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.classList.remove('error', 'success');
        const messages = group.querySelectorAll('.error-text, .success-text');
        messages.forEach(msg => msg.remove());
    });
}

/**
 * 用户名验证 - 实时验证
 */
function validateUsernameInput() {
    const username = elements.registerUsername.value.trim();
    validateUsernameValue(username);
}

function validateUsernameValue(username) {
    const field = elements.registerUsername;

    if (!username) {
        setFieldError(field, '请输入用户名');
        return false;
    }

    if (username.length < 3) {
        setFieldError(field, '用户名至少需要3个字符');
        return false;
    }

    if (username.length > 20) {
        setFieldError(field, '用户名不能超过20个字符');
        return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setFieldError(field, '用户名只能包含字母、数字和下划线');
        return false;
    }

    setFieldSuccess(field, '用户名格式正确');
    return true;
}

/**
 * 密码验证
 */
function validatePasswordInput() {
    const password = elements.registerPassword.value.trim();
    validatePasswordValue(password);
}

function validatePasswordValue(password) {
    const field = elements.registerPassword;

    if (!password) {
        setFieldError(field, '请输入密码');
        return false;
    }

    if (password.length < 6) {
        setFieldError(field, '密码至少需要6个字符');
        return false;
    }

    setFieldSuccess(field, '密码长度符合要求');
    return true;
}

/**
 * 确认密码验证
 */
function validateConfirmPassword() {
    const password = elements.registerPassword.value.trim();
    const confirmPassword = elements.registerConfirmPassword.value.trim();
    validateConfirmPasswordValue(password, confirmPassword);
}

function validateConfirmPasswordValue(password, confirmPassword) {
    const field = elements.registerConfirmPassword;

    if (!confirmPassword) {
        setFieldError(field, '请确认密码');
        return false;
    }

    if (password !== confirmPassword) {
        setFieldError(field, '两次输入的密码不一致');
        return false;
    }

    setFieldSuccess(field, '密码确认正确');
    return true;
}

/**
 * 设置字段错误状态
 */
function setFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('success');
    formGroup.classList.add('error');

    // 移除旧的错误和成功信息
    const oldMessages = formGroup.querySelectorAll('.error-text, .success-text');
    oldMessages.forEach(msg => msg.remove());

    // 添加错误信息
    const errorElement = document.createElement('small');
    errorElement.className = 'error-text';
    errorElement.textContent = message;
    formGroup.appendChild(errorElement);
}

/**
 * 设置字段成功状态
 */
function setFieldSuccess(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error');
    formGroup.classList.add('success');

    // 移除旧的错误和成功信息
    const oldMessages = formGroup.querySelectorAll('.error-text, .success-text');
    oldMessages.forEach(msg => msg.remove());

    // 添加成功信息
    const successElement = document.createElement('small');
    successElement.className = 'success-text';
    successElement.textContent = message;
    formGroup.appendChild(successElement);
}

/**
 * 清除字段错误状态
 */
function clearFieldError(e) {
    const field = e.target;
    const formGroup = field.closest('.form-group');
    formGroup.classList.remove('error', 'success');

    // 移除错误和成功信息
    const messages = formGroup.querySelectorAll('.error-text, .success-text');
    messages.forEach(msg => msg.remove());
}

/**
 * 清除所有错误状态
 */
function clearAllErrors() {
    const allFormGroups = document.querySelectorAll('.form-group');
    allFormGroups.forEach(group => {
        group.classList.remove('error', 'success');
        const messages = group.querySelectorAll('.error-text, .success-text');
        messages.forEach(msg => msg.remove());
    });
}

/**
 * 设置按钮加载状态
 */
function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');

    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
        btnText.textContent = '⏳ 处理中...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');

        // 恢复原始文本
        if (button === elements.loginSubmit) { // Changed from elements.loginBtn
            btnText.textContent = '🔑 登录';
        } else if (button === elements.registerSubmit) { // Changed from elements.registerBtn
            btnText.textContent = '📝 注册';
        }
    }
}

/**
 * 显示消息
 */
function showMessage(message, type = 'info') {
    elements.messageText.textContent = message;
    elements.authMessage.className = `auth-message ${type}`;
    elements.authMessage.classList.remove('hidden');

    // 自动隐藏消息
    const hideTimeout = type === 'success' ? 5000 : 8000;
    setTimeout(() => {
        hideMessage();
    }, hideTimeout);
}

/**
 * 隐藏消息
 */
function hideMessage() {
    elements.authMessage.classList.add('hidden');
}

/**
 * 检查用户是否已登录
 */
function isUserLoggedIn() {
    const userInfo = localStorage.getItem(USER_KEY);
    return !!userInfo;
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
    const userInfo = localStorage.getItem(USER_KEY);
    return userInfo ? JSON.parse(userInfo) : null;
}

/**
 * 用户注销
 */
function logout() {
    localStorage.removeItem(USER_KEY);
}

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('用户认证系统初始化中...');

    // 初始化事件监听器
    initializeEventListeners();

    // 检查URL哈希，决定显示哪个标签页
    const hash = window.location.hash;
    if (hash === '#register') {
        switchTab('register');
    } else {
        switchTab('login');
    }

    console.log('✅ 用户认证系统初始化完成');
});

// 导出主要函数供其他模块使用
window.AuthSystem = {
    isUserLoggedIn,
    getCurrentUser,
    logout
}; 