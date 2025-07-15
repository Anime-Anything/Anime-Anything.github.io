/**
 * 动漫头像生成器 V2.0 - 主页逻辑
 * 包含图片上传、风格转换等功能
 */

// 配置信息
const CONFIG = {
    PROXY_API_URL: 'https://anime-anything-github-io.vercel.app/api/convert',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp']
};

// DOM 元素
const elements = {
    // 输入模式切换
    uploadModeBtn: document.getElementById('uploadModeBtn'),
    urlModeBtn: document.getElementById('urlModeBtn'),
    uploadMode: document.getElementById('uploadMode'),
    urlMode: document.getElementById('urlMode'),

    // 文件上传相关
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    fileSelectBtn: document.getElementById('fileSelectBtn'),
    changeImageBtn: document.getElementById('changeImageBtn'),
    imagePreview: document.getElementById('imagePreview'),
    previewImage: document.getElementById('previewImage'),
    imageInfo: document.getElementById('imageInfo'),

    // 输入字段
    imageUrlInput: document.getElementById('imageUrlInput'),
    promptInput: document.getElementById('promptInput'),
    convertButton: document.getElementById('convertButton'),

    // 结果显示
    loadingDiv: document.getElementById('loadingDiv'),
    resultDiv: document.getElementById('resultDiv'),
    errorDiv: document.getElementById('errorDiv'),
    resultImage: document.getElementById('resultImage'),
    errorMessage: document.getElementById('errorMessage'),
    downloadBtn: document.getElementById('downloadBtn')
};

// 全局变量
let uploadedImageUrl = null;

/**
 * 文件上传管理
 */

/**
 * 初始化事件监听器
 */
function initializeEventListeners() {
    // 输入模式切换
    elements.uploadModeBtn.addEventListener('click', () => switchInputMode('upload'));
    elements.urlModeBtn.addEventListener('click', () => switchInputMode('url'));

    // 文件上传相关事件
    elements.fileSelectBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);

    // 拖拽事件
    elements.dropZone.addEventListener('dragenter', handleDragEnter);
    elements.dropZone.addEventListener('dragover', handleDragOver);
    elements.dropZone.addEventListener('dragleave', handleDragLeave);
    elements.dropZone.addEventListener('drop', handleDrop);

    // 更换图片按钮
    if (elements.changeImageBtn) {
        elements.changeImageBtn.addEventListener('click', () => elements.fileInput.click());
    }

    // 转换按钮
    elements.convertButton.addEventListener('click', handleConvert);

    // 下载按钮
    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', downloadImage);
    }
}

/**
 * 切换输入模式
 */
function switchInputMode(mode) {
    // 更新按钮状态
    elements.uploadModeBtn.classList.toggle('active', mode === 'upload');
    elements.urlModeBtn.classList.toggle('active', mode === 'url');

    // 切换显示的输入区域
    elements.uploadMode.classList.toggle('active', mode === 'upload');
    elements.urlMode.classList.toggle('active', mode === 'url');

    // 清除之前的状态
    clearUploadState();
    clearMessages();
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
 * 拖拽事件处理
 */
function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.add('dragover');
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!elements.dropZone.contains(e.relatedTarget)) {
        elements.dropZone.classList.remove('dragover');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processImageFile(files[0]);
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
async function showImagePreview(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            elements.previewImage.src = e.target.result;
            elements.imagePreview.classList.remove('hidden');

            // 显示文件信息
            const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
            elements.imageInfo.textContent = `${file.name} (${sizeInMB}MB)`;

            resolve();
        };

        reader.onerror = () => {
            reject(new Error('文件读取失败'));
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
 * 上传状态显示
 */
function showUploadProgress(message) {
    console.log('上传进度:', message);
}

function showUploadSuccess(message) {
    console.log('上传成功:', message);
}

function showUploadError(message) {
    console.error('上传错误:', message);
    showError(new Error(message));
}

/**
 * 清除上传状态
 */
function clearUploadState() {
    elements.imagePreview.classList.add('hidden');
    elements.previewImage.src = '';
    elements.imageInfo.textContent = '';
    uploadedImageUrl = null;
    if (elements.fileInput) {
        elements.fileInput.value = '';
    }
}

/**
 * 图像转换功能
 */

/**
 * 验证输入参数
 */
function validateInputs() {
    let imageUrl = '';
    let prompt = elements.promptInput.value.trim();

    // 检查图片来源
    if (elements.uploadMode.classList.contains('active')) {
        // 上传模式
        if (!uploadedImageUrl) {
            throw new Error('请先上传图片');
        }
        imageUrl = uploadedImageUrl;
    } else {
        // URL模式
        imageUrl = elements.imageUrlInput.value.trim();
        if (!imageUrl) {
            throw new Error('请输入图片URL');
        }

        // 简单的URL验证
        try {
            new URL(imageUrl);
        } catch {
            throw new Error('请输入有效的图片URL');
        }
    }

    // 检查提示词
    if (!prompt) {
        throw new Error('请输入风格描述');
    }

    return { imageUrl, prompt };
}

/**
 * 调用代理 API 进行图像转换
 */
async function convertImage(imageUrl, prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2分钟超时

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
 * 设置按钮状态
 */
function setButtonState(isLoading) {
    elements.convertButton.disabled = isLoading;

    if (isLoading) {
        elements.convertButton.textContent = '⏳ 转换中...';
        elements.convertButton.classList.add('loading');
    } else {
        elements.convertButton.textContent = '🎨 开始转换';
        elements.convertButton.classList.remove('loading');
    }
}

/**
 * 显示状态
 */
function showState(state) {
    // 隐藏所有状态
    elements.loadingDiv.classList.add('hidden');
    elements.resultDiv.classList.add('hidden');
    elements.errorDiv.classList.add('hidden');

    // 显示对应状态
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
 * 显示结果
 */
function showResult(imageUrl) {
    elements.resultImage.src = imageUrl;
    showState('result');

    // 滚动到结果区域
    elements.resultDiv.scrollIntoView({ behavior: 'smooth' });
}

/**
 * 显示错误
 */
function showError(error) {
    elements.errorMessage.textContent = error.message;
    showState('error');

    // 滚动到错误区域
    elements.errorDiv.scrollIntoView({ behavior: 'smooth' });
}

/**
 * 清除消息
 */
function clearMessages() {
    showState('none');
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
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `anime-avatar-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('动漫风格迁移工具 V2.0 已加载');

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

    console.log('✅ V2.0 初始化完成！');
}); 