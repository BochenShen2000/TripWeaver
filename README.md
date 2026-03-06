# AI 活动发起器 Demo（全栈）

这是一个最小全栈版本的 Demo，支持：

- 输入活动意图（人数、预算、时间、兴趣、区域）
- 后端生成结构化路线方案
- 后端校验每个路线点是否为真实地点（Nominatim 地理编码）
- 一键发起活动并生成分享链接
- 记录事件埋点（输入、生成、发起、分享）
- 交互地图显示编号标注与路线连线（每站可跳转 Google Maps）

## 本地运行

```bash
npm install
export GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
npm run start
```

打开 [http://localhost:3000](http://localhost:3000)。

## API

- `GET /api/health`
- `GET /api/maps-config`
- `GET /api/events`
- `POST /api/events`
- `POST /api/generate-plan`
- `POST /api/create-activity`
- `GET /api/activities/:code`

## 技术栈

- Frontend: Vanilla HTML/CSS/JS
- Backend: Node.js + Express
- Storage: 本地 JSON 文件（运行时在 `data/` 下自动创建）
- Map Rendering: Google Maps JavaScript API
- Place Validation: OpenStreetMap Nominatim

## Google Maps 说明

- 每个点位都带有 Google Maps 跳转链接，点击可直接打开导航或搜索。
- 页面地图使用 Google Maps JavaScript API，请确保 key 已启用 Maps JavaScript API 且已绑定 billing。

若页面提示 `This page didn't load Google Maps correctly`，按这个顺序检查：
1. 在 Google Cloud 启用 `Maps JavaScript API`。
2. 确认项目已绑定 Billing。
3. API key 限制里添加 `HTTP referrer`，例如 `http://localhost:3000/*`。
4. `API restrictions` 里允许 `Maps JavaScript API`。
