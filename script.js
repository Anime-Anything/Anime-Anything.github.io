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

// 新增：文生图API地址
const TXT2IMG_API_URL = 'https://anime-anything-github-io.vercel.app/api/text2img';

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

// DOM 元素补充
Object.assign(elements, {
    txt2imgModeBtn: document.getElementById('txt2imgModeBtn'),
    txt2imgMode: document.getElementById('txt2imgMode'),
    txt2imgPromptInput: document.getElementById('txt2imgPromptInput'),
    txt2imgButton: document.getElementById('txt2imgButton')
});

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
    initScrollAnimations(); // 初始化流线型滚动效果
    enhanceHighlightInteractions(); // 增强特色卡片交互

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
 * 显示指定区域并更新导航
 */
function showSection(targetSection) {
    console.log('切换到区域:', targetSection);

    // 隐藏所有区域
    document.querySelectorAll('.main-content section').forEach(section => {
        section.classList.remove('active-section');
    });

    // 显示目标区域
    const target = document.getElementById(targetSection);
    if (target) {
        target.classList.add('active-section');
        addSectionAnimation(target);
    }

    // 更新导航链接状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === targetSection) {
            link.classList.add('active');
        }
    });

    // 特殊处理：如果是画廊页面，确保轮播器已初始化
    if (targetSection === 'gallery') {
        // 延迟初始化，确保DOM元素已经显示
        setTimeout(() => {
            const carouselFrames = document.querySelectorAll('.carousel-frame');
            if (carouselFrames.length > 0 && carouselState.size === 0) {
                console.log('延迟初始化复古画廊轮播器...');
                initCarousels();
                addCarouselInteractions();
                animateVintageGalleryEntrance();
            }
        }, 100);
    }

    // 更新当前区域状态
    currentSection = targetSection;

    // 移动端导航菜单自动关闭
    if (elements.navMenu) {
        elements.navMenu.classList.remove('active');
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
    if (elements.txt2imgModeBtn) {
        elements.txt2imgModeBtn.addEventListener('click', () => switchInputMode('txt2img'));
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
    if (elements.uploadModeBtn && elements.urlModeBtn && elements.txt2imgModeBtn) {
        elements.uploadModeBtn.classList.toggle('active', mode === 'upload');
        elements.urlModeBtn.classList.toggle('active', mode === 'url');
        elements.txt2imgModeBtn.classList.toggle('active', mode === 'txt2img');
    }
    // 切换显示的输入区域
    if (elements.uploadMode && elements.urlMode && elements.txt2imgMode) {
        elements.uploadMode.classList.toggle('active', mode === 'upload');
        elements.urlMode.classList.toggle('active', mode === 'url');
        elements.txt2imgMode.classList.toggle('active', mode === 'txt2img');
    }
    // 切换按钮显示
    if (elements.convertButton) {
        elements.convertButton.style.display = (mode === 'upload' || mode === 'url') ? '' : 'none';
    }
    if (elements.txt2imgButton) {
        elements.txt2imgButton.style.display = (mode === 'txt2img') ? '' : 'none';
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
    // 文生图按钮事件监听
    if (elements.txt2imgButton) {
        elements.txt2imgButton.addEventListener('click', handleTxt2Img);
    }
    // 下载按钮事件监听
    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', downloadImage);
    }
    // 默认只显示风格迁移按钮，隐藏文生图按钮
    if (elements.txt2imgButton) {
        elements.txt2imgButton.style.display = 'none';
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
 * 设置按钮状态（风格迁移）
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
 * 设置文生图按钮状态
 */
function setTxt2ImgButtonState(isLoading) {
    if (!elements.txt2imgButton) return;

    if (isLoading) {
        elements.txt2imgButton.disabled = true;
        elements.txt2imgButton.innerHTML = '<span class="btn-text">🎨 生成中...</span>';
        elements.txt2imgButton.style.opacity = '0.6';
    } else {
        elements.txt2imgButton.disabled = false;
        elements.txt2imgButton.innerHTML = '<span class="btn-text">🎨 生成图片</span>';
        elements.txt2imgButton.style.opacity = '1';
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
            rotationY: 180, // 完全匹配原始设计的初始角度
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
            backgroundSize: 'cover', // 确保填满容器，避免黑色间隙
            backgroundPosition: (i) => getBgPos(i), // 使用微调的视差位置
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

// 计算背景位置实现微妙视差效果（在center基础上微调）
function getBgPos(i) {
    const ring = document.querySelector('.gallery-ring');
    if (!ring) return 'center'; // 默认居中
    
    const currentRotation = gsap.getProperty(ring, 'rotationY') || 0;
    // 减小视差强度：从500改为100，让用户看到图像主要部分
    const offset = gsap.utils.wrap(0, 360, currentRotation - 180 - i * 36) / 360 * 100;
    // 在center基础上进行微调：50% ± 偏移量
    const xPos = 50 + (offset - 50) * 0.3; // 减小偏移量影响
    return xPos + '% center'; // Y轴保持居中，X轴微调
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
 * 四象限图系统交互
 */
function initQuadrantSystem() {
    const quadrantStage = document.getElementById('quadrantStage');
    
    if (!quadrantStage) return;

    // 设置四象限动画观察器
    setupQuadrantObserver(quadrantStage);
    
    // 增强气泡交互
    enhanceQuadrantBubbles();
}

/**
 * 设置四象限观察器
 */
function setupQuadrantObserver(quadrantStage) {
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 激活四象限舞台
                entry.target.classList.add('active');
                
                // 启动气泡动画
                const bubbles = entry.target.querySelectorAll('.bubble-card');
                bubbles.forEach((bubble, index) => {
                    setTimeout(() => {
                        bubble.classList.add('animate-in');
                    }, index * 200);
                });
            }
        });
    }, observerOptions);
    
    observer.observe(quadrantStage);
}

/**
 * 增强四象限气泡效果
 */
function enhanceQuadrantBubbles() {
    const bubbles = document.querySelectorAll('.bubble-card');
    
    bubbles.forEach((bubble, index) => {
        const bubbleContent = bubble.querySelector('.bubble-content');
        const bubbleGlow = bubble.querySelector('.bubble-glow');
        
        // 气泡悬停效果
        bubbleContent.addEventListener('mouseenter', () => {
            // 高亮当前气泡
            bubbleContent.style.transform = 'scale(1.15)';
            if (bubbleGlow) {
                bubbleGlow.style.opacity = '1';
            }
            
            // 其他气泡变暗
            bubbles.forEach((otherBubble, otherIndex) => {
                if (otherIndex !== index) {
                    const otherContent = otherBubble.querySelector('.bubble-content');
                    otherContent.style.opacity = '0.5';
                    otherContent.style.filter = 'blur(2px)';
                }
            });
        });
        
        // 气泡离开效果
        bubbleContent.addEventListener('mouseleave', () => {
            // 恢复当前气泡
            bubbleContent.style.transform = '';
            if (bubbleGlow) {
                bubbleGlow.style.opacity = '';
            }
            
            // 恢复其他气泡
            bubbles.forEach((otherBubble) => {
                const otherContent = otherBubble.querySelector('.bubble-content');
                otherContent.style.opacity = '';
                otherContent.style.filter = '';
            });
        });
        
        // 气泡点击效果
        bubbleContent.addEventListener('click', () => {
            // 创建气泡脉冲效果
            createBubblePulse(bubbleContent);
            
            // 气泡弹跳动画
            bubbleContent.style.animation = 'none';
            bubbleContent.offsetHeight; // 触发重排
            bubbleContent.style.animation = 'iconBounce 0.6s ease-out';
        });
    });
}

/**
 * 创建气泡脉冲效果
 */
function createBubblePulse(bubbleContent) {
    const pulse = document.createElement('div');
    pulse.style.cssText = `
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        border: 3px solid rgba(255,255,255,0.6);
        border-radius: 50%;
        animation: bubblePulseEffect 1s ease-out;
        pointer-events: none;
        z-index: 1000;
    `;
    
    bubbleContent.appendChild(pulse);
    
    // 添加脉冲动画CSS
    if (!document.getElementById('bubble-pulse-styles')) {
        const style = document.createElement('style');
        style.id = 'bubble-pulse-styles';
        style.textContent = `
            @keyframes bubblePulseEffect {
                0% {
                    transform: scale(0.8);
                    opacity: 1;
                }
                100% {
                    transform: scale(1.5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 动画结束后移除元素
    setTimeout(() => {
        if (pulse.parentNode) {
            pulse.parentNode.removeChild(pulse);
        }
    }, 1000);
}

// 保持向后兼容性的函数重定向
function initAxisSystem() {
    // 这个函数现在为空，四象限功能已删除
}

function setupAxisObserver(axisStage) {
    // 这个函数现在为空，四象限功能已删除
}

function enhanceAxisNodes() {
    // 这个函数现在为空，四象限功能已删除
}

// 更新旧的滚动动画函数名称和功能
function initScrollAnimations() {
    // 保留原有的主要功能滚动效果
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                
                // 主要功能动画
                if (target.classList.contains('feature-main')) {
                    target.style.opacity = '1';
                    target.style.transform = 'translateY(0)';
                }
            }
        });
    }, observerOptions);

    // 观察主要功能区域
    const featureMain = document.querySelectorAll('.feature-main');
    featureMain.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(60px)';
        item.style.transition = 'all 0.8s ease';
        observer.observe(item);
    });
}

// 更新增强交互函数
function enhanceHighlightInteractions() {
    // 这个函数现在只处理主要功能
    console.log('主要功能交互已加载');
}

/**
 * 复古胶卷画廊轮播功能
 */

// 轮播器配置
const CAROUSEL_CONFIG = {
    autoPlay: false, // 禁用自动播放，用户手动控制
    transitionDuration: 600 // 过渡动画时长（毫秒）
};

// 轮播器状态管理
const carouselState = new Map();

/**
 * 初始化所有轮播器
 */
function initCarousels() {
    const carouselFrames = document.querySelectorAll('.carousel-frame');
    
    carouselFrames.forEach((frame, index) => {
        const style = frame.getAttribute('data-style');
        const images = frame.querySelectorAll('.carousel-image');
        const prevBtn = frame.querySelector('.prev-btn');
        const nextBtn = frame.querySelector('.next-btn');
        
        // 初始化轮播器状态
        carouselState.set(style, {
            currentIndex: 0,
            totalImages: images.length,
            isTransitioning: false
        });
        
        // 确保第一张图片显示
        if (images.length > 0) {
            images[0].classList.add('active');
        }
        
        // 绑定按钮事件
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                changeImage(style, -1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                changeImage(style, 1);
            });
        }
        
        // 添加键盘支持（当画框获得焦点时）
        frame.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                changeImage(style, -1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                changeImage(style, 1);
            }
        });
        
        // 使画框可获得焦点
        frame.setAttribute('tabindex', '0');
        
        console.log(`初始化轮播器: ${style}, 图片数量: ${images.length}`);
    });
}

/**
 * 切换图片
 */
function changeImage(style, direction) {
    const state = carouselState.get(style);
    
    if (!state || state.isTransitioning) {
        return;
    }
    
    const frame = document.querySelector(`[data-style="${style}"]`);
    const images = frame.querySelectorAll('.carousel-image');
    
    if (images.length <= 1) {
        return;
    }
    
    // 设置过渡状态
    state.isTransitioning = true;
    
    // 计算新的索引
    const newIndex = (state.currentIndex + direction + state.totalImages) % state.totalImages;
    
    // 获取当前和下一张图片
    const currentImage = images[state.currentIndex];
    const nextImage = images[newIndex];
    
    // 执行平滑过渡动画
    performImageTransition(currentImage, nextImage, direction, () => {
        // 更新状态
        state.currentIndex = newIndex;
        state.isTransitioning = false;
        carouselState.set(style, state);
        
        console.log(`${style} 轮播器切换到图片 ${newIndex + 1}/${state.totalImages}`);
    });
}

/**
 * 执行图片过渡动画
 */
function performImageTransition(currentImage, nextImage, direction, callback) {
    // 准备下一张图片
    nextImage.style.opacity = '0';
    nextImage.style.transform = direction > 0 ? 'translateX(30px)' : 'translateX(-30px)';
    nextImage.style.transition = 'none';
    
    // 短暂延迟后开始过渡
    requestAnimationFrame(() => {
        // 设置过渡效果
        currentImage.style.transition = `opacity ${CAROUSEL_CONFIG.transitionDuration}ms ease-in-out, transform ${CAROUSEL_CONFIG.transitionDuration}ms ease-in-out`;
        nextImage.style.transition = `opacity ${CAROUSEL_CONFIG.transitionDuration}ms ease-in-out, transform ${CAROUSEL_CONFIG.transitionDuration}ms ease-in-out`;
        
        // 执行过渡
        currentImage.style.opacity = '0';
        currentImage.style.transform = direction > 0 ? 'translateX(-30px)' : 'translateX(30px)';
        
        nextImage.style.opacity = '1';
        nextImage.style.transform = 'translateX(0)';
        
        // 更新active类
        currentImage.classList.remove('active');
        nextImage.classList.add('active');
        
        // 过渡完成后的清理
        setTimeout(() => {
            currentImage.style.transition = '';
            currentImage.style.transform = '';
            nextImage.style.transition = '';
            nextImage.style.transform = '';
            
            if (callback) {
                callback();
            }
        }, CAROUSEL_CONFIG.transitionDuration);
    });
}

/**
 * 添加轮播器增强交互效果
 */
function addCarouselInteractions() {
    const carouselFrames = document.querySelectorAll('.carousel-frame');
    
    carouselFrames.forEach(frame => {
        // 鼠标进入时的光晕效果增强
        frame.addEventListener('mouseenter', () => {
            const styleLabel = frame.querySelector('.style-label');
            if (styleLabel) {
                styleLabel.style.transform = 'translateY(-5px)';
                styleLabel.style.textShadow = '0 2px 4px rgba(44, 24, 16, 0.8), 0 0 15px rgba(244, 228, 193, 0.4)';
            }
        });
        
        frame.addEventListener('mouseleave', () => {
            const styleLabel = frame.querySelector('.style-label');
            if (styleLabel) {
                styleLabel.style.transform = '';
                styleLabel.style.textShadow = '0 2px 4px rgba(44, 24, 16, 0.8)';
            }
        });
        
        // 点击画框时聚焦（用于键盘导航）
        frame.addEventListener('click', () => {
            frame.focus();
        });
    });
}

/**
 * 艺术性增强功能
 */

/**
 * 创建动态粒子效果
 */
function createParticleEffect() {
    const gallerySection = document.querySelector('.vintage-gallery-section');
    if (!gallerySection) return;

    // 创建粒子
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // 随机位置
        const startX = Math.random() * window.innerWidth;
        particle.style.left = startX + 'px';
        particle.style.animationDelay = Math.random() * 2 + 's';
        
        gallerySection.appendChild(particle);
        
        // 动画结束后移除粒子
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 10000);
    }

    // 定期创建粒子
    const particleInterval = setInterval(() => {
        if (document.querySelector('.vintage-gallery-section.active-section')) {
            createParticle();
        }
    }, 2000);

    // 页面卸载时清除定时器
    window.addEventListener('beforeunload', () => {
        clearInterval(particleInterval);
    });
}

/**
 * 添加鼠标跟随光晕效果
 */
function addMouseFollowEffect() {
    const gallerySection = document.querySelector('.vintage-gallery-section');
    if (!gallerySection) return;

    // 创建光晕元素
    const mouseGlow = document.createElement('div');
    mouseGlow.style.cssText = `
        position: fixed;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(244, 228, 193, 0.2) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        transition: transform 0.1s ease;
        opacity: 0;
    `;
    document.body.appendChild(mouseGlow);

    // 鼠标移动事件
    gallerySection.addEventListener('mousemove', (e) => {
        mouseGlow.style.opacity = '1';
        mouseGlow.style.left = (e.clientX - 50) + 'px';
        mouseGlow.style.top = (e.clientY - 50) + 'px';
    });

    gallerySection.addEventListener('mouseleave', () => {
        mouseGlow.style.opacity = '0';
    });
}

/**
 * 增强轮播框的艺术性互动
 */
function enhanceCarouselArtistry() {
    const carouselFrames = document.querySelectorAll('.carousel-frame');
    
    carouselFrames.forEach(frame => {
        const images = frame.querySelectorAll('.carousel-image');
        
        // 为每个图片添加艺术性过渡效果
        images.forEach((img, index) => {
            img.addEventListener('load', () => {
                // 随机添加复古效果
                if (Math.random() > 0.5) {
                    img.style.filter += ' sepia(15%) saturate(1.2)';
                }
            });
        });
        
        // 增强悬停效果
        frame.addEventListener('mouseenter', () => {
            // 创建临时光效
            createTemporaryGlow(frame);
            
            // 添加轻微的旋转动画
            gsap.to(frame, {
                rotation: Math.random() * 2 - 1, // -1到1度的随机旋转
                duration: 0.5,
                ease: 'power2.out'
            });
        });
        
        frame.addEventListener('mouseleave', () => {
            // 恢复原始状态
            gsap.to(frame, {
                rotation: 0,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
    });
}

/**
 * 创建临时光效
 */
function createTemporaryGlow(element) {
    const glow = document.createElement('div');
    glow.style.cssText = `
        position: absolute;
        top: -20px;
        left: -20px;
        right: -20px;
        bottom: -20px;
        background: radial-gradient(circle, rgba(244, 228, 193, 0.3) 0%, transparent 60%);
        border-radius: 30px;
        pointer-events: none;
        z-index: -1;
        animation: glowPulse 1s ease-out;
    `;
    
    element.appendChild(glow);
    
    // 添加动画CSS
    if (!document.getElementById('glow-animation')) {
        const style = document.createElement('style');
        style.id = 'glow-animation';
        style.textContent = `
            @keyframes glowPulse {
                0% {
                    opacity: 0;
                    transform: scale(0.8);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.1);
                }
                100% {
                    opacity: 0;
                    transform: scale(1.3);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 动画结束后移除
    setTimeout(() => {
        if (glow.parentNode) {
            glow.parentNode.removeChild(glow);
        }
    }, 1000);
}

/**
 * 添加复古打字效果到标题
 */
function addVintageTypewriterEffect() {
    const title = document.querySelector('.vintage-title');
    if (!title) return;
    
    const originalText = title.textContent.trim();
    title.innerHTML = '<div class="title-art-deco"></div>';
    
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < originalText.length) {
            title.innerHTML = `<div class="title-art-deco"></div>${originalText.substring(0, i + 1)}<span class="typing-cursor">|</span>`;
            i++;
        } else {
            title.innerHTML = `<div class="title-art-deco"></div>${originalText}`;
            clearInterval(typeInterval);
        }
    }, 150);
    
    // 添加打字光标样式
    if (!document.getElementById('typing-cursor-style')) {
        const style = document.createElement('style');
        style.id = 'typing-cursor-style';
        style.textContent = `
            .typing-cursor {
                animation: blink 1s infinite;
                color: #f4e4c1;
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 添加随机复古装饰动画
 */
function addRandomVintageAnimations() {
    const decorations = document.querySelectorAll('.floating-decoration');
    
    decorations.forEach((decoration, index) => {
        // 随机延迟开始动画
        setTimeout(() => {
            decoration.style.animation = `floatDecoration ${8 + Math.random() * 4}s ease-in-out infinite`;
            decoration.style.animationDelay = Math.random() * 2 + 's';
        }, index * 500);
        
        // 添加点击交互
        decoration.addEventListener('click', () => {
            // 创建爆炸效果
            createSparkleEffect(decoration);
        });
    });
}

/**
 * 创建闪烁效果
 */
function createSparkleEffect(element) {
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: #f4e4c1;
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
        `;
        
        document.body.appendChild(sparkle);
        
        // 随机方向的动画
        const angle = (i / 8) * Math.PI * 2;
        const distance = 50 + Math.random() * 30;
        
        gsap.to(sparkle, {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            opacity: 0,
            scale: 0,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => {
                document.body.removeChild(sparkle);
            }
        });
    }
}

