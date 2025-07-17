/**
 * Vercel API 路由 - 文生图（Text-to-Image）代理
 * 
 * 重要安全提醒：
 * 1. 在 Vercel 项目设置中配置环境变量 DASHSCOPE_TEXT2IMG_API_KEY = sk-8a2bc45b0ade421e8b20d269f215a9c0
 * 2. 绝对不要在代码中硬编码 API Key
 */

const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';
const MAX_POLLING_ATTEMPTS = 20; // 最大轮询次数 (约60秒)
const POLLING_INTERVAL = 3000; // 轮询间隔 (3秒)

/**
 * 创建文生图任务
 */
async function createText2ImgTask(prompt) {
    const apiKey = process.env.DASHSCOPE_TEXT2IMG_API_KEY;
    if (!apiKey) {
        throw new Error('文生图API Key 未配置，请在 Vercel 环境变量中设置 DASHSCOPE_TEXT2IMG_API_KEY');
    }
    
    console.log('创建文生图任务，使用API Key:', apiKey.substring(0, 8) + '...');
    console.log('API Endpoint:', `${DASHSCOPE_BASE_URL}/services/aigc/text2image/image-synthesis`);
    
    const requestBody = {
        model: "wanx-v1",
        input: {
            prompt: prompt
        },
        parameters: {
            size: "1024*1024",
            n: 1
        }
    };
    
    console.log('请求体:', JSON.stringify(requestBody, null, 2));
    
    const headers = {
        'X-DashScope-Async': 'enable',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    console.log('请求头:', JSON.stringify(headers, null, 2));
    
    const response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/text2image/image-synthesis`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    console.log('阿里云API响应状态:', response.status);
    console.log('阿里云API响应内容:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
        throw new Error(`创建任务失败: ${result.message || result.code || '未知错误'} (状态码: ${response.status})`);
    }
    if (result.output && result.output.task_id) {
        console.log('任务创建成功，task_id:', result.output.task_id);
        return result.output.task_id;
    }
    throw new Error('API 响应格式异常，未找到 task_id');
}

/**
 * 轮询异步任务结果
 */
async function pollTaskResult(taskId, apiKey, maxAttempts = MAX_POLLING_ATTEMPTS, interval = POLLING_INTERVAL) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(`${DASHSCOPE_BASE_URL}/tasks/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (result.output) {
                if (result.output.task_status === 'SUCCEEDED' &&
                    result.output.results &&
                    result.output.results.length > 0) {
                    const imageUrl = result.output.results[0].url;
                    return {
                        success: true,
                        imageUrl: imageUrl
                    };
                }
                if (result.output.task_status === 'FAILED') {
                    return {
                        success: false,
                        error: `任务失败: ${result.output.message || '未知错误'}`
                    };
                }
            }
            // 等待下次轮询
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        } catch (e) {
            // 网络错误等，继续重试
        }
    }
    return {
        success: false,
        error: '任务超时，请稍后重试'
    };
}

/**
 * Vercel API 路由处理函数
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: '缺少必需参数：prompt'
            });
        }
        const API_KEY = process.env.DASHSCOPE_TEXT2IMG_API_KEY;
        if (!API_KEY) {
            throw new Error('DASHSCOPE_TEXT2IMG_API_KEY 环境变量未配置');
        }
        // 创建文生图任务
        const taskId = await createText2ImgTask(prompt);
        // 轮询任务结果
        const finalResult = await pollTaskResult(taskId, API_KEY);
        if (finalResult.success) {
            return res.status(200).json({
                success: true,
                imageUrl: finalResult.imageUrl,
                message: '文生图生成完成'
            });
        } else {
            throw new Error(finalResult.error);
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || '服务器内部错误'
        });
    }
} 