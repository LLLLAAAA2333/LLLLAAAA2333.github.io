---
title: "Git_command"
pubDate: 2025-10-12
categories: [study]
tags: [Git, Programming]
description: 'Git的常用命令及其功能介绍'
draft: false
---
## 常用命令
| 命令                                         | 功能                                    |
| ------------------------------------------ | ------------------------------------- |
| `git init`                                 | 初始化仓库                                 |
| `git clone [url]`                          | 克隆仓库                                  |
| `git config --global user.name "[name]"`   | 设置全局用户名                               |
| `git config --global user.email "[email]"` | 设置邮箱，最好与github的相同                     |
| `git add [file]`                           | 添加文件到暂存区                              |
| `git add .`                                | 提交所有文件到暂存区                            |
| `git commit -m "[message]"`                | 将暂存区的文件提交到本地仓库，并附上提交信息                |
| `git status`                               | 查看工作区和暂存区的状态                          |
| `git diff`                                 | 查看工作区与暂存区的差异                          |
| `git diff --staged`                        | 查看暂存区与上次提交的差异                         |
| `git log`                                  | 查看提交历史记录                              |
| `git log --oneline`                        | 以简洁的单行格式显示提交历史                        |
| `git branch`                               | 列出所有本地分支，当前分支会以 `*` 标记                |
| `git branch [branch-name]`                 | 创建一个新的分支                              |
| `git checkout [branch-name]`               | 切换到指定分支                               |
| `git checkout -b [branch-name]`            | 创建并立即切换到新的分支                          |
| `git merge [branch-name]`                  | 将指定分支的更改合并到当前分支                       |
| `git branch -d [branch-name]`              | 删除一个已经合并的分支                           |
| `git remote -v`                            | 查看已配置的远程仓库                            |
| `git remote add origin [url]`              | 添加一个新的远程仓库，并命名为 `origin`              |
| `git remote set-url origin [new-url]`      | 更改远程仓库                                |
| `git fetch [remote]`                       | 从远程仓库下载最新的对象和引用，但不会自动合并               |
| `git pull`                                 | 从远程仓库拉取最新更改并与本地分支合并                   |
| `git push [remote] [branch]`               | 将本地分支的提交推送到远程仓库                       |
| `git push -u origin main`                  | 将本地的 `main` 分支推送到 `origin` 远程，并建立跟踪关系 |
## 连接
### 配置ssh密钥
```cmd
ssh-keygen -t ed25519 -C "<comment>"
```
- `-t` 指定密钥类型为**ed25519**，这种类型似乎安全性更高，详见[SSH Key: Ed25519 vs RSA](https://security.stackexchange.com/questions/90077/ssh-key-ed25519-vs-rsa) 
- `-C` 为 注释信息，可以添加邮箱信息
之后复制密钥内容将其添加到git的托管平台，在个人设置的“SSH and GPG keys”或者类似的页面中点击“New SSH key” 或 “Add SSH key”粘贴密钥内容。
### 测试连接
Github测试连接如下
```cmd
ssh -T git@github.com
```
看到类似 "Hi [your-username]! You've successfully authenticated..."则说明连接成功
#### Connection timed out
国内直接访问github很多时候会超时，可以使用HTTPS的443端口，测试连接如下
```cmd
ssh -T -p 443 git@ssh.github.com
```
如果可以连接，则可以通过以下命令克隆存储库(添加`ssh://`)
```cmd
git clone ssh://git@ssh.github.com:443/YOUR-USERNAME/YOUR-REPOSITORY.git
```
或者通过编辑`.ssh/config`来修改所有连接
```text
Host github.com
    Hostname ssh.github.com
    Port 443
    User git
```

如果依然有问题，可以设置代理
```cmd
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy https://127.0.0.1:7890
```
取消代理使用`--unset`

## 参考链接
- [Git - 官方文档](https://git-scm.com/doc)
- [在 HTTPS 端口使用 SSH - GitHub 文档](https://docs.github.com/zh/authentication/troubleshooting-ssh/using-ssh-over-the-https-port) 