/**
 * 增强画廊入场动画（针对复古画廊）
 */
function animateVintageGalleryEntrance() {
    const gallerySection = document.querySelector('.vintage-gallery-section');
    if (!gallerySection) return;
    
    const header = gallerySection.querySelector('.gallery-header');
    const frames = gallerySection.querySelectorAll('.carousel-frame');
    const decorations = gallerySection.querySelectorAll('.floating-decoration');
    
    // 标题入场动画
    if (header) {
        gsap.fromTo(header,
            {
                opacity: 0,
                y: 50
            },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out',
                onComplete: () => {
                    // 标题动画完成后开始打字效果
                    setTimeout(addVintageTypewriterEffect, 500);
                }
            }
        );
    }
    
    // 轮播框依次入场
    frames.forEach((frame, index) => {
        gsap.fromTo(frame,
            {
                opacity: 0,
                y: 80,
                scale: 0.8,
                rotation: Math.random() * 10 - 5 // 随机初始旋转
            },
            {
                opacity: 1,
                y: 0,
                scale: 1,
                rotation: 0,
                duration: 0.8,
                delay: 0.2 + index * 0.15,
                ease: 'back.out(1.7)'
            }
        );
    });
    
    // 装饰元素入场
    decorations.forEach((decoration, index) => {
        gsap.fromTo(decoration,
            {
                opacity: 0,
                scale: 0,
                rotation: Math.random() * 360
            },
            {
                opacity: 0.4,
                scale: 1,
                rotation: 0,
                duration: 1,
                delay: 1 + index * 0.2,
                ease: 'elastic.out(1, 0.5)'
            }
        );
    });
    
    // 胶片齿孔动画
    const holes = gallerySection.querySelectorAll('.filmstrip-holes');
    holes.forEach((hole, index) => {
        gsap.fromTo(hole,
            {
                opacity: 0,
                x: index === 0 ? -50 : 50
            },
            {
                opacity: 1,
                x: 0,
                duration: 1.2,
                delay: 0.5,
                ease: 'power3.out'
            }
        );
    });
    
    // 启动艺术性功能
    setTimeout(() => {
        createParticleEffect();
        addMouseFollowEffect();
        enhanceCarouselArtistry();
        addRandomVintageAnimations();
    }, 2000);
}

