/**
 * 简单用户认证API - 支持数据库存储和VIP功能
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// 配置
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'anime_avatar_app';
const USERS_COLLECTION = 'users';

let cachedDb = null;

/**
 * 连接MongoDB数据库
 */
async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI环境变量未配置');
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);

    // 创建用户名唯一索引
    await db.collection(USERS_COLLECTION).createIndex({ username: 1 }, { unique: true });

    cachedDb = db;
    return db;
}

/**
 * 用户注册
 */
async function registerUser(username, password) {
    const db = await connectToDatabase();
    const users = db.collection(USERS_COLLECTION);

    // 基本验证
    if (!username || username.length < 3 || username.length > 20) {
        throw new Error('用户名长度必须在3-20个字符之间');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('用户名只能包含字母、数字和下划线');
    }
    if (!password || password.length < 6) {
        throw new Error('密码至少需要6个字符');
    }

    // 检查用户名是否已存在
    const existingUser = await users.findOne({ username });
    if (existingUser) {
        throw new Error('该用户名已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const newUser = {
        username,
        password: hashedPassword,
        isVIP: false, // 默认不是VIP
        registerTime: new Date(),
        lastLoginTime: null
    };

    await users.insertOne(newUser);

    return {
        success: true,
        message: '注册成功',
        user: {
            username: newUser.username,
            isVIP: newUser.isVIP
        }
    };
}

/**
 * 用户登录
 */
async function loginUser(username, password) {
    const db = await connectToDatabase();
    const users = db.collection(USERS_COLLECTION);

    // 查找用户
    const user = await users.findOne({ username });
    if (!user) {
        throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('用户名或密码错误');
    }

    // 更新最后登录时间
    await users.updateOne(
        { username },
        { $set: { lastLoginTime: new Date() } }
    );

    return {
        success: true,
        message: '登录成功',
        user: {
            username: user.username,
            isVIP: user.isVIP,
            registerTime: user.registerTime
        }
    };
}

/**
 * 设置VIP状态
 */
async function setVIPStatus(username, isVIP) {
    const db = await connectToDatabase();
    const users = db.collection(USERS_COLLECTION);

    const result = await users.updateOne(
        { username },
        { $set: { isVIP: isVIP } }
    );

    if (result.matchedCount === 0) {
        throw new Error('用户不存在');
    }

    return {
        success: true,
        message: `用户 ${username} 的VIP状态已更新为: ${isVIP ? 'VIP用户' : '普通用户'}`
    };
}

/**
 * API路由处理器
 */
export default async function handler(req, res) {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action } = req.query;

        switch (action) {
            case 'register':
                if (req.method !== 'POST') {
                    return res.status(405).json({ success: false, error: '只支持POST请求' });
                }

                const { username, password } = req.body;
                const registerResult = await registerUser(username, password);
                return res.status(201).json(registerResult);

            case 'login':
                if (req.method !== 'POST') {
                    return res.status(405).json({ success: false, error: '只支持POST请求' });
                }

                const { username: loginUsername, password: loginPassword } = req.body;
                const loginResult = await loginUser(loginUsername, loginPassword);
                return res.status(200).json(loginResult);

            case 'setVIP':
                if (req.method !== 'POST') {
                    return res.status(405).json({ success: false, error: '只支持POST请求' });
                }

                const { username: vipUsername, isVIP } = req.body;
                const vipResult = await setVIPStatus(vipUsername, isVIP);
                return res.status(200).json(vipResult);

            default:
                return res.status(400).json({
                    success: false,
                    error: '无效的操作',
                    availableActions: ['register', 'login', 'setVIP']
                });
        }

    } catch (error) {
        console.error('认证API错误:', error);

        const statusCode = error.message.includes('已被注册') ||
            error.message.includes('密码错误') ||
            error.message.includes('用户不存在') ? 400 : 500;

        return res.status(statusCode).json({
            success: false,
            error: error.message
        });
    }
} 