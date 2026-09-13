# QuantGym

面向心算与数量推理的浏览器练习工具，使用 React、TypeScript 和 Vite 构建。此独立版本可部署到 GitHub Pages，练习时无需账号、后端服务或数据库服务器。

## 功能

- 冲刺、自适应、挑战、自由练习，以及历史记录、成绩统计和错题复习。
- 心算题型可多选。`Mixed practice` 与单独题型互斥；选择 Mixed 会清除单独题型的勾选，取消最后一个单独题型会恢复 Mixed。
- 可选择填空或选择题作答；数列题始终使用选择题，包括混合训练和错题复习中的数列题。
- 中文技巧课采用“看示范 → 跟着做 → 独立练习”的流程，并保留三位数乘法学习阶梯：三位数 × 一位数、三位数 × 两位数、接近整百的乘法、一般三位数 × 三位数。

## 本地运行

需要 **Node.js 22.13.0 或更新版本**、**pnpm 11.19.0**。在项目根目录执行：

```bash
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

打开终端显示的本地地址。检查与构建命令：

```bash
pnpm test
pnpm build
pnpm preview
```

`pnpm build` 先进行 TypeScript 检查，再生成 `dist/`。通过开发或预览服务器打开页面；资源路径使用相对路径，可用于 `/quantgym/` 这样的仓库子路径。

## 部署到 GitHub Pages

1. 在 GitHub 的 `Ye0330` 账号下创建名为 `QuantGym` 的 **Public** 空仓库，先不添加 README、`.gitignore` 或许可证。
2. 将本项目全部源文件提交到该仓库的 `main` 分支，包括 `.github/workflows/pages.yml`、`package.json` 和 `pnpm-lock.yaml`。不要提交 `node_modules/`、个人 JSON 备份或本地浏览器数据。
3. 在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。项目已包含工作流，无需另建模板。设置入口见 [GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。
4. 在 **Actions → Deploy QuantGym to GitHub Pages** 中运行工作流；之后每次向 `main` 推送都会自动部署。如果首次推送发生在 Pages 配置之前，配置完成后重新运行工作流。
5. 工作流成功后，使用部署结果给出的地址；该仓库的默认地址为 [https://Ye0330.github.io/QuantGym/](https://Ye0330.github.io/QuantGym/)。

若从不含 Git 历史的源码包开始，可在项目根目录执行以下命令完成第 2 步；需要本机 Git 已能登录 GitHub：

```bash
git init -b main
git add .
git commit -m "Add standalone QuantGym"
git remote add origin https://github.com/Ye0330/QuantGym.git
git push -u origin main
```

部署工作流使用 Node.js 22 和项目声明的 pnpm 版本，依次安装锁定依赖、运行测试、构建、上传 `dist/`，最后部署到 `github-pages` 环境。部署任务使用 `pages: write` 和 `id-token: write`，由 Actions 提供运行令牌，无需配置个人访问令牌。工作流要求见 [GitHub 自定义 Pages 工作流说明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 数据保存与备份

练习记录保存在当前浏览器的 **IndexedDB**，训练偏好保存在 **localStorage**。应用没有云端同步。存储按网站来源和部署路径区分，例如 `/quantgym/` 与另一个仓库路径各有独立记录；本地开发地址和正式网站也互不共享数据。

- 历史列表与统计使用最近 **100** 次练习；此显示限制不会删除更早的已存记录。
- 页面中的数据备份功能可导出、导入 QuantGym JSON 文件。正常导出包含**全部已存记录及尚未成功保存的结果**，不限于列表中的 100 次。单份备份最多 **10,000** 次练习、**50 MiB**；超限会报错，原记录保持不变。
- 导入会合并记录：同一 UUID 且内容相同的记录跳过；同一 UUID 但内容冲突，或文件中有无效记录时，整次导入被拒绝，现有记录保留。请先结束正在进行的练习再导入。
- 备份包含有效的训练偏好，但导入**保留当前训练偏好**，仅合并练习记录。
- 浏览器存储读取失败时，页面提供恢复导出；它只包含当前打开页面可访问的记录，可能缺少更早的数据，不能视为完整备份。

记录只属于当前设备、浏览器和浏览器配置文件。清除网站数据、更换浏览器或设备会使记录不可见；无痕窗口关闭后数据可能被清除。可通过 JSON 导出、导入在设备间迁移，清理浏览器数据前请先保存备份。

GitHub Pages 与原 Site 使用不同来源，无法自动读取原 Site 的云端历史。迁移旧记录需要先从原站取得兼容的 QuantGym JSON 备份，再在此版本导入。