/**
 * 文生图主流程
 */
async function handleTxt2Img() {
    try {
        const prompt = elements.txt2imgPromptInput?.value.trim();
        if (!prompt) {
            showError(new Error('请输入画面描述'));
            return;
        }
        setTxt2ImgButtonState(true);
        showState('loading');
        const result = await txt2imgApi(prompt);
        if (result.success) {
            showResult(result.imageUrl);
        } else {
            throw new Error(result.error || '生成失败');
        }
    } catch (error) {
        console.error('文生图错误:', error);
        showError(error);
    } finally {
        setTxt2ImgButtonState(false);
    }
}

/**
 * 文生图API调用
 */
async function txt2imgApi(prompt) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
        console.log('调用文生图API:', { prompt, url: TXT2IMG_API_URL });
        const response = await fetch(TXT2IMG_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        console.log('文生图API响应状态:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('文生图API错误响应:', errorText);
            throw new Error(`网络请求失败: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const result = await response.json();
        console.log('文生图API响应数据:', result);
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('文生图API调用失败:', error);
        if (error.name === 'AbortError') {
            throw new Error('请求超时，请检查网络连接或稍后重试');
        }
        throw error;
    }
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
            initScrollAnimations(); // 初始化流线型滚动效果
            enhanceHighlightInteractions(); // 增强特色卡片交互
            initCarousels(); // 初始化复古胶卷画廊
            addCarouselInteractions(); // 增强复古胶卷画廊交互
            animateVintageGalleryEntrance(); // 启动复古画廊入场动画
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