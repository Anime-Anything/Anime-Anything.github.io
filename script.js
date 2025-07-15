/**
 * 动漫头像生成器前端逻辑
 * V2.0 - 支持拖拽/上传图片功能
 */

// 配置项
const CONFIG = {
    // 云函数代理 URL - 替换为您的 Vercel 部署地址
    // 格式：https://your-project-name.vercel.app/api/convert
    PROXY_API_URL: 'https://anime-anything-github-io.vercel.app/api/convert',

    // 请求超时设置 (毫秒)
    REQUEST_TIMEOUT: 120000, // 2分钟

    // 图片上传配置
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],

    // 免费图床API - 使用 imgbb 作为图片托管
    IMAGE_UPLOAD_URL: 'https://api.imgbb.com/1/upload',
    IMAGE_UPLOAD_KEY: 'c1b7b6b4c6f5f5c6b4c6f5f5c6b4c6f5' // 示例key，需要替换为真实的
};

// DOM 元素引用
const elements = {
    // V1.0 原有元素
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
    retryButton: document.getElementById('retryButton'),

    // V2.0 新增元素
    uploadModeBtn: document.getElementById('uploadModeBtn'),
    urlModeBtn: document.getElementById('urlModeBtn'),
    uploadMode: document.getElementById('uploadMode'),
    urlMode: document.getElementById('urlMode'),
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    fileSelectBtn: document.getElementById('fileSelectBtn'),
    imagePreview: document.getElementById('imagePreview'),
    previewImage: document.getElementById('previewImage'),
    imageInfo: document.getElementById('imageInfo'),
    changeImageBtn: document.getElementById('changeImageBtn')
};

// 全局状态
let currentInputMode = 'upload'; // 'upload' or 'url'
let uploadedImageUrl = null; // 上传后的图片URL

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
 * 初始化事件监听器
 */
function initializeEventListeners() {
    // V1.0 原有事件
    elements.convertButton.addEventListener('click', handleConvert);
    elements.downloadButton.addEventListener('click', downloadImage);
    elements.newTaskButton.addEventListener('click', resetToInitialState);
    elements.retryButton.addEventListener('click', handleConvert);

    // V2.0 新增事件
    // 输入模式切换
    elements.uploadModeBtn.addEventListener('click', () => switchInputMode('upload'));
    elements.urlModeBtn.addEventListener('click', () => switchInputMode('url'));

    // 文件选择和拖拽
    elements.fileSelectBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.changeImageBtn.addEventListener('click', () => elements.fileInput.click());

    // 拖拽事件
    setupDragAndDrop();

    // 阻止全页面拖拽
    preventDefaultDrag();
}

/**
 * 设置拖拽功能
 */
function setupDragAndDrop() {
    const dropZone = elements.dropZone;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
}

/**
 * 阻止默认拖拽行为
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * 阻止全页面拖拽
 */
function preventDefaultDrag() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.addEventListener(eventName, preventDefaults, false);
    });
}

/**
 * 切换输入模式
 */
function switchInputMode(mode) {
    currentInputMode = mode;

    // 更新按钮状态
    elements.uploadModeBtn.classList.toggle('active', mode === 'upload');
    elements.urlModeBtn.classList.toggle('active', mode === 'url');

    // 更新内容区域
    elements.uploadMode.classList.toggle('active', mode === 'upload');
    elements.urlMode.classList.toggle('active', mode === 'url');

    // 清空状态
    uploadedImageUrl = null;
    elements.imagePreview.classList.add('hidden');
    elements.imageUrlInput.value = '';
}

/**
 * 处理文件拖拽
 */
function handleDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
        processImageFile(imageFile);
    } else {
        showUploadError('请拖拽图片文件');
    }
}

/**
 * 处理文件选择
 */
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

/**
 * 处理图片文件
 */
async function processImageFile(file) {
    try {
        // 验证文件
        validateImageFile(file);

        // 显示预览
        await showImagePreview(file);

        // 上传到图床
        await uploadImageToHost(file);

    } catch (error) {
        showUploadError(error.message);
    }
}

