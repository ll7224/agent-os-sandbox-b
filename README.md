# agent-os-sandbox-b

Agent OS 任务中心端到端验收用的沙箱仓库 B，用来验证 Issue 收录、评分、来源授权与产品澄清。

预置三类 Issue：

1. 高分但需求含糊（维护者创建）——应进入产品拆解 / 澄清；
2. 低分（维护者创建）——应留在建议区；
3. 由非维护者创建——即使高分，也只能进入建议区等人工批准。

## sandbox-a /health 客户端

`src/healthClient.js` 导出 `getHealth(baseUrl, { fetch?, timeoutMs? })`，请求 `GET {baseUrl}/health`，返回 `{ ok, uptime }`。

响应格式按 sandbox-a 正式交付（PR #7）：`ok` 为布尔值（恒为 `true`），`uptime` 为非负整数、单位秒，示例 `{"ok":true,"uptime":123}`。

出错时抛出 `HealthClientError`，`code` 为：`REQUEST_FAILED`（网络错误/超时）、`HTTP_STATUS`（非 2xx，附 `status`）、`INVALID_JSON`、`MISSING_FIELD`、`INVALID_FIELD`。

运行测试：`npm test`（mock fetch，不依赖真实服务）。
