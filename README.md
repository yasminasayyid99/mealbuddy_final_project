# MealBuddy - 饭局社交平台

一个基于React和Flask的现代化饭局组织与社交平台，让用户能够轻松创建、参与和管理各种美食聚会活动。

## 🚀 技术栈

### 前端技术
- **React 18.2.0** - 现代化前端框架
- **Vite 5.4.0** - 快速构建工具和开发服务器
- **Socket.IO Client 4.8.1** - 实时通信客户端
- **原生CSS** - 响应式UI设计
- **JavaScript ES6+** - 现代JavaScript特性

### 后端技术
- **Flask 2.3.3** - Python轻量级Web框架
- **Flask-SQLAlchemy 3.0.5** - ORM数据库操作
- **Flask-JWT-Extended 4.5.3** - JWT身份认证
- **Flask-SocketIO 5.3.6** - WebSocket实时通信
- **Flask-CORS 4.0.0** - 跨域资源共享
- **Flask-Migrate 4.0.5** - 数据库迁移
- **SQLite** - 轻量级数据库
- **Werkzeug 2.3.7** - WSGI工具库
- **Pillow 10.0.1** - 图像处理
- **bcrypt 4.0.1** - 密码加密
### AI集成
- **ChatAnywhere API** - GPT-3.5-turbo模型
- **智能推荐系统** - 基于用户偏好的餐厅和活动推荐

## 📁 项目结构

```
mealbuddy_final/
├── backend/                 # Flask后端服务
│   ├── models/             # 数据模型
│   │   ├── user.py        # 用户模型
│   │   ├── event.py       # 活动模型
│   │   └── chat.py        # 聊天消息模型
│   ├── routes/             # API路由
│   │   ├── auth.py        # 认证相关API
│   │   ├── events.py      # 活动相关API
│   │   ├── chat.py        # 聊天相关API
│   │   ├── ai.py          # AI助手API
│   │   ├── upload.py      # 文件上传API
│   │   └── users.py       # 用户相关API
│   ├── services/           # 业务服务
│   │   └── ai_service.py  # AI服务集成
│   ├── utils/              # 工具函数
│   │   ├── helpers.py     # 辅助函数
│   │   └── validators.py  # 数据验证
│   ├── app.py             # Flask应用主文件
│   ├── config.py          # 配置文件
│   ├── database.py        # 数据库配置
│   └── requirements.txt   # Python依赖
├── frontend/               # React前端应用
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── services/      # API服务
│   │   │   └── api.js    # API客户端
│   │   ├── hooks/         # React Hooks
│   │   ├── App.jsx        # 主应用组件
│   │   └── main.jsx       # 应用入口
│   ├── package.json       # Node.js依赖
│   └── vite.config.js     # Vite配置
└── README.md              # 项目文档
```

## 🗄️ 数据库结构

### 用户表 (User)
```sql
CREATE TABLE user (
    id VARCHAR(36) PRIMARY KEY,           -- UUID主键
    username VARCHAR(80) UNIQUE NOT NULL, -- 用户名
    email VARCHAR(120) UNIQUE NOT NULL,   -- 邮箱
    password_hash VARCHAR(255) NOT NULL,  -- 加密密码
    avatar VARCHAR(255) DEFAULT '',       -- 头像URL
    bio TEXT DEFAULT '',                  -- 个人简介
    dietary_preferences JSON DEFAULT '[]', -- 饮食偏好(JSON数组)
    location VARCHAR(255) DEFAULT '',     -- 位置信息
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 活动表 (Event)
```sql
CREATE TABLE event (
    id VARCHAR(36) PRIMARY KEY,           -- UUID主键
    title VARCHAR(200) NOT NULL,          -- 活动标题
    description TEXT DEFAULT '',          -- 活动描述
    category VARCHAR(50) NOT NULL,        -- 活动分类
    date DATETIME NOT NULL,               -- 活动日期
    time VARCHAR(20) NOT NULL,            -- 活动时间
    location VARCHAR(255) NOT NULL,       -- 活动地点
    max_participants INTEGER DEFAULT 10,  -- 最大参与人数
    budget_per_person FLOAT DEFAULT 0.0,  -- 人均预算
    image VARCHAR(255) DEFAULT '',        -- 活动图片URL
    status VARCHAR(20) DEFAULT 'active',  -- 状态(active/cancelled/completed)
    creator_id VARCHAR(36) NOT NULL,      -- 创建者ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES user(id)
);
```

### 聊天消息表 (ChatMessage)
```sql
CREATE TABLE chat_message (
    id VARCHAR(36) PRIMARY KEY,           -- UUID主键
    content TEXT NOT NULL,                -- 消息内容
    message_type VARCHAR(20) DEFAULT 'text', -- 消息类型(text/image/system)
    sender_id VARCHAR(36) NOT NULL,       -- 发送者ID
    event_id VARCHAR(36) NOT NULL,        -- 关联活动ID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES user(id),
    FOREIGN KEY (event_id) REFERENCES event(id)
);
```

### 关联表
```sql
-- 活动参与者关联表
CREATE TABLE event_participants (
    user_id VARCHAR(36),
    event_id VARCHAR(36),
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (event_id) REFERENCES event(id)
);

