# 任务管理

<div style="text-align: center;">

![License](https://img.shields.io/github/license/yifengjob/siyuan-plugin-task-manager)
![Version](https://img.shields.io/github/v/release/yifengjob/siyuan-plugin-task-manager)
![Stars](https://img.shields.io/github/stars/yifengjob/siyuan-plugin-task-manager?style=social)
![Downloads](https://img.shields.io/github/downloads/yifengjob/siyuan-plugin-task-manager/total)

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
- 📱 **多平台** - 支持桌面端、浏览器端
- ⚡ **高性能** - 直接从数据库读取，SQL 优化查询，增量更新机制
- 🔒 **安全可靠** - 参数化 SQL 查询，防止注入攻击

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
npm run dev
# 构建生产版本
npm run build
# 代码检查与格式化
npm run lint # 检查代码规范 
npm run format # 自动格式化代码
# 发布新版本
npm run release:patch # 补丁版本 (1.0.0 -> 1.0.1) 
npm run release:minor # 次版本 (1.0.0 -> 1.1.0) 
npm run release:major # 主版本 (1.0.0 -> 2.0.0)
```

## 📝 使用指南

### 基本用法

1. **创建任务**

- 在任意文档中使用 `- [ ] 任务内容` 格式创建任务块
- 任务会自动出现在任务管理面板中

2. **查看任务**

- 点击右侧边栏的任务图标（📋）打开任务面板
- 按文档分组显示所有任务
- 使用顶部的筛选器切换视图（未完成/已完成/全部）

3. **编辑任务**

- 鼠标悬停在任务条目上
- 单击任务内容弹出详细信息框
- 填写开始时间、计划完成时间、优先级、备注等信息
- 点击"保存"按钮应用更改

4. **完成任务**

- 勾选任务前的复选框
- 系统自动记录实际完成日期
- 任务状态实时更新并同步到数据库

5. **快速定位**

- 点击任务标题可直接跳转到原文档位置
- 支持在新窗口中打开任务所在文档

### 任务属性说明

| 属性   | 说明         | 示例                    | 必填 |
|------|------------|-----------------------|----|
| 开始时间 | 任务开始日期     | `2024-01-01`          | 否  |
| 计划完成 | 预计完成日期     | `2024-01-15`          | 否  |
| 实际完成 | 实际完成日期（自动） | `2024-01-14 10:30:00` | 自动 |
| 优先级  | 任务重要程度     | 高/中/普通/低              | 否  |
| 备注   | 额外说明信息     | 自由文本                  | 否  |

### 筛选与统计

- **未完成** - 只显示进行中的任务（默认视图）
- **已完成** - 只显示已完成的任务
- **全部** - 显示所有任务
- **刷新按钮** - 手动刷新任务列表（通常自动同步无需手动刷新）
- **底部状态栏** - 实时显示任务统计数据（进行中/已完成/总数）

### 高级功能

#### 任务过滤

在插件配置中可以设置：

- **笔记本过滤** - 排除特定笔记本中的任务
- **文档过滤** - 排除特定文档中的任务

适用于：

- 归档笔记本不需要显示任务
- 模板文档中的任务不应出现在列表中

#### 自定义日期格式

支持自定义日期时间显示格式，参考 [date-fns 格式文档](https://date-fns.org/docs/format)。

常用格式：

- `yyyy-MM-dd` - 2024-01-15
- `yyyy/MM/dd HH:mm` - 2024/01/15 10:30
- `MM-dd HH:mm:ss` - 01-15 10:30:00

## ⚙️ 技术架构

### 技术栈

- **前端框架**: Vue 3.5 + TypeScript 6.0
- **构建工具**: Vite 8.0 + Rolldown
- **状态管理**: Pinia 3.0
- **样式方案**: SCSS + CSS Variables
- **浮动 UI**: @floating-ui/dom
- **日期组件**: @vuepic/vue-datepicker
- **SDK**: Siyuan SDK 1.1.9
- **代码质量**: ESLint + Prettier + TypeScript

### 核心特性

- ✅ **高性能数据库查询** - 直接从 SQLite 数据库读取，避免 API 开销
- ✅ **智能 SQL 优化** - JOIN 查询减少请求次数，参数化防止注入
- ✅ **增量更新机制** - 监听 WebSocket 事件，只更新变化的任务
- ✅ **乐观更新策略** - UI 立即响应，后台同步，失败自动回滚
- ✅ **防抖节流优化** - 高频事件自动优化，避免不必要的刷新
- ✅ **事件驱动架构** - 实时响应用户操作和编辑器变更
- ✅ **组件化设计** - 清晰的组件分层，易于扩展和维护
- ✅ **类型安全** - 完整的 TypeScript 类型定义，编译时检查

### 项目结构

```
siyuan-plugin-task-manager/ 
├── src/ 
│ ├── components/ # Vue 组件 
│ │ ├── Sidebar.vue # 侧边栏主面板 
│ │ ├── TaskItem.vue # 单个任务项 
│ │ ├── TaskPopover.vue # 任务编辑弹窗 
│ │ ├── DateTimePickerField.vue # 日期时间选择器 
│ │ └── TreeItem.vue # 树形选择器项 
│ ├── services/ # 服务层 
│ │ ├── ApiService.ts # API 封装服务 
│ │ └── TaskService.ts # 任务业务逻辑 
│ ├── stores/ # 状态管理 
│ │ ├── tasks.store.ts # 任务状态 
│ │ └── config.store.ts # 配置状态 
│ ├── types/ # TypeScript 类型定义 
│ │ ├── index.ts # 类型导出 
│ │ ├── task.ts # 任务相关类型 
│ │ └── api.ts # API 相关类型 
│ ├── utils/ # 工具函数 
│ │ ├── DateTimeUtils.ts # 日期时间处理 
│ │ ├── DomUtils.ts # DOM 操作工具 
│ │ ├── FrontendDetector.ts # 前端环境检测 
│ │ ├── IconRegistry.ts # 图标注册 
│ │ ├── MessageUtils.ts # 消息提示 
│ │ ├── PluginConfigManager.ts # 配置管理 
│ │ ├── PluginInstance.ts # 插件实例管理 
│ │ ├── SettingsFactory.ts # 设置界面工厂 
│ │ └── TreeUtils.ts # 树形结构工具 
│ ├── i18n/ # 国际化 
│ │ ├── zh_CN.json # 中文 
│ │ └── en_US.json # 英文 
│ ├── assets/ # 静态资源 
│ │ ├── icons/ # SVG 图标 
│ │ └── index.scss # 全局样式 
│ ├── App.vue # 根组件 
│ └── main.ts # 插件入口 
├── plugin.json # 插件配置文件 
├── vite.config.ts # Vite 构建配置 
├── tsconfig.json # TypeScript 配置 
├── eslint.config.mjs # ESLint 配置 
└── package.json # 项目依赖
```

### 性能优化策略

1. **数据库层面**
    - 使用 SQL JOIN 一次性获取任务和文档标题
    - 参数化查询防止 SQL 注入
    - 只在必要时 flush 事务

2. **应用层面**
    - WebSocket 事件监听实现增量更新
    - 防抖（50ms）避免频繁刷新
    - 节流处理高频任务状态变更
    - 缓存已处理的 block ID（最多 1000 条，5 分钟过期）

3. **UI 层面**
    - Vue 响应式系统自动优化重渲染
    - Computed 缓存避免重复计算
    - Teleport 将弹窗挂载到 body 避免层级问题

## 🔧 配置选项

在 `设置` → `关于` → `插件列表` → `任务管理` → `配置` 中可以调整：

### 基础配置

- **默认进度分组** - 打开插件时默认显示的筛选视图（未完成/已完成/全部）
- **自动隐藏弹窗延迟** - 编辑弹窗自动隐藏的延迟时间（秒），设为 0 禁用自动隐藏
- **日期时间格式** - 自定义日期时间的显示格式

### 过滤设置

- **笔记本过滤** - 勾选的笔记本中的任务将不会显示
- **文档过滤** - 勾选的文档中的任务将不会显示

适用场景：

- 排除归档笔记本
- 排除模板文档
- 排除个人日记等非任务文档

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
# 检查代码
npm run lint
# 自动格式化
npm run format
```

## 🐛 常见问题

### Q: 任务没有自动同步？

A: 检查以下几点：

1. 确认任务格式正确：`- [ ] 任务内容`
2. 尝试手动点击刷新按钮
3. 查看浏览器控制台是否有错误信息
4. 重启思源笔记

### Q: 弹窗无法显示或位置不对？

A:

1. 确保使用的是最新版本的插件
2. 检查是否有其他插件冲突
3. 尝试调整窗口大小触发重新定位

### Q: 性能变慢怎么办？

A:

1. 使用过滤功能排除不需要的笔记本/文档
2. 定期清理已完成的任务
3. 如果任务数量超过 1000，建议联系开发者优化

### Q: 如何备份任务数据？

A: 任务数据存储在思源笔记的数据库中，正常备份思源工作空间即可。任务属性以块属性的形式存储，会随文档一起备份。

## 📄 许可证

本项目采用 AGPL-3.0 许可证开源。

## 🙏 致谢

- [思源笔记](https://b3log.org/siyuan/) - 强大的本地优先知识管理工具
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Pinia](https://pinia.vuejs.org/) - Vue 官方推荐的状态管理库
- [@floating-ui](https://floating-ui.com/) - 强大的浮动定位库

## 📮 反馈与支持

- **问题反馈**: [GitHub Issues](https://github.com/yifengjob/siyuan-plugin-task-manager/issues)
- **功能建议**: [GitHub Discussions](https://github.com/yifengjob/siyuan-plugin-task-manager/discussions)
- **作者主页**: [YiFeng](https://github.com/yifengjob)

---

**如果觉得有用，请给个 ⭐ Star 支持一下！**

如果您资金富余，请扫码赞赏支持我，这将激励我持续改进插件：

<div style="text-align: center;">
<img src="https://cdn.jsdelivr.net/gh/yifengjob/siyuan-plugin-concat-subdocs/wechat-reward.png" width="300px" height="auto" alt="微信赞赏码" style="box-shadow: 0 0 2px #aaaaaa;">
</div>

<div style="text-align: center; color: #888; font-size: 12px;">

Made with ❤️ by YiFeng | Powered by Vue 3 & TypeScript

</div>
