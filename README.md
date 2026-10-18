# ProofVault — AI Record Integrity & Archival Governance Platform

黑客马拉松 MVP 前端（React 18 + Vite + Tailwind CSS 3 + lucide-react），全部数据为虚构 Mock。

## 运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173

## 目录

- `src/data.js` — 3 份高风险 AI 记录样本、审核人、合规清单、MCP 连接器等 Mock 数据
- `src/lib.js` — 溯源评分、版本号、SHA-256、逐词对比等纯函数
- `src/components/Header.jsx` — 品牌栏 + 4 个指标卡 + 接入按钮
- `src/components/Queue.jsx` — 左侧记录队列（搜索、风险筛选）
- `src/components/Viewer.jsx` — 中间标注视图 + 版本对比
- `src/components/RightPanel.jsx` — 审计解析卡 / 溯源图谱 + C2PA / 审核台 + 审计日志
- `src/components/Modals.jsx` — 接入弹窗、退回弹窗、封存凭证弹窗

## 3 分钟演示路线

1. 选中「Clinical AI Ambient Scribe Note」，点红色高亮「metoprolol 500 mg」→ 右侧弹出审计卡，讲 ASR 听写错误。
2. 点「Apply suggested fix」→ 段落变绿，顶部「已拦截」和溯源评分实时上涨。
3. 点橙色偏见段落 →「Request human review」→ 再点「SME: keep original」或修正，演示人在回路。
4. 打开「Version Diff」→ 对比 v1.0 AI 原稿与 v1.1 人工修订稿（下拉框可切换成「你的实时修改」）。
5. 切到「Provenance Graph」，点 C3 节点 → 显示「信源缺失」链路和 C2PA 元数据。
6. 切到「IM Sign-off」，勾选 4 项清单 →「Approve & Seal」→ 弹出带真实 SHA-256 哈希与审核人签名的封存凭证，可下载 JSON。
7. 右上角「Upload / Ingest AI Record」演示 MCP / API 接入，新记录自动进入队列。
