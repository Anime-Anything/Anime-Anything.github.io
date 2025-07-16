/**
 * AI动漫风格迁移工具 - 现代化主页逻辑
 * 包含页面加载动画、导航、多页面管理和图片转换功能
 */

// 3D画廊配置
const GALLERY_CONFIG = {
    images: [
        'images/000.jpg',
        'images/001.jpg',
        'images/002.jpg',
        'images/003.jpg',
        'images/004.png',
        'images/005.png',
        'images/006.png',
        'images/007.png',
        'images/008.jpg',
        'images/009.jpg'
    ],
    rotationStep: -36, // 每张图片-36度间隔，完全对应原始设计 (360/10 = 36)
    transformOrigin: '50% 50% 500px', // 旋转中心在图片前方500px处
    zDepth: -500 // 所有图片在相同深度
};

// 画廊状态
let galleryState = {
    xPos: 0,
    isDragging: false,
    autoRotation: null // 存储自动旋转动画
};

// 配置信息
const CONFIG = {
    PROXY_API_URL: 'https://anime-anything-github-io.vercel.app/api/convert',
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
let currentSection = 'home';

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
        // 验证文件
        validateImageFile(file);

        // 显示预览
        await showImagePreview(file);

        // 上传到图床
        await uploadImageToHost(file);

        // 不再自动转换，让用户手动点击按钮

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
 * 显示结果
 */
function showResult(imageUrl) {
    if (elements.resultImage) {
        elements.resultImage.src = imageUrl;
    }
    showState('result');

    // 滚动到结果区域
    if (elements.resultDiv) {
        elements.resultDiv.scrollIntoView({ behavior: 'smooth' });
    }
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
    if (!elements.resultImage?.src) return;

    const imageUrl = elements.resultImage.src;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `anime-avatar-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 3D画廊功能 - 使用GSAP实现
 */

// 初始化3D画廊
function initGallery() {
    const galleryRing = document.querySelector('.gallery-ring');
    const galleryImages = document.querySelectorAll('.gallery-img');
    
    if (!galleryRing || galleryImages.length === 0) return;
    
    console.log('初始化3D画廊...', GALLERY_CONFIG.images.length, '张图片');

    // 使用GSAP设置初始状态和图片
    gsap.timeline()
        .set('.gallery-ring', { 
            rotationY: 180, // 恢复原始设计的初始角度
            cursor: 'grab' 
        })
        .set('.gallery-img', {
            rotateY: (i) => {
                const rotation = i * -36; // 直接使用-36度，完全对应原始设计
                console.log(`设置图片 ${i}: rotateY = ${rotation}度`);
                return rotation;
            },
            transformOrigin: GALLERY_CONFIG.transformOrigin, // 所有图片使用相同的transformOrigin
            z: GALLERY_CONFIG.zDepth,
            backgroundImage: (i) => {
                const imageUrl = 'url(' + GALLERY_CONFIG.images[i] + ')';
                console.log(`设置图片 ${i}: ${imageUrl}`);
                return imageUrl;
            },
            backgroundSize: 'cover',
            backgroundPosition: (i) => getBgPos(i),
            backgroundRepeat: 'no-repeat',
            backfaceVisibility: 'hidden'
        })
        .from('.gallery-img', {
            duration: 2,
            y: 300,
            opacity: 0,
            rotationX: 90,
            stagger: 0.15,
            ease: 'back.out(1.7)'
        })
        .add(() => {
            // 添加增强的悬停效果
            galleryImages.forEach((img, index) => {
                img.addEventListener('mouseenter', (e) => {
                    let current = e.currentTarget;
                    
                    // 突出当前图片
                    gsap.to(current, { 
                        scale: 1.1, 
                        z: GALLERY_CONFIG.zDepth - 80,
                        boxShadow: '0 30px 60px rgba(255, 255, 255, 0.3)',
                        duration: 0.5,
                        ease: 'power3.out'
                    });
                    
                    // 其他图片变暗和缩小
                    gsap.to('.gallery-img', { 
                        opacity: (i, t) => (t === current) ? 1 : 0.4, 
                        scale: (i, t) => (t === current) ? 1.1 : 0.95,
                        ease: 'power3.out',
                        duration: 0.5
                    });
                });

                img.addEventListener('mouseleave', () => {
                    // 恢复所有图片状态
                    gsap.to('.gallery-img', { 
                        opacity: 1, 
                        scale: 1,
                        z: GALLERY_CONFIG.zDepth,
                        boxShadow: '0 20px 40px rgba(255, 255, 255, 0.1)',
                        ease: 'power3.out',
                        duration: 0.5
                    });
                });
            });
        }, '-=0.5');

    // 设置拖拽事件
    setupGalleryDragEvents();
}

// 设置画廊拖拽事件
function setupGalleryDragEvents() {
    document.addEventListener('mousedown', dragStart);
    document.addEventListener('touchstart', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
}

// 开始拖拽
function dragStart(e) {
    // 检查是否点击在画廊区域
    if (!e.target.closest('.gallery-container')) return;
    
    if (e.touches) e.clientX = e.touches[0].clientX;
    galleryState.xPos = Math.round(e.clientX);
    galleryState.isDragging = true;
    
    gsap.set('.gallery-ring', { cursor: 'grabbing' });
    
    // 停止自动旋转
    if (galleryState.autoRotation) {
        galleryState.autoRotation.pause();
    }
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
}

// 拖拽中
function drag(e) {
    if (e.touches) e.clientX = e.touches[0].clientX;
    
    const ring = document.querySelector('.gallery-ring');
    if (!ring) return;
    
    // 参考原始设计的拖拽计算
    gsap.to('.gallery-ring', {
        rotationY: '-=' + ((Math.round(e.clientX) - galleryState.xPos) % 360),
        onUpdate: () => { 
            // 更新背景位置的视差效果
            gsap.set('.gallery-img', { 
                backgroundPosition: (i) => getBgPos(i)
            });
        }
    });

    galleryState.xPos = Math.round(e.clientX);
}

// 结束拖拽
function dragEnd() {
    galleryState.isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    gsap.set('.gallery-ring', { cursor: 'grab' });
    
    // 延迟恢复自动旋转
    setTimeout(() => {
        if (galleryState.autoRotation && !galleryState.isDragging) {
            galleryState.autoRotation.resume();
        }
    }, 3000); // 3秒后恢复自动旋转
}

// 计算背景位置实现视差效果（完全参考原始设计）
function getBgPos(i) {
    const ring = document.querySelector('.gallery-ring');
    if (!ring) return '0px 0px';
    
    const currentRotation = gsap.getProperty(ring, 'rotationY') || 0;
    // 完全复制原始设计的计算公式：rotationY - 180 - i * 36
    const offset = gsap.utils.wrap(0, 360, currentRotation - 180 - i * 36) / 360 * 500;
    return (100 - offset) + 'px 0px';
}

// 画廊入场动画
function animateGalleryEntrance() {
    const galleryInfo = document.querySelector('.gallery-info');
    
    if (galleryInfo) {
        gsap.fromTo(galleryInfo, 
            { 
                opacity: 0, 
                y: 50 
            },
            { 
                opacity: 1, 
                y: 0, 
                duration: 1.5, 
                delay: 2.5,
                ease: 'power3.out' 
            }
        );
    }
    
    // 启动微妙的自动旋转（可选）
    setTimeout(() => {
        addBreathingAnimation();
    }, 4000);
}

// 添加微妙的呼吸动画和自动旋转
function addBreathingAnimation() {
    // 非常缓慢的自动旋转
    galleryState.autoRotation = gsap.to('.gallery-ring', {
        duration: 120, // 2分钟一圈
        rotationY: '+=360',
        ease: 'none',
        repeat: -1
    });
    
    // 微妙的上下浮动
    gsap.to('.gallery-container', {
        duration: 8,
        y: '+=15',
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1
    });
    
    // 光晕脉冲同步
    gsap.to('.gallery-container::before', {
        duration: 6,
        opacity: 0.3,
        scale: 1.1,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: -1
    });
}

/**
 * 全局函数 - 供HTML调用
 */
window.showSection = showSection;

/**
 * 页面加载完成后初始化
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('AI艺术画廊开始加载...');
    handlePageLoad();
    
    // 等待GSAP加载完成后初始化3D画廊
    if (typeof gsap !== 'undefined') {
        setTimeout(() => {
            initGallery();
            animateGalleryEntrance();
        }, 1000); // 页面加载动画后初始化画廊
    } else {
        console.error('GSAP库未加载，3D画廊无法初始化');
    }
});

// 页面完全加载后隐藏加载动画
window.addEventListener('load', () => {
    setTimeout(() => {
        if (elements.pageLoader) {
            elements.pageLoader.classList.add('loaded');
        }
    }, 500);
}); 