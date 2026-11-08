# agent-os-sandbox-b

Agent OS 任务中心端到端验收用的沙箱仓库 B，用来验证 Issue 收录、评分、来源授权与产品澄清。

预置三类 Issue：

1. 高分但需求含糊（维护者创建）——应进入产品拆解 / 澄清；
2. 低分（维护者创建）——应留在建议区；
3. 由非维护者创建——即使高分，也只能进入建议区等人工批准。

## 本地开发

本仓库目前只有文档，没有 `package.json`、`.nvmrc`、`.node-version` 等任何 Node 相关配置，也没有源代码和测试，因此：

- **Node 版本**：仓库没有声明版本要求，本地开发不依赖 Node。仅供参考：验证本节内容时使用的环境为 Node v22.23.4 / npm 10.9.9（来源：执行环境中 `node -v`、`npm -v` 的输出，并非仓库配置）。
- **安装依赖**：无需安装。仓库没有依赖清单；在仓库根目录执行 `npm install` 不会安装任何包，反而会生成一个空的 `package-lock.json`，请不要执行或提交它。
- **运行测试**：目前没有测试。仓库没有 `package.json`，也就没有 `scripts.test`；执行 `npm test` 会报错 `npm error enoent`（找不到 `package.json`），这是预期行为。

日常修改只需克隆仓库后直接编辑 `README.md` 并提交即可。日后若加入 `package.json`，请以其中的 `engines` 和 `scripts` 为准更新本节。

## 目录结构

```
.
└── README.md   # 仓库说明：沙箱仓库 B 的用途、预置 Issue 类型、本地开发方式与目录结构
```

仓库根目录下除 Git 元数据（`.git`）外只有 `README.md` 一个文件，没有子目录。
