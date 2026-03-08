# AI 活动发起器 Demo（全栈）

这是一个最小全栈版本的 Demo，支持：

- 输入活动意图（人数、预算、时间、兴趣、区域）
- 后端生成结构化路线方案
- 后端校验每个路线点是否为真实地点（Nominatim 地理编码）
- 一键发起活动并生成分享链接
- 记录事件埋点（输入、生成、发起、分享）
- 交互地图显示编号标注与路线连线（每站可跳转 Google Maps）
- 实时地点搜索：OpenAI 生成查询 + Google Places 返回真实门店
- 返回完整路径：Google Directions 生成整段路线轨迹与时长/距离
- 注册/登录系统（JWT，支持用户名/邮箱密码登录、验证码登录、第三方快捷登录 mock）
- IM 实时聊天（群聊 + 好友私聊，Socket.IO）
- 聊天中心（WhatsApp 风格好友列表 + 群聊列表 + 会话窗口）
- 兴趣社群（Meetup 风格：按兴趣/城市建群、加入）
- 活动发现与报名（Eventbrite 风格：活动发布、RSVP、票务链接）
- 灵感内容流（小红书风格：攻略内容发布、点赞、同款路线生成）
- 本地商户发现（点评/美团风格：真实地点搜索、评分、门票/官网链接）
- 协同旅行与AA分账（Wanderlog 风格：多人行程项、预订导入、费用结算建议）
- 跨国旅行找搭子（发布行程、筛选、加入）
- 跨国旅行路线生成（按目的地城市实时搜索真实门店并生成当地路径）
- 根据文档逐个点生成路线（按文档顺序抽取地点并连成路径）
- 根据图片逐个点生成路线（识别图片中的地点顺序并连成路径）
- 文档路线交叉验证（同名地点按国家/城市/路径连续性做歧义消解）
- 每个路线点自动补充地点介绍（`intro`）、门票判断（`ticketing`）和购票链接（`booking`）
- 每一站包含日期+时间（方便多日路线与分享）
- 机票/酒店/门票快捷入口（Google Flights / Booking / Klook）
- 校园认证 + 校园群聊（仅认证用户）
- 多方需求总结：从群聊内容提炼意图并直接生成推荐路线
- 官方信息聚合 + 开放接口（第三方平台可发布/拉取）
- MOOK 攻略数据（参考小红书/Klook常见编排，支持多日行程）

## 本地运行

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
export OPENAI_API_KEY="your_openai_api_key"
export JWT_SECRET="change_this_to_a_long_random_string"
export OPEN_PUBLISH_KEY="platform_publish_key"
export SMTP_HOST="smtp.example.com"
export SMTP_PORT="587"
export SMTP_USER="no-reply@example.com"
export SMTP_PASS="your_smtp_password"
export SMTP_FROM="TripWeaver <no-reply@example.com>"
export SMTP_USE_TLS="true"
export AUTH_CODE_DEBUG="false"
export PLACES_HTTP_TIMEOUT_SEC="4.0"
export OPENAI_HTTP_TIMEOUT_SEC="4.0"
export DISCOVERY_BUDGET_SEC="7.0"
export DISCOVERY_MAX_SEED_QUERIES="6"
export PLACES_CACHE_TTL_SEC="300"
python3 server.py
```

打开 [http://localhost:3000](http://localhost:3000)。
独立注册/登录页：[http://localhost:3000/auth.html](http://localhost:3000/auth.html)。

## iOS 前端（SwiftUI）

- 工程目录：`ios/`
- Xcode 工程：`ios/TripWeaveriOS.xcodeproj`
- 主要页面：路线生成、发现推荐、账号登录（密码/验证码/OAuth Mock）
- 默认后端地址：`http://127.0.0.1:3000`（可在 iOS「账号」页修改为公网域名）

生成工程（首次）：

```bash
brew install xcodegen
cd ios
xcodegen generate
open TripWeaveriOS.xcodeproj
```

## Android 前端（Jetpack Compose）

- 工程目录：`android/`
- 包名：`com.tripweaver.android`
- 页面结构与 iOS 对齐：`路线 / 发现 / 聊天 / 账号` 四个 Tab
- 已接入能力：
  - 路线生成（含 GPS 定位、国家和地区/城市选择、手动地点、生成结果地图）
  - 发现页（即将路线、社群入口、真实地点搜索、推荐、地图）
  - 聊天页（好友私聊/社群/活动会话、兴趣群发布下次活动、活动地图卡片）
  - 账号页（密码登录、注册、邮箱验证码、OAuth Mock、校园认证、后端地址配置）

