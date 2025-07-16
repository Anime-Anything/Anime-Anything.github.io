/**
 * AI动漫风格迁移工具 - 现代化主页逻辑
 * 包含页面加载动画、导航、多页面管理和图片转换功能
 */

// 配置信息
const CONFIG = {
    PROXY_API_URL: 'http://localhost:3000/api/convert',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp']
};

// DOM 元素
const elements = {
    // 页面加载和导航
    pageLoader: document.getElementById('pageLoader'),
    navbar: document.getElementById('navbar'),
    navToggle: document.getElementById('navToggle'),
    navMenu: document.getElementById('navMenu'),
    navLinks: document.querySelectorAll('.nav-link'),

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
    functionTypeInputs: document.querySelectorAll('input[name="functionType"]'),
    outputNumSelect: document.getElementById('outputNum'),
    convertButton: document.getElementById('convertButton'),

    // 结果显示
    loadingDiv: document.getElementById('loadingDiv'),
    resultDiv: document.getElementById('resultDiv'),
    errorDiv: document.getElementById('errorDiv'),
    resultImage: document.getElementById('resultImage'),
    errorMessage: document.getElementById('errorMessage'),
    downloadBtn: document.getElementById('downloadBtn'),
    reconvertBtn: document.getElementById('reconvertBtn'),

    // 轮播相关元素
    carouselTrack: document.getElementById('carouselTrack'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    carouselIndicators: document.getElementById('carouselIndicators'),
    currentImageIndex: document.getElementById('currentImageIndex'),
    totalImages: document.getElementById('totalImages')
};

// 全局变量
let uploadedImageUrl = null;
let currentSection = 'home';
let currentImageUrls = []; // 存储当前生成的所有图片URL
let currentImageIndex = 0; // 当前显示的图片索引

/**
 * 页面初始化和加载管理
 */

/**
 * 页面加载完成处理
 */
function handlePageLoad() {
    // 隐藏加载动画
    setTimeout(() => {
        if (elements.pageLoader) {
            elements.pageLoader.classList.add('loaded');
        }
    }, 1000);

    // 检查配置
    if (CONFIG.PROXY_API_URL.includes('your-project-name.vercel.app')) {
        console.warn('⚠️ 请在 script.js 中配置正确的 Vercel 部署地址');
        showError(new Error('系统配置错误：请联系管理员配置代理服务器地址'));
        return;
    }

    // 初始化各种功能
    initializeNavigation();
    initializeScrollEffects();
    initializeFileUpload();
    initializeConversion();

    // 设置默认输入模式为上传
    switchInputMode('upload');

    console.log('✅ AI动漫风格迁移工具已加载完成！');
}

/**
 * 导航功能管理
 */

/**
 * 初始化导航功能
 */
function initializeNavigation() {
    // 导航链接点击事件
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
            updateActiveNavLink(link);

            // 移动端关闭菜单
            if (elements.navMenu) {
                elements.navMenu.classList.remove('active');
            }
        });
    });

    // 移动端菜单切换
    if (elements.navToggle) {
        elements.navToggle.addEventListener('click', () => {
            if (elements.navMenu) {
                elements.navMenu.classList.toggle('active');
            }
        });
    }

    // 点击页面其他地方关闭移动端菜单
    document.addEventListener('click', (e) => {
        if (elements.navMenu &&
            !elements.navMenu.contains(e.target) &&
            !elements.navToggle.contains(e.target)) {
            elements.navMenu.classList.remove('active');
        }
    });
}

/**
 * 显示指定区域
 */
function showSection(sectionName) {
    // 隐藏所有区域
    const sections = document.querySelectorAll('.main-content section');
    sections.forEach(section => {
        section.classList.remove('active-section');
    });

    // 显示指定区域
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active-section');
        currentSection = sectionName;

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 添加进入动画
        addSectionAnimation(targetSection);
    }
}

/**
 * 更新导航链接活动状态
 */
function updateActiveNavLink(activeLink) {
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

/**
 * 添加区域动画
 */
function addSectionAnimation(section) {
    // 获取区域内的所有可动画元素
    const animateElements = section.querySelectorAll(
        '.feature-card, .gallery-item, .app-container, .section-header'
    );

    // 重置动画
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';

        // 依次显示元素
        setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * 滚动效果管理
 */

/**
 * 初始化滚动效果
 */
function initializeScrollEffects() {
    // 导航栏滚动效果
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // 导航栏透明度变化
        if (elements.navbar) {
            if (currentScrollY > 100) {
                elements.navbar.classList.add('scrolled');
            } else {
                elements.navbar.classList.remove('scrolled');
            }
        }

        // 滚动方向检测（可用于隐藏/显示导航栏）
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            // 向下滚动
            if (elements.navbar) {
                elements.navbar.style.transform = 'translateY(-100%)';
            }
        } else {
            // 向上滚动
            if (elements.navbar) {
                elements.navbar.style.transform = 'translateY(0)';
            }
        }

        lastScrollY = currentScrollY;
    });

    // 滚动进入视野动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // 观察所有需要动画的元素
    const observeElements = document.querySelectorAll(
        '.feature-card, .gallery-item, .section-header'
    );

    observeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(el);
    });
}

