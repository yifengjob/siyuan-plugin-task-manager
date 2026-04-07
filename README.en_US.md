# Task Manager

<div style="text-align: center;">

![License](https://img.shields.io/github/license/yifengjob/siyuan-plugin-task-manager)
![Version](https://img.shields.io/github/v/release/yifengjob/siyuan-plugin-task-manager)
![Stars](https://img.shields.io/github/stars/yifengjob/siyuan-plugin-task-manager?style=social)

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
- 📱 **Cross-Platform** - Supports desktop, mobile, and browser versions

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
npm dev
# Build for production
npm build
# Release new version
npm release:patch # Patch version 
npm release:minor # Minor version 
npm release:major # Major version
```

## 📝 User Guide

### Basic Usage

1. **Create a Task**

- Create a task block using `- [ ] Task content` format in any document
- The task will automatically appear in the Task Manager panel

2. **View Tasks**

- Click the task icon (📋) in the right sidebar to open the task panel
- Tasks are grouped by document

3. **Edit a Task**

- Hover over a task item
- Click on the task content to pop up the details dialog
- Fill in start time, planned due date, priority, and other information

4. **Complete a Task**

- Check the checkbox before the task
- System automatically records the actual completion date
- Task status updates in real-time

### Task Attributes

| Attribute   | Description                            | Example                |
|-------------|----------------------------------------|------------------------|
| Start Time  | Task start date                        | `2024-01-01`           |
| Planned Due | Expected completion date               | `2024-01-15`           |
| Actual Due  | Actual completion date (auto-recorded) | `2024-01-14`           |
| Priority    | Task importance level                  | High/Medium/Normal/Low |
| Notes       | Additional comments                    | Free text              |

### Filter & Statistics

- **All** - Display all tasks
- **Incomplete** - Show only in-progress tasks (default)
- **Completed** - Show only completed tasks
- **Refresh Button** - Manually refresh task list
- **Bottom Status Bar** - Real-time task statistics

## ⚙️ Technical Architecture

### Tech Stack

- **Frontend Framework**: Vue 3 + TypeScript
- **Build Tool**: Vite 8
- **State Management**: Pinia
- **Styling**: SCSS
- **SDK**: Siyuan SDK

### Core Features

- ✅ Direct database reading for optimal performance
- ✅ Intelligent parsing of ial field in blocks table
- ✅ SQL JOIN optimization to reduce API calls
- ✅ Event-driven architecture for real-time user interaction
- ✅ Component-based design for easy extension and maintenance

### Project Structure

```
siyuan-plugin-task-manager/ 
├── src/ 
│ ├── components/ # Vue Components 
│ │ ├── Sidebar.vue # Sidebar 
│ │ ├── TaskItem.vue # Task Item 
│ │ ├── TaskForm.vue # Task Form 
│ │ └── TaskPopover.vue # Task Popover 
│ ├── services/ # Services 
│ │ ├── ApiService.ts # API Service 
│ │ └── TaskService.ts # Task Service 
│ ├── stores/ # State Management 
│ │ └── tasks.store.ts # Task Store 
│ ├── types/ # Type Definitions 
│ ├── utils/ # Utilities 
│ ├── assets/ # Static Assets 
│ ├── i18n/ # Internationalization 
│ └── main.ts # Entry Point 
├── plugin.json # Plugin Configuration 
└── vite.config.ts # Build Configuration

```

## 🔧 Configuration

Adjust settings in `Settings` → `About` → `Plugin List` → `Task Manager` → `Configure`:

- **Show Completed Tasks** - Control whether to display completed tasks in the list

## 🤝 Contributing

Issues and Pull Requests are welcome!

### Development Guidelines

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

This project uses ESLint + Prettier for consistent code style:

```bash
# Lint code
npm lint
# Format code
npm format
```

## 📄 License

This project is open-sourced under the AGPL-3.0 license.

## 🙏 Acknowledgments

- [Siyuan Notes](https://b3log.org/siyuan/) - Powerful local-first knowledge management tool
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Vite](https://vitejs.dev/) - Next generation frontend build tool

## 📮 Feedback & Support

- **Bug Reports**: [GitHub Issues](https://github.com/yifengjob/siyuan-plugin-task-manager/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/yifengjob/siyuan-plugin-task-manager/discussions)
- **Author Profile**: [YiFeng](https://github.com/yifengjob)

---

<div style="text-align: center;">

**If you find this useful, please give us a ⭐ Star! If you're feeling generous, please scan the QR code below to
support me.**


<img src="https://cdn.jsdelivr.net/gh/yifengjob/siyuan-plugin-concat-subdocs/wechat-reward.png"  alt="WeChat Reward Code" style="height: auto;box-shadow: 0 0 2px #aaaaaa; max-width: 300px;">

</div>
