---
title: windows转mac注意事项
pubDate: 2026-03-14
categories:
  - life
tags:
  - Life
---

# Windows to Mac 迁移指南

> 核心适应点：**Command (⌘)** 键在 macOS 中很大程度上代替了 Windows 中的 Ctrl 键。

## 1. 快捷键

### 1.1 基础编辑与文件操作
- **复制**：`Command + C`
- **粘贴**：`Command + V`
- **全选**：`Command + A`
- **保存**：`Command + S`
- **撤销**：`Command + Z`
- **剪切（移动）**：Mac 没有直接的剪切快捷键，逻辑是"先复制，再移动"
  - 先按 `Command + C` 复制
  - 到目标位置后按 **`Command + Option + V`** 完成文件移动
- **访达显示隐藏文件**：`Command + Shift + .`

### 1.2 系统与窗口管理
- **彻底退出软件**：`Command + Q`
  - 注意：点击窗口左上角的红色按钮只是关闭窗口，软件仍在后台运行
- **聚焦搜索 (Spotlight)**：`Command + 空格键`
  - Mac 最强大的功能之一，可直接输入软件名打开应用、搜索文件、查找照片、计算数学题等
- **全局俯瞰窗口 (Mission Control)**：`Control + 上箭头`
  - 让所有打开的窗口瞬间平铺在屏幕上
- **查看当前应用窗口**：`Control + 下箭头`
  - 只平铺显示当前正在使用的软件的所有窗口

### 1.3 截图与录屏
Mac 自带的截图功能非常强大：
- **全屏截图**：`Shift + Command + 3`
- **区域截图**：`Shift + Command + 4`（光标变成十字，框选需要的区域）
- **录屏或高级截图**：`Shift + Command + 5`（调出菜单，选择录制屏幕或自定义保存位置）

### 1.4 输入法切换
- **中英文切换**：短按键盘上的 **"中/英"** 键
- **大小写切换**：长按 "中/英" 键，直到按键上的绿灯亮起，切换为大写锁定模式

## 2. 工具与应用

### 2.1 网络代理
- **选择**：Clash Verge（推荐）
  - ClashX 只能用 GUI，不能接管终端
  - Clash Verge 基于 Tauri，可正常使用命令行接管终端
  - 资源：[clash-verge-rev/clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev)

### 2.2 启动器 (Spotlight 替代)
- **工具**：Raycast
  - 类似 Windows 的 PowerToys
  - 功能：自定义热键、丰富的插件市场
  - **#todo** 研究 Raycast 插件市场和自定义功能

### 2.3 硬件体验
- **屏幕管理**：Better Display
  - 当前使用：连接时防止睡眠功能
- **鼠标滚轮**：Moss
  - Mac 鼠标滚轮逻辑为 Touch Bar 服务，容易不流畅
  - Moss 保证滚动丝滑度

### 2.4 终端环境
已安装的核心工具：
- **终端**：Ghostty
- **目录跳转**：zoxide
- **提示符主题**：starship
- **文件浏览器**：yazi
- **zsh 插件**：suggestion, completion

### 2.5 文件清理
- **Mole**：终端工具
- **Lemon**：鹅厂推出的瘦身应用

## 3. 故障排查与配置

### 3.1 代理与 Apple 服务冲突
**问题**：代理工具接管所有 Apple 相关服务，导致苹果音乐不可用

**解决方案**：在代理配置中添加 `prepend-rules`，使 Apple 服务走直连

```yaml
prepend-rules:
  # 1. 强行将音乐相关域名置顶并直连
  - DOMAIN,itunes.apple.com,DIRECT
  - DOMAIN-SUFFIX,music.apple.com,DIRECT
  - DOMAIN-SUFFIX,mzstatic.com,DIRECT
  - DOMAIN-SUFFIX,aaplimg.com,DIRECT
  - DOMAIN-SUFFIX,apple-dns.net,DIRECT
  - DOMAIN-SUFFIX,cdn-apple.com,DIRECT
  
  # 2. 解决所有 Apple 服务的潜在冲突（推荐）
  - DOMAIN-SUFFIX,apple.com,DIRECT
  - DOMAIN-SUFFIX,icloud.com,DIRECT
  
  # 3. 针对 TUN 模式的 IP 段直连优化
  - IP-CIDR,17.0.0.0/8,DIRECT,no-resolve
```

### 3.2 环境变量
**#todo** 记录遇到的环境变量问题及解决方案