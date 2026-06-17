# WhiteCat 桌面小猫项目说明

WhiteCat 是一个轻量级桌面宠物应用。第一版面向自己和朋友使用，核心目标是把一只可爱的桌面小猫跑起来，并支持上传宠物照片生成本地宠物资产。

## 功能概览

- 桌面小猫：透明置顶窗口，小猫可以在桌面底部散步、跑步、玩球、睡觉。
- 平滑动画：动画引擎使用 `deltaTime` 驱动移动，并用锚点对齐帧，减少精灵图播放卡顿和脚底跳动。
- 本地资产：启动时优先读取本地生成的宠物资产，失败时回退到内置白猫。
- 生成向导：上传 3-8 张宠物照片，配置阿里云百炼 Qwen Image API Key，生成轻量桌宠资产。
- 失败兜底：如果 Qwen Image 调用失败，会用上传照片生成一个本地占位资产，方便继续测试桌宠交互。
- 聊天窗口：支持百炼 OpenAI-compatible 聊天接口；未配置 API Key 时使用本地兜底回复。
- 备忘提醒：本地一次性提醒，到时间后弹出系统通知或浏览器提示。

## 技术栈

- Electron：桌面透明窗口、置顶、鼠标穿透、本地资产读写。
- React + TypeScript：桌宠 UI、生成向导、聊天和提醒面板。
- Vite：开发服务器与构建。
- Canvas：精灵图播放。
- Framer Motion：桌宠拖拽和位置动画。
- Tailwind CSS：界面样式。

## 主要目录

- `electron/main.ts`：Electron 主进程，窗口配置、本地宠物资产 IPC。
- `electron/preload.ts`：向渲染层暴露安全的 Electron API。
- `src/App.tsx`：应用主入口，加载宠物资产并挂载桌宠、聊天、提醒和生成向导。
- `src/components/CatPet.tsx`：桌面小猫组件。
- `src/hooks/usePetEngine.ts`：Canvas 动画引擎。
- `src/components/PetGeneratorWizard.tsx`：上传照片和生成宠物资产的向导。
- `src/utils/qwenImageProvider.ts`：Qwen Image 调用适配层。
- `src/utils/spritePostProcessor.ts`：把生成图整理成精灵图和 manifest。
- `src/utils/petAssetStore.ts`：本地资产保存和读取。
- `src/config/builtinPetAsset.ts`：内置白猫 fallback 资产。
- `src/types/petAsset.ts`：宠物资产 manifest 类型定义。

## 启动方式

先进入项目目录：

```powershell
cd E:\self-study\whiteCat
```

如果依赖已经安装，直接启动：

```powershell
npm run dev
```

这个命令会启动 Vite，并通过 `vite-plugin-electron` 拉起 Electron 桌面窗口。启动后桌面上会出现透明窗口里的小猫。

如果依赖不存在或 `node_modules` 被删了，先安装依赖：

```powershell
npm install
```

然后再执行：

```powershell
npm run dev
```

## 使用生成向导

1. 启动应用后，点击右下角的闪光按钮，或点击小猫后在菜单里选择“生成”。
2. 上传 3-8 张宠物照片，支持 JPG、PNG、WebP。
3. 填写阿里云百炼 API Key。
4. 保持默认 Base URL 或按你的百炼工作空间改成对应地址。
5. 选择模型：
   - `qwen-image-2.0-pro`
   - `wan2.7-image-pro`
6. 选择风格，点击“生成桌宠资产”。

生成成功后，小猫会立即替换为新的本地资产。资产会保存到 Electron 的应用数据目录，下次启动会自动读取。

## 阿里云百炼配置说明

当前项目为了方便自己和朋友使用，API Key 暂存在本地，不经过后端代理。请不要把自己的 Key 发给不可信的人。

默认图像生成配置：

```text
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
Model: qwen-image-2.0-pro
```

如果你使用的是阿里云百炼工作空间专属 Endpoint，需要在生成向导里把 Base URL 改成你控制台提供的地址。

聊天模型默认配置在 `src/utils/llm.ts` 中：

```text
Base URL: https://dashscope.aliyuncs.com/compatible-mode/v1
Model: qwen3.7-plus
```

## 常用命令

开发启动：

```powershell
npm run dev
```

类型检查：

```powershell
npx tsc -b
```

代码检查：

```powershell
npm run lint
```

构建前端和 Electron 产物：

```powershell
npx vite build
```

完整打包：

```powershell
npm run build
```

注意：完整打包会调用 `electron-builder`，可能需要下载 Electron 二进制到用户缓存目录。如果遇到缓存目录权限或网络问题，需要放开权限或提前准备 Electron 缓存。

## 当前限制

- Qwen Image 接口目前是轻量适配，真实百炼图像接口如果使用异步任务或工作空间专属 URL，需要在 `src/utils/qwenImageProvider.ts` 里调整请求格式。
- 第一版生成的精灵图偏“可测试、轻量占位”，不是最终商业级动画资产。
- 没有账号、支付、后端限流、云端存储和内容审核。
- API Key 存在本地，适合自己和朋友小范围测试，不适合公开发布。
- macOS 的置顶、权限、通知行为需要真机验证。

## 后续建议

- 把 Qwen Image 的真实返回格式接稳，支持异步任务轮询。
- 给 sprite 后处理加入透明背景抠图、自动 bbox、脚底锚点检测。
- 增加“逗猫棒模式”，让鼠标变成玩具并吸引小猫追随。
- 增加本地资产管理，可以切换多只宠物。
- 准备公开发布前，再补后端代理、API Key 隐藏、限流和费用控制。