/**
 * 文件上传功能
 */

/**
 * 初始化文件上传功能
 */
function initializeFileUpload() {
    // 输入模式切换
    if (elements.uploadModeBtn) {
        elements.uploadModeBtn.addEventListener('click', () => switchInputMode('upload'));
    }
    if (elements.urlModeBtn) {
        elements.urlModeBtn.addEventListener('click', () => switchInputMode('url'));
    }

    // 文件上传相关事件
    if (elements.fileSelectBtn) {
        elements.fileSelectBtn.addEventListener('click', () => elements.fileInput?.click());
    }
    if (elements.fileInput) {
        elements.fileInput.addEventListener('change', handleFileSelect);
    }

    // 拖拽事件
    if (elements.dropZone) {
        elements.dropZone.addEventListener('dragenter', handleDragEnter);
        elements.dropZone.addEventListener('dragover', handleDragOver);
        elements.dropZone.addEventListener('dragleave', handleDragLeave);
        elements.dropZone.addEventListener('drop', handleDrop);
    }

    // 更换图片按钮
    if (elements.changeImageBtn) {
        elements.changeImageBtn.addEventListener('click', () => elements.fileInput?.click());
    }
}

/**
 * 切换输入模式
 */
function switchInputMode(mode) {
    // 更新按钮状态
    if (elements.uploadModeBtn && elements.urlModeBtn) {
        elements.uploadModeBtn.classList.toggle('active', mode === 'upload');
        elements.urlModeBtn.classList.toggle('active', mode === 'url');
    }

    // 切换显示的输入区域
    if (elements.uploadMode && elements.urlMode) {
        elements.uploadMode.classList.toggle('active', mode === 'upload');
        elements.urlMode.classList.toggle('active', mode === 'url');
    }

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
    if (elements.dropZone) {
        elements.dropZone.classList.add('dragover');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (elements.dropZone && !elements.dropZone.contains(e.relatedTarget)) {
        elements.dropZone.classList.remove('dragover');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (elements.dropZone) {
        elements.dropZone.classList.remove('dragover');
    }

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
        // 检查文件的尺寸
        validateImageFile(file);

        // 调整图片尺寸以符合 API 要求
        const resizedFile = await resizeImageForAPI(file);

        // 显示预览
        await showImagePreview(resizedFile);

        // 上传到图床
        await uploadImageToHost(resizedFile);

        // 不再自动转换，让用户手动点击按钮

    } catch (error) {
        showUploadError(error.message);
    }
}

/**
 * 调整图片尺寸以符合 API 要求 (宽度和高度都需要在 512-4096px 之间)
 */
async function resizeImageForAPI(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = function() {
            let { width, height } = img;

            // 检查是否需要调整尺寸
            if (width >= 512 && width <= 4096 && height >= 512 && height <= 4096) {
                // 尺寸符合要求，直接返回原文件
                console.log(`图片尺寸符合要求: ${width}x${height}`);
                resolve(file);
                return;
            }

            // 计算缩放比例，确保宽度和高度都在有效范围内
            let scaleWidth = 1;
            let scaleHeight = 1;

            // 计算宽度缩放比例
            if (width < 512) {
                scaleWidth = 512 / width;
            } else if (width > 4096) {
                scaleWidth = 4096 / width;
            }

            // 计算高度缩放比例
            if (height < 512) {
                scaleHeight = 512 / height;
            } else if (height > 4096) {
                scaleHeight = 4096 / height;
            }

            // 选择较大的缩放比例，确保两个维度都符合要求
            const scale = Math.max(scaleWidth, scaleHeight);

            // 计算新尺寸
            let newWidth = Math.round(width * scale);
            let newHeight = Math.round(height * scale);

            // 如果缩放后仍然超出范围，进行二次调整
            if (newWidth > 4096) {
                const adjustScale = 4096 / newWidth;
                newWidth = 4096;
                newHeight = Math.round(newHeight * adjustScale);
            }
            if (newHeight > 4096) {
                const adjustScale = 4096 / newHeight;
                newHeight = 4096;
                newWidth = Math.round(newWidth * adjustScale);
            }

            // 设置画布尺寸
            canvas.width = newWidth;
            canvas.height = newHeight;

            // 绘制调整后的图片
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // 转换为 Blob，使用更高的压缩率减少文件大小
            canvas.toBlob((blob) => {
                if (blob) {
                    // 创建新的 File 对象
                    const resizedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    console.log(`✅ 图片尺寸已调整: ${width}x${height} → ${newWidth}x${newHeight}`);
                    console.log(`📦 文件大小: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
                    console.log(`🎯 缩放比例: ${scale.toFixed(3)}`);
                    resolve(resizedFile);
                } else {
                    reject(new Error('图片处理失败'));
                }
            }, file.type, 0.7); // 降低质量到 0.7 以减少文件大小
        };

        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = URL.createObjectURL(file);
    });
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
            if (elements.previewImage && elements.imagePreview && elements.imageInfo) {
                elements.previewImage.src = e.target.result;
                elements.imagePreview.classList.remove('hidden');

                // 显示文件信息
                const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
                elements.imageInfo.textContent = `${file.name} (${sizeInMB}MB)`;

                // 添加预览动画
                elements.imagePreview.style.opacity = '0';
                elements.imagePreview.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    elements.imagePreview.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    elements.imagePreview.style.opacity = '1';
                    elements.imagePreview.style.transform = 'translateY(0)';
                }, 100);
            }
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
 */
async function uploadToImageHost(base64Data) {
    // 简化方案：直接使用data URL
    return `data:image/jpeg;base64,${base64Data}`;
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
    if (elements.imagePreview) {
        elements.imagePreview.classList.add('hidden');
    }
    if (elements.previewImage) {
        elements.previewImage.src = '';
    }
    if (elements.imageInfo) {
        elements.imageInfo.textContent = '';
    }
    uploadedImageUrl = null;
    if (elements.fileInput) {
        elements.fileInput.value = '';
    }
}

/**
 * 图像转换功能
 */

/**
 * 初始化转换功能
 */
function initializeConversion() {
    // 转换按钮事件监听
    if (elements.convertButton) {
        elements.convertButton.addEventListener('click', handleConvert);
    }

    // 下载按钮事件监听
    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', downloadImage);
    }

    // 重新转换按钮事件监听
    if (elements.reconvertBtn) {
        elements.reconvertBtn.addEventListener('click', reconvertCurrentImage);
    }
}

/**
 * 验证输入参数
 */
function validateInputs() {
    let imageUrl = '';
    let prompt = elements.promptInput?.value.trim() || '';

    // 检查图片来源
    if (elements.uploadMode?.classList.contains('active')) {
        // 上传模式
        if (!uploadedImageUrl) {
            throw new Error('请先上传图片');
        }
        imageUrl = uploadedImageUrl;
    } else {
        // URL模式
        imageUrl = elements.imageUrlInput?.value.trim() || '';
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
 * 调用代理 API 进行图像转换FLAG
 */
async function convertImage(imageUrl, prompt, functionType, outputNum) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3分钟超时，适合多图片生成

    try {
        console.log('开始调用代理 API...', { imageUrl, prompt, functionType, outputNum });

        const response = await fetch(CONFIG.PROXY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageUrl: imageUrl,
                prompt: prompt,
                functionType: functionType,
                outputNum: outputNum
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
    if (!elements.convertButton) return;

    if (isLoading) {
        // 加载时隐藏按钮，避免视觉冲突
        elements.convertButton.classList.add('hidden');
    } else {
        // 恢复按钮到初始状态
        elements.convertButton.disabled = false;
        elements.convertButton.innerHTML = '<span class="btn-text">🚀 开始风格迁移</span>';
        elements.convertButton.classList.remove('hidden');
    }
}

/**
 * 显示状态
 */
function showState(state) {
    // 隐藏所有状态
    [elements.loadingDiv, elements.resultDiv, elements.errorDiv].forEach(el => {
        if (el) el.classList.add('hidden');
    });

    // 显示对应状态
    let targetElement = null;
    switch (state) {
        case 'loading':
            targetElement = elements.loadingDiv;
            break;
        case 'result':
            targetElement = elements.resultDiv;
            break;
        case 'error':
            targetElement = elements.errorDiv;
            break;
    }

    if (targetElement) {
        targetElement.classList.remove('hidden');
        // 平滑滚动到目标区域
        setTimeout(() => {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
    }
}

/**
 * 显示结果 - 支持多图片轮播
 */
function showResult(imageUrls) {
    // 确保imageUrls是数组
    if (typeof imageUrls === 'string') {
        imageUrls = [imageUrls];
    }

    currentImageUrls = imageUrls;
    currentImageIndex = 0;

    // 初始化轮播图
    initCarousel();

    showState('result');

    // 滚动到结果区域
    if (elements.resultDiv) {
        elements.resultDiv.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * 初始化轮播图
 */
function initCarousel() {
    if (!currentImageUrls || currentImageUrls.length === 0) return;

    // 清空轮播轨道
    if (elements.carouselTrack) {
        elements.carouselTrack.innerHTML = '';
    }

    // 创建图片幻灯片
    currentImageUrls.forEach((url, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `<img src="${url}" alt="生成的图片 ${index + 1}" loading="lazy">`;
        elements.carouselTrack.appendChild(slide);
    });

    // 更新计数器
    updateImageCounter();

    // 创建指示器
    createIndicators();

    // 更新按钮状态
    updateCarouselButtons();

    // 显示第一张图片
    showSlide(0);

    // 绑定事件监听器
    bindCarouselEvents();
}

/**
 * 更新图片计数器
 */
function updateImageCounter() {
    if (elements.currentImageIndex) {
        elements.currentImageIndex.textContent = currentImageIndex + 1;
    }
    if (elements.totalImages) {
        elements.totalImages.textContent = currentImageUrls.length;
    }
}

/**
 * 创建指示器
 */
function createIndicators() {
    if (!elements.carouselIndicators) return;

    elements.carouselIndicators.innerHTML = '';

    if (currentImageUrls.length <= 1) {
        elements.carouselIndicators.classList.add('hidden');
        return;
    }

    elements.carouselIndicators.classList.remove('hidden');

    currentImageUrls.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = 'carousel-indicator';
        if (index === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => showSlide(index));
        elements.carouselIndicators.appendChild(indicator);
    });
}

/**
 * 更新轮播按钮状态
 */
function updateCarouselButtons() {
    if (currentImageUrls.length <= 1) {
        elements.prevBtn?.classList.add('hidden');
        elements.nextBtn?.classList.add('hidden');
    } else {
        elements.prevBtn?.classList.remove('hidden');
        elements.nextBtn?.classList.remove('hidden');
    }
}

/**
 * 显示指定索引的幻灯片
 */
function showSlide(index) {
    if (!elements.carouselTrack || !currentImageUrls.length) return;

    // 确保索引在有效范围内
    index = Math.max(0, Math.min(index, currentImageUrls.length - 1));
    currentImageIndex = index;

    // 移动轮播轨道
    const translateX = -index * 100;
    elements.carouselTrack.style.transform = `translateX(${translateX}%)`;

    // 更新指示器
    const indicators = elements.carouselIndicators?.querySelectorAll('.carousel-indicator');
    indicators?.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });

    // 更新计数器
    updateImageCounter();
}

/**
 * 绑定轮播事件监听器
 */
function bindCarouselEvents() {
    // 上一张按钮
    elements.prevBtn?.addEventListener('click', () => {
        showSlide(currentImageIndex - 1);
    });

    // 下一张按钮
    elements.nextBtn?.addEventListener('click', () => {
        showSlide(currentImageIndex + 1);
    });

    // 键盘导航
    document.addEventListener('keydown', (e) => {
        if (elements.resultDiv && !elements.resultDiv.classList.contains('hidden')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                showSlide(currentImageIndex - 1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                showSlide(currentImageIndex + 1);
            }
        }
    });
}

/**
 * 显示错误
 */
function showError(error) {
    if (elements.errorMessage) {
        elements.errorMessage.textContent = error.message;
    }
    showState('error');

    // 滚动到错误区域
    if (elements.errorDiv) {
        elements.errorDiv.scrollIntoView({ behavior: 'smooth' });
    }
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

        // 获取功能类型和生成数量
        const selectedFunctionType = document.querySelector('input[name="functionType"]:checked').value;
        const outputNum = parseInt(elements.outputNumSelect.value);

        // 更新UI状态
        setButtonState(true);
        showState('loading');

        // 调用API
        const result = await convertImage(imageUrl, prompt, selectedFunctionType, outputNum);

        // 处理结果
        if (result.success) {
            // 优先使用imageUrls，如果不存在则使用imageUrl
            const imageUrls = result.imageUrls || [result.imageUrl];
            showResult(imageUrls);
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
 * 下载当前显示的图片
 */
function downloadImage() {
    if (!currentImageUrls.length || currentImageIndex < 0 || currentImageIndex >= currentImageUrls.length) {
        console.error('没有可下载的图片');
        return;
    }

    const imageUrl = currentImageUrls[currentImageIndex];
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `anime-avatar-${currentImageIndex + 1}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 重新转换当前图片
 */
function reconvertCurrentImage() {
    // 重新开始转换流程
    location.reload();
}

/**
 * 全局函数 - 供HTML调用
 */
window.showSection = showSection;

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI动漫风格迁移工具开始加载...');
    handlePageLoad();
});

// 页面完全加载后隐藏加载动画
window.addEventListener('load', () => {
    setTimeout(() => {
        if (elements.pageLoader) {
            elements.pageLoader.classList.add('loaded');
        }
    }, 500);
}); 