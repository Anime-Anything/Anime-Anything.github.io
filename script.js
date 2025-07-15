/**
 * 动漫头像生成器前端逻辑
 * V1.0 - 对接真实 API 版本
 */

// 配置项
const CONFIG = {
    // 云函数代理 URL - 替换为您的 Vercel 部署地址
    // 格式：https://your-project-name.vercel.app/api/convert
    PROXY_API_URL: 'https://anime-anything-github-io.vercel.app/api/convert',

    // 请求超时设置 (毫秒)
    REQUEST_TIMEOUT: 120000 // 2分钟
};

// DOM 元素引用
const elements = {
    imageUrlInput: document.getElementById('imageUrlInput'),
    promptInput: document.getElementById('promptInput'),
    convertButton: document.getElementById('convertButton'),
    loadingDiv: document.getElementById('loadingDiv'),
    resultDiv: document.getElementById('resultDiv'),
    errorDiv: document.getElementById('errorDiv'),
    resultImage: document.getElementById('resultImage'),
    errorMessage: document.getElementById('errorMessage'),
    downloadButton: document.getElementById('downloadButton'),
    newTaskButton: document.getElementById('newTaskButton'),
    retryButton: document.getElementById('retryButton')
};

/**
 * 显示指定的状态区域
 */
function showState(state) {
    // 隐藏所有状态区域
    elements.loadingDiv.classList.add('hidden');
    elements.resultDiv.classList.add('hidden');
    elements.errorDiv.classList.add('hidden');

    // 显示指定状态
    switch (state) {
        case 'loading':
            elements.loadingDiv.classList.remove('hidden');
            break;
        case 'result':
            elements.resultDiv.classList.remove('hidden');
            break;
        case 'error':
            elements.errorDiv.classList.remove('hidden');
            break;
    }
}

/**
 * 设置按钮状态
 */
function setButtonState(disabled) {
    elements.convertButton.disabled = disabled;

    if (disabled) {
        elements.convertButton.classList.add('disabled');
        elements.convertButton.querySelector('.btn-text').textContent = '⏳ 处理中...';
    } else {
        elements.convertButton.classList.remove('disabled');
        elements.convertButton.querySelector('.btn-text').textContent = '🚀 开始转换';
    }
}

/**
 * 验证输入参数
 */
function validateInputs() {
    const imageUrl = elements.imageUrlInput.value.trim();
    const prompt = elements.promptInput.value.trim();

    if (!imageUrl) {
        throw new Error('请输入图片 URL');
    }

    if (!prompt) {
        throw new Error('请输入风格描述');
    }

    // 验证 URL 格式
    try {
        new URL(imageUrl);
    } catch {
        throw new Error('请输入有效的图片 URL');
    }

    // 验证 URL 协议
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        throw new Error('图片 URL 必须以 http:// 或 https:// 开头');
    }

    return { imageUrl, prompt };
}

/**
 * 调用代理 API 进行图像转换
 */
async function convertImage(imageUrl, prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
        console.log('开始调用代理 API...', { imageUrl, prompt });

        const response = await fetch(CONFIG.PROXY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageUrl: imageUrl,
                prompt: prompt
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`网络请求失败: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API 响应:', result);

        return result;

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('请求超时，请检查网络连接或稍后重试');
        }

        throw error;
    }
}

/**
 * 显示错误信息
 */
function showError(error) {
    console.error('转换失败:', error);

    let errorText = error.message || '未知错误';

    // 友好化错误信息
    if (errorText.includes('fetch')) {
        errorText = '网络连接失败，请检查您的网络连接';
    } else if (errorText.includes('CORS')) {
        errorText = '跨域访问被阻止，请联系管理员配置 CORS';
    } else if (errorText.includes('timeout')) {
        errorText = '处理超时，请稍后重试';
    }

    elements.errorMessage.textContent = errorText;
    showState('error');
}

/**
 * 显示成功结果
 */
function showResult(imageUrl) {
    elements.resultImage.src = imageUrl;
    elements.resultImage.onload = () => {
        showState('result');
    };

    elements.resultImage.onerror = () => {
        showError(new Error('生成的图片加载失败，请重试'));
    };
}

/**
 * 主转换函数
 */
async function handleConvert() {
    try {
        // 验证输入
        const { imageUrl, prompt } = validateInputs();

        // 更新UI状态
        setButtonState(true);
        showState('loading');

        // 调用API
        const result = await convertImage(imageUrl, prompt);

        // 处理结果
        if (result.success) {
            showResult(result.imageUrl);
        } else {
            throw new Error(result.error || '转换失败');
        }

    } catch (error) {
        showError(error);
    } finally {
        // 恢复按钮状态
        setButtonState(false);
    }
}

/**
 * 下载图片
 */
function downloadImage() {
    const imageUrl = elements.resultImage.src;
    if (!imageUrl) return;

    // 创建临时下载链接
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `anime-avatar-${Date.now()}.jpg`;
    link.target = '_blank';

    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 重新开始转换
 */
function resetToInitialState() {
    showState('');
    elements.imageUrlInput.focus();
}

/**
 * 重试转换
 */
function retryConvert() {
    handleConvert();
}

/**
 * 初始化事件监听器
 */
function initEventListeners() {
    // 转换按钮
    elements.convertButton.addEventListener('click', handleConvert);

    // 回车键触发转换
    elements.imageUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleConvert();
    });

    elements.promptInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleConvert();
    });

    // 结果操作按钮
    elements.downloadButton.addEventListener('click', downloadImage);
    elements.newTaskButton.addEventListener('click', resetToInitialState);
    elements.retryButton.addEventListener('click', retryConvert);
}

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('动漫头像生成器 V1.0 已加载');

    // 检查配置
    if (CONFIG.PROXY_API_URL.includes('your-project-name.vercel.app')) {
        console.warn('⚠️ 请在 script.js 中配置正确的 Vercel 部署地址');
        showError(new Error('系统配置错误：请联系管理员配置代理服务器地址'));
        return;
    }

    // 初始化事件监听器
    initEventListeners();

    // 聚焦到第一个输入框
    elements.imageUrlInput.focus();

    console.log('✅ 初始化完成，ready to rock!');
}); 