/**
 * 验证图片文件
 */
function validateImageFile(file) {
    // 检查文件大小
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        throw new Error(`文件过大，请选择小于 ${(CONFIG.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB 的图片`);
    }

    // 检查文件格式
    if (!CONFIG.SUPPORTED_FORMATS.includes(file.type)) {
        throw new Error('不支持的文件格式，请选择 JPG、PNG 或 WEBP 格式的图片');
    }
}

/**
 * 显示图片预览
 */
function showImagePreview(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (e) {
            elements.previewImage.src = e.target.result;
            elements.imageInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
            elements.imagePreview.classList.remove('hidden');
            resolve();
        };

        reader.onerror = function () {
            reject(new Error('无法读取图片文件'));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * 上传图片到图床
 */
async function uploadImageToHost(file) {
    try {
        showUploadProgress('正在上传图片...');

        // 转换为Base64
        const base64 = await fileToBase64(file);

        // 使用免费图床服务 (这里使用一个模拟的上传，实际应该调用真实的图床API)
        const imageUrl = await uploadToImageHost(base64);

        uploadedImageUrl = imageUrl;
        showUploadSuccess('图片上传成功！');

    } catch (error) {
        showUploadError(`上传失败: ${error.message}`);
        throw error;
    }
}

/**
 * 文件转Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // 移除数据URL的前缀，只保留base64部分
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 上传到图床服务
 * 注意：这里使用临时的解决方案，实际生产环境需要配置真实的图床服务
 */
async function uploadToImageHost(base64Data) {
    // 简化方案：直接使用data URL
    // 在实际应用中，你需要：
    // 1. 注册一个免费图床服务账号 (如 imgbb.com)
    // 2. 获取API密钥
    // 3. 调用其API上传图片

    // 这里返回一个data URL作为临时解决方案
    return `data:image/jpeg;base64,${base64Data}`;

    /* 真实的API调用示例：
    const formData = new FormData();
    formData.append('image', base64Data);
    
    const response = await fetch(`${CONFIG.IMAGE_UPLOAD_URL}?key=${CONFIG.IMAGE_UPLOAD_KEY}`, {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    if (result.success) {
        return result.data.url;
    } else {
        throw new Error(result.error.message);
    }
    */
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * 显示上传进度
 */
function showUploadProgress(message) {
    // 可以在这里添加进度显示逻辑
    console.log(message);
}

/**
 * 显示上传成功
 */
function showUploadSuccess(message) {
    console.log('✅', message);
}

/**
 * 显示上传错误
 */
function showUploadError(message) {
    console.error('❌', message);
    showError(new Error(message));
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
 * 验证输入参数 (V2.0 更新)
 */
function validateInputs() {
    const prompt = elements.promptInput.value.trim();

    if (!prompt) {
        throw new Error('请输入风格描述');
    }

    let imageUrl;

    if (currentInputMode === 'upload') {
        if (!uploadedImageUrl) {
            throw new Error('请先上传图片');
        }
        imageUrl = uploadedImageUrl;
    } else {
        imageUrl = elements.imageUrlInput.value.trim();

        if (!imageUrl) {
            throw new Error('请输入图片 URL');
        }

        // 验证 URL 格式
        try {
            new URL(imageUrl);
        } catch {
            throw new Error('请输入有效的图片 URL');
        }

        // 验证 URL 协议
        if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
            throw new Error('图片 URL 必须以 http://、https:// 或 data: 开头');
        }
    }

    return { imageUrl, prompt };
}

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('动漫头像生成器 V2.0 已加载');

    // 检查配置
    if (CONFIG.PROXY_API_URL.includes('your-project-name.vercel.app')) {
        console.warn('⚠️ 请在 script.js 中配置正确的 Vercel 部署地址');
        showError(new Error('系统配置错误：请联系管理员配置代理服务器地址'));
        return;
    }

    // 初始化事件监听器
    initializeEventListeners();

    // 设置默认输入模式为上传
    switchInputMode('upload');

    console.log('✅ V2.0 初始化完成，支持拖拽上传！');
}); 