-- 用户收藏活动关联表
CREATE TABLE saved_events (
    user_id VARCHAR(36),
    event_id VARCHAR(36),
    PRIMARY KEY (user_id, event_id),
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (event_id) REFERENCES event(id)
);
```

## 🔌 API接口文档

### 认证相关 (/api/auth)

#### POST /api/auth/register
用户注册
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### POST /api/auth/login
用户登录
```json
{
  "username": "string",
  "password": "string"
}
```

#### POST /api/auth/logout
用户登出（需要JWT Token）

#### GET /api/auth/profile
获取用户资料（需要JWT Token）

### 活动相关 (/api/events)

#### GET /api/events
获取活动列表
- 查询参数：`page`, `per_page`, `keyword`, `filter`
- 支持分页和关键词搜索

#### POST /api/events
创建新活动（需要JWT Token）
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "location": "string",
  "max_participants": "integer",
  "budget_per_person": "float"
}
```

#### GET /api/events/{event_id}
获取活动详情

#### PUT /api/events/{event_id}
更新活动信息（需要JWT Token，仅创建者）

#### DELETE /api/events/{event_id}
删除活动（需要JWT Token，仅创建者）

#### POST /api/events/{event_id}/join
参与活动（需要JWT Token）

#### POST /api/events/{event_id}/leave
退出活动（需要JWT Token）

#### POST /api/events/{event_id}/save
收藏活动（需要JWT Token）

#### DELETE /api/events/{event_id}/save
取消收藏（需要JWT Token）

#### GET /api/events/my-events
获取我创建的活动（需要JWT Token）

### 聊天相关 (/api/chat)

#### GET /api/chat/conversations
获取聊天会话列表（需要JWT Token）

#### GET /api/chat/{event_id}
获取活动聊天记录（需要JWT Token）
- 查询参数：`page`, `per_page`

#### POST /api/chat/{event_id}
发送聊天消息（需要JWT Token）
```json
{
  "message": "string"
}
```

### AI助手相关 (/api/ai)

#### POST /api/ai/chat
AI聊天对话（需要JWT Token）
```json
{
  "message": "string"
}
```

#### POST /api/ai/event-suggestions
获取活动建议（需要JWT Token）
```json
{
  "category": "string",
  "participants_count": "integer"
}
```

### 用户相关 (/api/users)

#### GET /api/users/profile
获取用户资料（需要JWT Token）

#### PUT /api/users/profile
更新用户资料（需要JWT Token）
```json
{
  "username": "string",
  "email": "string",
  "bio": "string",
  "dietary_preferences": ["string"],
  "location": "string"
}
```

### 文件上传相关 (/api/upload)

#### POST /api/upload/avatar
上传用户头像（需要JWT Token）
- Content-Type: multipart/form-data
- 字段名: avatar

#### POST /api/upload/event
上传活动图片（需要JWT Token）
- Content-Type: multipart/form-data
- 字段名: image

#### GET /api/upload/uploads/{filename}
获取上传的文件

#### GET /api/upload/info
获取上传配置信息

### 系统健康检查

#### GET /api/health
系统健康状态检查

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 创建虚拟环境
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows
```

3. 安装依赖
```bash
pip install -r requirements.txt
```

4. 配置环境变量
创建 `.env` 文件：
```env
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
CHATANYWHERE_API_KEY=your-chatanywhere-api-key
CHATANYWHERE_BASE_URL=https://api.chatanywhere.tech/v1
DATABASE_URL=sqlite:///mealbuddy.db
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
```

5. 初始化数据库
```bash
python init_db.py
```

6. 启动后端服务
```bash
python run.py
```

后端服务将在 `http://localhost:3001` 启动

### 前端启动

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件：
```env
VITE_API_URL=http://localhost:3001
```

4. 启动开发服务器
```bash
npm run dev
```

前端应用将在 `http://localhost:5173` 启动

## 📊 实验报告

### 项目概述

MealBuddy是一个现代化的饭局社交平台，旨在解决现代都市人群组织聚餐活动的痛点。通过提供直观的界面、实时聊天功能和AI智能推荐，让用户能够轻松创建、发现和参与各种美食聚会。

### 核心功能实现

#### 1. 用户认证系统
- **技术实现**：基于JWT的无状态认证
- **安全特性**：
  - bcrypt密码加密
  - Token过期自动处理
  - 跨域安全配置