> 首次导入前，请在 `android/local.properties` 添加 Google Maps Key：
>
> `MAPS_API_KEY=你的安卓地图key`

在 Android Studio 中打开 `android/` 目录即可同步并运行。

## API

详细前后端联调文档见：[docs/API_INTEGRATION.md](docs/API_INTEGRATION.md)

- `GET /api/health`
- `GET /api/maps-config`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/request-code`
- `POST /api/auth/code-login`
- `POST /api/auth/email/request-code`
- `POST /api/auth/email/code-login`
- `POST /api/auth/oauth/mock`
- `GET /api/auth/me`
- `POST /api/campus/verify`
- `GET /api/friends`
- `POST /api/friends/request`
- `POST /api/friends/request/:id/respond`
- `GET /api/im/messages`
- `POST /api/im/messages`
- `GET /api/im/dm/:userId/messages`
- `POST /api/im/dm/:userId/messages`
- `POST /api/im/summarize-plan`
- `POST /api/campus/groups`
- `GET /api/campus/groups`
- `POST /api/campus/groups/:id/join`
- `GET /api/campus/groups/:id/messages`
- `POST /api/campus/groups/:id/messages`
- `POST /api/travel/posts`
- `GET /api/travel/posts`
- `POST /api/travel/posts/:id/join`
- `POST /api/travel/posts/:id/route`
- `POST /api/travel/doc-route`
- `POST /api/travel/image-route`
- `GET /api/travel/matches`
- `POST /api/official/posts`
- `GET /api/official/posts`
- `GET /api/aggregated/feed`
- `POST /api/open/publish`
- `GET /api/open/feed`
- `GET /api/discovery/places`
- `GET /api/interest/groups`
- `POST /api/interest/groups`
- `POST /api/interest/groups/:id/join`
- `GET /api/interest/groups/:id/messages`
- `POST /api/interest/groups/:id/messages`
- `GET /api/local/events`
- `POST /api/local/events`
- `POST /api/local/events/:id/rsvp`
- `GET /api/inspirations`
- `POST /api/inspirations`
- `POST /api/inspirations/:id/like`
- `GET /api/collab/trips`
- `POST /api/collab/trips`
- `POST /api/collab/trips/:id/join`
- `GET /api/collab/trips/:id`
- `POST /api/collab/trips/:id/items`
- `POST /api/collab/trips/:id/import-reservation`
- `POST /api/collab/trips/:id/expenses`
- `GET /api/collab/trips/:id/summary`
- `GET /api/mook/guides`
- `GET /api/mook/guides/:id`
- `GET /api/events`
- `POST /api/events`
- `POST /api/generate-plan`
- `POST /api/create-activity`
- `GET /api/activities/:code`

## 技术栈

- Frontend: Vanilla HTML/CSS/JS
- Backend: Python + FastAPI
- Storage: SQLite（`data/app.db`）
- Map Rendering: Google Maps JavaScript API
- Place Validation: Google Places/Geocoding + OpenStreetMap fallback
- Realtime Query: Google Places Text Search
- Auth: JWT + bcrypt
- IM: HTTP polling（前端 Socket.IO 会自动降级）
- Data Federation: Official + Travel aggregated feed, external publish API

## MOOK 数据说明

- 文件位置：`data/mook_guides.json`
- 当前覆盖：日本（东京/关西/北海道）与新加坡（城市线/亲子线）多日攻略
- 查询示例：
  - `/api/mook/guides?country=Japan&minDays=4`
  - `/api/mook/guides?country=Singapore&tag=family`

## Google Maps 说明

- 每个点位都带有 Google Maps 跳转链接，点击可直接打开导航或搜索。
- 页面地图使用 Google Maps JavaScript API，请确保 key 已启用 Maps JavaScript API 且已绑定 billing。
- 跨国路线优先走 Google Places 实时门店；若实时 API 不可用，会自动使用 MOOK 攻略点位 + 地理编码校验兜底。

若页面提示 `This page didn't load Google Maps correctly`，按这个顺序检查：
1. 在 Google Cloud 启用 `Maps JavaScript API`。
2. 确认项目已绑定 Billing。
3. API key 限制里添加 `HTTP referrer`，例如 `http://localhost:3000/*`。
4. `API restrictions` 里允许 `Maps JavaScript API`。
