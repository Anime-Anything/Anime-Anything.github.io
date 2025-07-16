import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';
import dotenv from 'dotenv';
import handler from './api/convert.js';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json({ limit: '50mb' })); // 增加请求体大小限制到 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));

// API 路由
app.all('/api/convert', async (req, res) => {
    console.log('🔄 收到 API 请求:', req.method, req.url);
    console.log('📝 请求数据:', req.body);

    try {
        await handler(req, res);
    } catch (error) {
        console.error('❌ API 错误详情:', error);
        console.error('错误堆栈:', error.stack);

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message || '服务器内部错误'
            });
        }
    }
});

// 静态文件服务
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 获取本机IP地址
function getLocalIP() {
    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // 跳过内部地址和非IPv4地址
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();

    console.log(`🚀 服务器已启动！`);
    console.log(`📱 本地访问: http://localhost:${PORT}`);
    console.log(`🌐 局域网访问: http://${localIP}:${PORT}`);
    console.log(`🎨 动漫头像生成器已就绪！`);
    console.log(`\n📋 分享给朋友:`);
    console.log(`   同一WiFi下的朋友可以访问: http://${localIP}:${PORT}`);

    // 检查 API Key 是否已设置
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (apiKey) {
        console.log(`\n✅ API Key 已配置: ${apiKey.substring(0, 10)}...`);
    } else {
        console.log(`\n❌ API Key 未配置，请在 .env 文件中设置 DASHSCOPE_API_KEY`);
    }
});
