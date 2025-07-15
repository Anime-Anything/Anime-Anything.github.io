/**
 * 动漫头像风格迁移代理云函数
 * 
 * 重要安全提醒：
 * 1. 在云函数平台设置环境变量 DASHSCOPE_API_KEY = sk-a641f6330e92448a8f27049ea6c1eda6
 * 2. 绝对不要在代码中硬编码 API Key
 */

const fetch = require('node-fetch'); // 云函数环境中可能需要安装此依赖

// API 配置
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';
const MAX_POLLING_ATTEMPTS = 20; // 最大轮询次数 (约60秒)
const POLLING_INTERVAL = 3000; // 轮询间隔 (3秒)

/**
 * 设置 CORS 响应头
 */
function setCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };
}

/**
 * 创建图像转换任务
 */
async function createImageTask(imageUrl, prompt) {
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
        throw new Error('API Key 未配置，请在云函数环境变量中设置 DASHSCOPE_API_KEY');
    }

    const requestBody = {
        model: "wanx-style-repaint-v1",
        input: {
            base_image_url: imageUrl,
            style_index: 0,
            prompt: prompt
        },
        parameters: {
            style: "anime"
        }
    };

    const response = await fetch(`${DASHSCOPE_BASE_URL}/services/aigc/image2image/image-synthesis`, {
        method: 'POST',
        headers: {
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
 * 主函数入口
 */
exports.handler = async (event, context) => {
    const headers = setCorsHeaders();

    try {
        // 处理 OPTIONS 预检请求
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: ''
            };
        }

        // 只接受 POST 请求
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: '仅支持 POST 请求'
                })
            };
        }

        // 解析请求体
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, prompt } = body;

        // 验证输入参数
        if (!imageUrl || !prompt) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: '缺少必要参数：imageUrl 和 prompt'
                })
            };
        }

        // URL 基本验证
        try {
            new URL(imageUrl);
        } catch {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: '请提供有效的图片 URL'
                })
            };
        }

        console.log(`开始处理图像转换任务，图片URL: ${imageUrl}, 风格提示: ${prompt}`);

        // 创建任务
        const taskId = await createImageTask(imageUrl, prompt);
        console.log(`任务创建成功，task_id: ${taskId}`);

        // 轮询任务直到完成
        const result = await pollTaskUntilComplete(taskId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(result)
        };

    } catch (error) {
        console.error('处理请求时出错:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: `服务器错误: ${error.message}`
            })
        };
    }
}; 