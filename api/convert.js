/**
 * Vercel API 路由 - 动漫头像风格迁移代理
 * 
 * 重要安全提醒：
 * 1. 在 Vercel 项目设置中配置环境变量 DASHSCOPE_API_KEY = sk-a641f6330e92448a8f27049ea6c1eda6
 * 2. 绝对不要在代码中硬编码 API Key
 */

// API 配置
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';
const MAX_POLLING_ATTEMPTS = 20; // 最大轮询次数 (约60秒)
const POLLING_INTERVAL = 3000; // 轮询间隔 (3秒)

/**
 * 创建图像转换任务
 */
async function createImageTask(imageUrl, prompt) {
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
        throw new Error('API Key 未配置，请在 Vercel 环境变量中设置 DASHSCOPE_API_KEY');
    }

    const requestBody = {
        model: "wanx2.1-imageedit",
        input: {
            function: "description_edit",
            prompt: prompt || "转换为动漫风格",
            base_image_url: imageUrl
        },
        parameters: {
            n: 1
        }
    };

    const response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/image2image/image-synthesis`, {
        method: 'POST',
        headers: {
            'X-DashScope-Async': 'enable',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(`创建任务失败: ${result.message || '未知错误'}`);
    }

    if (result.output && result.output.task_id) {
        return result.output.task_id;
    }

    throw new Error('API 响应格式异常，未找到 task_id');
}

/**
 * 查询任务状态
 */
async function getTaskStatus(taskId) {
    const apiKey = process.env.DASHSCOPE_API_KEY;

    const response = await fetch(`${DASHSCOPE_BASE_URL}/tasks/${taskId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(`查询任务状态失败: ${result.message || '未知错误'}`);
    }

    return result;
}

/**
 * 轮询任务直到完成
 */
async function pollTaskUntilComplete(taskId) {
    for (let attempt = 0; attempt < MAX_POLLING_ATTEMPTS; attempt++) {
        try {
            const taskResult = await getTaskStatus(taskId);
            const status = taskResult.output?.task_status;

            console.log(`轮询第 ${attempt + 1} 次，任务状态: ${status}`);

            switch (status) {
                case 'SUCCEEDED':
                    if (taskResult.output?.results?.[0]?.url) {
                        return {
                            success: true,
                            imageUrl: taskResult.output.results[0].url,
                            message: '图像转换成功！'
                        };
                    } else {
                        throw new Error('任务成功但未找到结果图片');
                    }

                case 'FAILED':
                    return {
                        success: false,
                        error: `任务失败: ${taskResult.output?.message || '未知原因'}`
                    };

                case 'PENDING':
                case 'RUNNING':
                    // 继续轮询
                    if (attempt < MAX_POLLING_ATTEMPTS - 1) {
                        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
                    }
                    break;

                default:
                    throw new Error(`未知的任务状态: ${status}`);
            }
        } catch (error) {
            console.error(`轮询第 ${attempt + 1} 次出错:`, error);

            // 如果是最后一次尝试，抛出错误
            if (attempt === MAX_POLLING_ATTEMPTS - 1) {
                throw error;
            }

            // 否则等待后继续
            await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        }
    }

    // 超时
    return {
        success: false,
        error: '任务处理超时，请稍后重试或检查输入的图片 URL 是否有效'
    };
}

/**
 * Vercel API 路由处理函数
 */
export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }

    try {
        const { imageUrl, prompt } = req.body;

        // 验证输入参数
        if (!imageUrl || !prompt) {
            return res.status(400).json({
                success: false,
                error: '缺少必需参数：imageUrl 或 prompt'
            });
        }

        console.log('收到转换请求:', { imageUrl, prompt });

        const API_KEY = process.env.DASHSCOPE_API_KEY;
        if (!API_KEY) {
            throw new Error('DASHSCOPE_API_KEY 环境变量未配置');
        }

        // 调用阿里云百炼 API - 风格迁移任务
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis', {
            method: 'POST',
            headers: {
                'X-DashScope-Async': 'enable',
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "wanx2.1-imageedit",
                input: {
                    function: "description_edit",
                    prompt: prompt,
                    base_image_url: imageUrl
                },
                parameters: {
                    n: 1
                }
            })
        });

        const result = await response.json();
        console.log('API 响应状态:', response.status);
        console.log('API 响应数据:', result);

        if (!response.ok) {
            throw new Error(`API 调用失败: ${response.status} - ${result.message || '未知错误'}`);
        }

        // 检查是否是异步任务
        if (result.output && result.output.task_id) {
            console.log('检测到异步任务，开始轮询结果...');

            const taskId = result.output.task_id;
            const finalResult = await pollTaskResult(taskId, API_KEY);

            if (finalResult.success) {
                return res.status(200).json({
                    success: true,
                    imageUrl: finalResult.imageUrl,
                    message: '风格迁移完成'
                });
            } else {
                throw new Error(finalResult.error);
            }
        }

        // 如果是同步返回结果
        if (result.output && result.output.results && result.output.results.length > 0) {
            const imageUrl = result.output.results[0].url;
            return res.status(200).json({
                success: true,
                imageUrl: imageUrl,
                message: '风格迁移完成'
            });
        }

        // 如果没有预期的结果格式
        throw new Error('API 返回了意外的响应格式');

    } catch (error) {
        console.error('转换过程中发生错误:', error);

        return res.status(500).json({
            success: false,
            error: error.message || '服务器内部错误'
        });
    }
}

// 轮询异步任务结果
async function pollTaskResult(taskId, apiKey, maxAttempts = 20, interval = 3000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`轮询尝试 ${attempt}/${maxAttempts}...`);

        try {
            const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            console.log(`轮询结果 ${attempt}:`, result);

            if (result.output) {
                // 任务完成
                if (result.output.task_status === 'SUCCEEDED' &&
                    result.output.results &&
                    result.output.results.length > 0) {

                    const imageUrl = result.output.results[0].url;
                    console.log('✅ 任务成功完成，图片URL:', imageUrl);

                    return {
                        success: true,
                        imageUrl: imageUrl
                    };
                }

                // 任务失败
                if (result.output.task_status === 'FAILED') {
                    return {
                        success: false,
                        error: `任务失败: ${result.output.message || '未知错误'}`
                    };
                }

                // 任务仍在处理中
                if (result.output.task_status === 'PENDING' || result.output.task_status === 'RUNNING') {
                    console.log(`任务状态: ${result.output.task_status}, 继续等待...`);
                }
            }

            // 等待下次轮询
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }

        } catch (error) {
            console.error(`轮询尝试 ${attempt} 失败:`, error);

            if (attempt === maxAttempts) {
                return {
                    success: false,
                    error: `轮询失败: ${error.message}`
                };
            }

            // 轮询失败时也要等待
            await new Promise(resolve => setTimeout(resolve, interval));
        }
    }

    return {
        success: false,
        error: '任务处理超时，请稍后重试'
    };
} 