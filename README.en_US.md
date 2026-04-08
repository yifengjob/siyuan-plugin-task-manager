# Task Manager

<div style="text-align: center;">

![License](https://img.shields.io/github/license/yifengjob/siyuan-plugin-task-manager)
![Version](https://img.shields.io/github/v/release/yifengjob/siyuan-plugin-task-manager)
![Stars](https://img.shields.io/github/stars/yifengjob/siyuan-plugin-task-manager?style=social)
![Downloads](https://img.shields.io/github/downloads/yifengjob/siyuan-plugin-task-manager/total)

**Siyuan Notes Plugin | Centralize Management for All Your Tasks**

</div>

---

## 📖 Introduction

Task Manager is a plugin for Siyuan Notes, designed to centrally manage tasks scattered throughout your entire
workspace. It helps you easily track and manage to-do items by adding rich metadata to each task, multiplying your work
efficiency.

### ✨ Key Features

- 📋 **Centralized Management** - Automatically aggregates all task blocks across the workspace
- 🏷️ **Rich Attributes** - Supports start time, planned completion, actual completion, priority, notes, and more
- 🎯 **Smart Filtering** - Quick filter by completion status (All/Completed/Incomplete)
- 📊 **Real-time Statistics** - Status bar shows total, in-progress, and completed task counts
- 🔔 **Auto Sync** - Listens to editor changes and updates task status in real-time
- 🎨 **Beautiful UI** - Modern interface design with automatic light/dark theme adaptation
- 📱 **Cross-Platform** - Supports desktop, browser versions
- ⚡ **High Performance** - Direct database access with optimized SQL queries and incremental updates
- 🔒 **Secure & Reliable** - Parameterized SQL queries prevent injection attacks

## 🚀 Quick Start

### Installation

#### Method 1: Install via Siyuan Marketplace (Recommended)

1. Open Siyuan Notes
2. Click top menu `☰` → `Settings`
3. Select `About` → `Plugin Marketplace`
4. Search for `Task Manager` or `任务管理`
5. Click install and enable

#### Method 2: Manual Installation

1. Download the latest `.zip` file
   from [GitHub Releases](https://github.com/yifengjob/siyuan-plugin-task-manager/releases)
2. Extract to `data/plugins/` directory in your Siyuan Notes folder
3. Restart Siyuan Notes
4. Enable the plugin in `Settings` → `About` → `Plugin List`

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yifengjob/siyuan-plugin-task-manager.git
# Enter project directory
cd siyuan-plugin-task-manager
# Install dependencies
npm install
# Configure Siyuan workspace path
cp .env.example .env
# Edit .env file and set VITE_SIYUAN_WORKSPACE_PATH to your actual path
# Development mode (hot reload)
npm run dev
# Build for production
npm run build
# Lint and format code
npm run lint # Check code style 
npm run format # Auto-format code
# Release new version
npm run release:patch # Patch version (1.0.0 -> 1.0.1) 
npm run release:minor # Minor version (1.0.0 -> 1.1.0) 
npm run release:major # Major version (1.0.0 -> 2.0.0)
```

## 📝 User Guide

### Basic Usage

1. **Create a Task**

- Create a task block using `- [ ] Task content` format in any document
- The task will automatically appear in the Task Manager panel

2. **View Tasks**

- Click the task icon (📋) in the right sidebar to open the task panel
- Tasks are grouped by document
- Use the top filter to switch views (Incomplete/Completed/All)

3. **Edit a Task**

- Hover over a task item
- Click on the task content to open the details dialog
- Fill in start time, planned due date, priority, notes, and other information
- Click "Save" button to apply changes

4. **Complete a Task**

- Check the checkbox before the task
- System automatically records the actual completion date
- Task status updates in real-time and syncs to database

5. **Quick Navigation**

- Click the task title to jump directly to the original document location
- Supports opening the task document in a new window

### Task Attributes

| Attribute   | Description                            | Example                | Required |
|-------------|----------------------------------------|------------------------|----------|
| Start Time  | Task start date                        | `2024-01-01`           | No       |
| Planned Due | Expected completion date               | `2024-01-15`           | No       |
| Actual Due  | Actual completion date (auto-recorded) | `2024-01-14 10:30:00`  | Auto     |
| Priority    | Task importance level                  | High/Medium/Normal/Low | No       |
| Notes       | Additional comments                    | Free text              | No       |

### Filter & Statistics

- **Incomplete** - Show only in-progress tasks (default view)
- **Completed** - Show only completed tasks
- **All** - Display all tasks
- **Refresh Button** - Manually refresh task list (usually auto-sync makes this unnecessary)
- **Bottom Status Bar** - Real-time task statistics (In Progress/Completed/Total)

### Advanced Features

#### Task Filtering

In plugin configuration, you can set:

- **Notebook Filtering** - Exclude tasks from specific notebooks
- **Document Filtering** - Exclude tasks from specific documents

Use cases:

- Archive notebooks don't need to show tasks
- Tasks in template documents should not appear in the list

#### Custom Date Format

Supports custom date-time display formats. Refer to [date-fns format documentation](https://date-fns.org/docs/format).

Common formats:

- `yyyy-MM-dd` - 2024-01-15
- `yyyy/MM/dd HH:mm` - 2024/01/15 10:30
- `MM-dd HH:mm:ss` - 01-15 10:30:00

## ⚙️ Technical Architecture

### Tech Stack

- **Frontend Framework**: Vue 3.5 + TypeScript 6.0
- **Build Tool**: Vite 8.0 + Rolldown
- **State Management**: Pinia 3.0
- **Styling**: SCSS + CSS Variables
- **Floating UI**: @floating-ui/dom
- **Date Picker**: @vuepic/vue-datepicker
- **SDK**: Siyuan SDK 1.1.9
- **Code Quality**: ESLint + Prettier + TypeScript

### Core Features

- ✅ **High-performance Database Queries** - Direct SQLite database reads, avoiding API overhead
- ✅ **Smart SQL Optimization** - JOIN queries reduce request count, parameterization prevents injection
- ✅ **Incremental Update Mechanism** - WebSocket event listeners update only changed tasks
- ✅ **Optimistic Update Strategy** - UI responds immediately, background sync, auto-rollback on failure
- ✅ **Debounce & Throttle** - High-frequency events automatically optimized to avoid unnecessary refreshes
- ✅ **Event-driven Architecture** - Real-time response to user operations and editor changes
- ✅ **Component-based Design** - Clear component layering, easy to extend and maintain
- ✅ **Type Safety** - Complete TypeScript type definitions with compile-time checks

### Project Structure

```
siyuan-plugin-task-manager/ 
├── src/ 
│ ├── components/ # Vue Components 
│ │ ├── Sidebar.vue # Sidebar main panel 
│ │ ├── TaskItem.vue # Single task item 
│ │ ├── TaskPopover.vue # Task edit popover 
│ │ ├── DateTimePickerField.vue # Date-time picker 
│ │ └── TreeItem.vue # Tree selector item 
│ ├── services/ # Services 
│ │ ├── ApiService.ts # API wrapper service 
│ │ └── TaskService.ts # Task business logic 
│ ├── stores/ # State Management 
│ │ ├── tasks.store.ts # Task state 
│ │ └── config.store.ts # Configuration state 
│ ├── types/ # TypeScript Type Definitions 
│ │ ├── index.ts # Type exports 
│ │ ├── task.ts # Task-related types 
│ │ └── api.ts # API-related types 
│ ├── utils/ # Utilities 
│ │ ├── DateTimeUtils.ts # Date-time handling 
│ │ ├── DomUtils.ts # DOM operation utilities 
│ │ ├── FrontendDetector.ts # Frontend environment detection 
│ │ ├── IconRegistry.ts # Icon registration 
│ │ ├── MessageUtils.ts # Message notifications 
│ │ ├── PluginConfigManager.ts # Configuration management 
│ │ ├── PluginInstance.ts # Plugin instance management 
│ │ ├── SettingsFactory.ts # Settings UI factory 
│ │ └── TreeUtils.ts # Tree structure utilities 
│ ├── i18n/ # Internationalization 
│ │ ├── zh_CN.json # Chinese 
│ │ └── en_US.json # English 
│ ├── assets/ # Static Assets 
│ │ ├── icons/ # SVG icons 
│ │ └── index.scss # Global styles 
│ ├── App.vue # Root component 
│ └── main.ts # Plugin entry point 
├── plugin.json # Plugin configuration 
├── vite.config.ts # Vite build configuration 
├── tsconfig.json # TypeScript configuration 
├── eslint.config.mjs # ESLint configuration 
└── package.json # Project dependencies
```

### Performance Optimization Strategies

1. **Database Level**
    - Use SQL JOIN to fetch tasks and document titles in one query
    - Parameterized queries prevent SQL injection
    - Flush transactions only when necessary

2. **Application Level**
    - WebSocket event listening for incremental updates
    - Debounce (50ms) to avoid frequent refreshes
    - Throttle high-frequency task status changes
    - Cache processed block IDs (max 1000 entries, 5-minute expiry)

3. **UI Level**
    - Vue reactivity system automatically optimizes re-renders
    - Computed caching avoids redundant calculations
    - Teleport mounts popovers to body to avoid z-index issues
    - Virtual scrolling (future optimization direction)

## 🔧 Configuration

Adjust settings in `Settings` → `About` → `Plugin List` → `Task Manager` → `Configure`:

### Basic Configuration

- **Default Progress Group** - Default filter view when opening the plugin (Incomplete/Completed/All)
- **Auto-hide Popover Delay** - Delay time for popover auto-hide (seconds), set to 0 to disable
- **Date-Time Format** - Custom date-time display format

### Filter Settings

- **Notebook Filtering** - Tasks in checked notebooks will not be displayed
- **Document Filtering** - Tasks in checked documents will not be displayed

Use cases:

- Exclude archive notebooks
- Exclude template documents
- Exclude non-task documents like personal diaries

## 🤝 Contributing

Issues and Pull Requests are welcome!

### Development Guidelines

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

This project uses ESLint + Prettier for consistent code style:

```bash
# Lint code
npm run lint
# Format code
npm run format
```

## 🐛 FAQ

### Q: Tasks are not syncing automatically?

A: Check the following:

1. Confirm task format is correct: `- [ ] Task content`
2. Try manually clicking the refresh button
3. Check browser console for error messages
4. Restart Siyuan Notes

### Q: Popover doesn't display or is positioned incorrectly?

A:

1. Make sure you're using the latest version of the plugin
2. Check for conflicts with other plugins
3. Try resizing the window to trigger repositioning

### Q: Performance is slow?

A:

1. Use filtering to exclude unnecessary notebooks/documents
2. Regularly clean up completed tasks
3. If you have more than 1000 tasks, contact the developer for optimization

### Q: How to backup task data?

A: Task data is stored in Siyuan Notes' database. Simply backup your Siyuan workspace as usual. Task attributes are
stored as block attributes and will be backed up with documents.

## 📄 License

This project is open-sourced under the AGPL-3.0 license.

## 🙏 Acknowledgments

- [Siyuan Notes](https://b3log.org/siyuan/) - Powerful local-first knowledge management tool
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Vite](https://vitejs.dev/) - Next generation frontend build tool
- [Pinia](https://pinia.vuejs.org/) - Official recommended state management for Vue
- [@floating-ui](https://floating-ui.com/) - Powerful floating positioning library

## 📮 Feedback & Support

- **Bug Reports**: [GitHub Issues](https://github.com/yifengjob/siyuan-plugin-task-manager/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/yifengjob/siyuan-plugin-task-manager/discussions)
- **Author Profile**: [YiFeng](https://github.com/yifengjob)

---

**If you find this useful, please give us a ⭐ Star!**

If you're feeling generous, please scan the QR code below to support me. This will motivate me to continuously improve
the plugin:

<div style="text-align: center;">
<img src="https://cdn.jsdelivr.net/gh/yifengjob/siyuan-plugin-concat-subdocs/wechat-reward.png" alt="WeChat Reward Code" width="300px" height="auto" style="box-shadow: 0 0 2px #aaaaaa;">
</div>

<div style="text-align: center; color: #888; font-size: 12px;">

Made with ❤️ by YiFeng | Powered by Vue 3 & TypeScript

</div>
