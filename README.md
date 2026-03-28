# 任务管理

<div align="center">

![License](https://img.shields.io/github/license/yifengjob/siyuan-plugin-task-manager)
![Version](https://img.shields.io/github/v/release/yifengjob/siyuan-plugin-task-manager)
![Stars](https://img.shields.io/github/stars/yifengjob/siyuan-plugin-task-manager?style=social)

**思源笔记插件 | 集中管理您的所有任务**

</div>

---

## 📖 简介

任务管理是一个思源笔记插件，专为集中管理分散在整个工作空间的任务而设计。它可以帮助您轻松追踪和管理待办事项，为每个任务添加丰富的元数据，让工作效率倍增。

### ✨ 主要特性

- 📋 **集中管理** - 自动汇聚整个工作空间的所有任务块
- 🏷️ **丰富属性** - 支持开始时间、计划完成、实际完成、优先级、备注等
- 🎯 **智能筛选** - 按完成状态快速筛选（全部/已完成/未完成）
- 📊 **实时统计** - 底部状态栏显示总任务数、进行中、已完成数量
- 🔔 **自动同步** - 监听编辑器变更，实时更新任务状态
- 🎨 **精美 UI** - 现代化界面设计，支持亮/暗主题自动适配

## 🚀 快速开始

### 安装方式

#### 方式一：通过思源笔记集市安装（推荐）

1. 打开思源笔记
2. 点击顶部菜单 `☰` → `设置`
3. 选择 `关于` → `插件市场`
4. 搜索 `任务管理` 或 `Task Manager`
5. 点击安装并启用

#### 方式二：手动安装

1. 从 [GitHub Releases](https://github.com/yifengjob/siyuan-plugin-task-manager/releases) 下载最新版本的 `.zip` 文件
2. 解压到思源笔记的 `data/plugins/` 目录下
3. 重启思源笔记
4. 在 `设置` → `关于` → `插件列表` 中启用插件

### 开发环境运行

``` bash
# 克隆项目
git clone https://github.com/yifengjob/siyuan-plugin-task-manager.git
# 进入项目目录
cd siyuan-plugin-task-manager
# 安装依赖
npm install

# 配置思源笔记工作空间路径
cp .env.example .env
# 编辑 .env 文件，修改 VITE_SIYUAN_WORKSPACE_PATH 为你的实际路径
# 开发模式（热重载）
npm dev
# 构建生产版本
npm build
# 发布新版本
npm release:patch # 补丁版本
npm release:minor # 次版本
npm release:major # 主版本
```

## 📝 使用指南

### 基本用法

1. **创建任务**

- 在任意文档中使用 `- [ ] 任务内容` 格式创建任务块
- 任务会自动出现在任务管理面板中

2. **查看任务**

- 点击右侧边栏的任务图标（📋）打开任务面板
- 按文档分组显示所有任务

3. **编辑任务**

- 鼠标悬停在任务条目上
- 单击任务内容弹出详细信息框
- 填写开始时间、计划完成时间、优先级等信息

4. **完成任务**

- 勾选任务前的复选框
- 系统自动记录实际完成日期
- 任务状态实时更新

### 任务属性说明

| 属性   | 说明           | 示例           |
|------|--------------|--------------|
| 开始时间 | 任务开始日期       | `2024-01-01` |
| 计划完成 | 预计完成日期       | `2024-01-15` |
| 实际完成 | 实际完成日期（自动记录） | `2024-01-14` |
| 优先级  | 任务重要程度       | 高/中/普通/低     |
| 备注   | 额外说明信息       | 自由文本         |

### 筛选与统计

- **全部** - 显示所有任务
- **未完成** - 只显示进行中的任务（默认）
- **已完成** - 只显示已完成的任务
- **刷新按钮** - 手动刷新任务列表
- **底部状态栏** - 实时显示任务统计数据

## ⚙️ 技术架构

### 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite 8
- **状态管理**: Pinia
- **样式方案**: SCSS
- **SDK**: Siyuan SDK

### 核心特性

- ✅ 直接从数据库读取任务，性能优异
- ✅ 智能解析 blocks 表的 ial 字段获取属性
- ✅ SQL JOIN 查询优化，减少 API 调用
- ✅ 事件驱动架构，实时响应用户操作
- ✅ 组件化设计，易于扩展和维护

### 项目结构

```angular2html

siyuan-plugin-task-manager/
├── src/
│ ├── components/ # Vue 组件
│ │ ├── Sidebar.vue # 侧边栏
│ │ ├── TaskItem.vue # 任务条目
│ │ ├── TaskForm.vue # 任务表单
│ │ └── TaskPopover.vue # 任务弹窗
│ ├── services/ # 服务层
│ │ ├── ApiService.ts # API 服务
│ │ └── TaskService.ts # 任务服务
│ ├── stores/ # 状态管理
│ │ └── tasks.store.ts # 任务存储
│ ├── types/ # 类型定义
│ ├── utils/ # 工具函数
│ ├── assets/ # 静态资源
│ ├── i18n/ # 国际化
│ └── index.ts # 入口文件
├── plugin.json # 插件配置
└── vite.config.ts # 构建配置
```

## 🔧 配置选项

在 `设置` → `关于` → `插件列表` → `任务管理` → `配置` 中可以调整：

- **显示已完成任务** - 控制是否在列表中显示已完成的任务

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

本项目使用 ESLint + Prettier 保证代码风格一致性：

```bash
#检查代码
npm lint
#自动格式化
npm format

```

## 📄 许可证

本项目采用 AGPL-3.0 许可证开源。

## 🙏 致谢

- [思源笔记](https://b3log.org/siyuan/) - 强大的本地优先知识管理工具
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

## 📮 反馈与支持

- **问题反馈**: [GitHub Issues](https://github.com/yifengjob/siyuan-plugin-task-manager/issues)
- **功能建议**: [GitHub Discussions](https://github.com/yifengjob/siyuan-plugin-task-manager/discussions)
- **作者主页**: [YiFeng](https://github.com/yifengjob)

---

<div align="center">

**如果觉得有用，请给个 ⭐ Star 支持一下！ 如果您资金富余，请扫码赞赏支持我。**


<img src="https://cdn.jsdelivr.net/gh/yifengjob/siyuan-plugin-concat-subdocs/wechat-reward.png"  onerror="this.onerror=null;this.src='./wechat-reward.png';" alt="微信赞赏码" width="300" align="center" style="height: auto;box-shadow: 0px 0px 5px #aaaaaa;">

</div>