- **用户体验**：
  - 自动登录状态保持
  - 友好的错误提示
  - 响应式登录界面

#### 2. 活动管理系统
- **功能特点**：
  - 活动创建、编辑、删除
  - 多维度筛选和搜索
  - 活动状态管理（活跃/已取消/已完成）
  - 参与者管理
- **技术亮点**：
  - SQLAlchemy ORM关系映射
  - 分页查询优化
  - 图片上传和处理
  - 实时状态同步

#### 3. 实时聊天系统
- **技术架构**：
  - Flask-SocketIO WebSocket通信
  - 基于活动的聊天室
  - 消息持久化存储
- **功能特性**：
  - 实时消息推送
  - 聊天历史记录
  - 用户在线状态
  - 消息类型支持（文本/图片/系统消息）

#### 4. AI智能助手
- **集成方案**：ChatAnywhere API (GPT-3.5-turbo)
- **应用场景**：
  - 餐厅推荐
  - 活动建议
  - 美食咨询
  - 聚餐规划
- **优化策略**：
  - 上下文感知对话
  - 用户偏好学习
  - 响应时间优化

#### 5. 文件上传系统
- **支持格式**：PNG, JPG, JPEG, GIF
- **安全措施**：
  - 文件类型验证
  - 文件大小限制（16MB）
  - 安全文件名处理
- **存储方案**：本地文件系统存储

### 技术架构分析

#### 前端架构
- **组件化设计**：React函数组件 + Hooks
- **状态管理**：useState + useEffect本地状态管理
- **API通信**：统一的ApiService封装
- **样式方案**：原生CSS + CSS变量主题系统
- **构建工具**：Vite快速开发和构建

#### 后端架构
- **框架选择**：Flask轻量级框架，适合中小型项目
- **数据库设计**：SQLite + SQLAlchemy ORM
- **API设计**：RESTful API + Blueprint模块化
- **认证方案**：JWT无状态认证
- **实时通信**：WebSocket双向通信

### 性能优化

#### 前端优化
1. **代码分割**：Vite自动代码分割
2. **懒加载**：组件按需加载
3. **缓存策略**：localStorage本地缓存
4. **网络优化**：API请求去重和错误重试

#### 后端优化
1. **数据库优化**：
   - 索引优化（用户名、邮箱唯一索引）
   - 查询优化（分页查询、关联查询）
   - 连接池管理
2. **API优化**：
   - 响应数据结构优化
   - 错误处理统一化
   - 请求参数验证

### 安全性考虑

1. **认证安全**：
   - JWT Token安全传输
   - 密码bcrypt加密存储
   - Token过期机制

2. **数据安全**：
   - SQL注入防护（ORM参数化查询）
   - XSS防护（输入验证和转义）
   - CSRF防护（CORS配置）

3. **文件安全**：
   - 文件类型白名单
   - 文件大小限制
   - 安全文件名处理

### 测试与部署

#### 开发测试
- **功能测试**：手动测试各功能模块
- **兼容性测试**：多浏览器兼容性验证
- **性能测试**：页面加载速度和API响应时间

#### 部署方案
- **开发环境**：本地开发服务器
- **生产环境建议**：
  - 前端：Nginx静态文件服务
  - 后端：Gunicorn + Nginx反向代理
  - 数据库：PostgreSQL或MySQL
  - 缓存：Redis

### 项目亮点

1. **现代化技术栈**：React 18 + Flask最新版本
2. **实时通信**：WebSocket实时聊天体验
3. **AI集成**：智能助手提升用户体验
4. **响应式设计**：适配多种设备屏幕
5. **模块化架构**：前后端分离，易于维护和扩展

### 未来改进方向

1. **功能扩展**：
   - 地图集成（活动位置可视化）
   - 支付集成（AA收款功能）
   - 社交功能（好友系统、动态分享）
   - 推荐算法（基于用户行为的智能推荐）

2. **技术优化**：
   - 微服务架构重构
   - 容器化部署（Docker）
   - 自动化测试（单元测试、集成测试）
   - 监控和日志系统

3. **用户体验**：
   - PWA支持（离线使用）
   - 推送通知
   - 多语言支持
   - 无障碍访问优化

### 总结

MealBuddy项目成功实现了一个功能完整的饭局社交平台，展示了现代Web开发的最佳实践。通过React和Flask的组合，实现了高效的前后端分离架构。项目在用户体验、技术实现和安全性方面都达到了较高的水准，为用户提供了便捷的饭局组织和社交体验。

## 📝 许可证

MIT License

## 👥 贡献者

- 开发者：aguai
- 项目类型：个人学习项目

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 项目仓库：[GitHub Repository]
- 邮箱：[Your Email]

---

*最后更新时间：2024年12月*
