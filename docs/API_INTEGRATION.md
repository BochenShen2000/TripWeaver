# TripWeaver 前后端对接 API 文档

本文档用于 Web / iOS / Android 客户端与 `server.py` 对接。

- 后端实现文件：`server.py`
- 默认本地地址：`http://127.0.0.1:3000`
- 数据格式：`application/json`

---

## 1. 通用约定

### 1.1 Base URL
- 开发环境：`http://127.0.0.1:3000`
- 生产环境：`https://<your-domain>`

### 1.2 鉴权
- 使用 JWT Bearer Token
- Header：`Authorization: Bearer <token>`
- 未授权时通常返回 `401/403`

### 1.3 错误返回
```json
{
  "error": "Readable error message"
}
```

### 1.4 时间格式
- 统一使用 ISO8601（例如：`2026-03-08T12:00:00+08:00`）

---

## 2. 基础与配置

### 2.1 健康检查
- `GET /api/health`
- Auth：否
- 响应：
```json
{ "ok": true, "now": "2026-03-08T01:23:45.000000+00:00" }
```

### 2.2 地图配置
- `GET /api/maps-config`
- Auth：否
- 用途：前端判断 Google Maps 是否可用
- 响应：
```json
{ "enabled": true, "apiKey": "..." }
```

---

## 3. 认证与账号

### 3.1 注册
- `POST /api/auth/register`
- Auth：否
- 请求：
```json
{
  "username": "alice",
  "password": "123456",
  "displayName": "Alice",
  "email": "alice@example.com"
}
```
- 响应：
```json
{ "token": "...", "user": { "id": "USR-...", "username": "alice", "displayName": "Alice" } }
```

### 3.2 密码登录
- `POST /api/auth/login`
- Auth：否
- 请求：
```json
{ "identifier": "alice", "password": "123456" }
```
- 响应同注册。

### 3.3 请求验证码（通用）
- `POST /api/auth/request-code`
- Auth：否
- 请求：
```json
{ "identifier": "alice@example.com" }
```
- 响应：
```json
{
  "ok": true,
  "identifierHint": "al***@example.com",
  "expiresInSeconds": 600,
  "delivery": "email",
  "debugCode": "123456"
}
```

### 3.4 请求邮箱验证码（推荐）
- `POST /api/auth/email/request-code`
- Auth：否
- 请求：
```json
{ "email": "alice@example.com" }
```

### 3.5 验证码登录（通用）
- `POST /api/auth/code-login`
- Auth：否
- 请求：
```json
{ "identifier": "alice@example.com", "code": "123456", "displayName": "Alice" }
```

### 3.6 邮箱验证码登录
- `POST /api/auth/email/code-login`
- Auth：否
- 请求：
```json
{ "email": "alice@example.com", "code": "123456", "displayName": "Alice" }
```

### 3.7 第三方登录（Mock）
- `POST /api/auth/oauth/mock`
- Auth：否
- 请求：
```json
{ "provider": "google", "oauthUserId": "google_123", "displayName": "Google 用户" }
```

### 3.8 获取当前用户
- `GET /api/auth/me`
- Auth：是
- 响应：
```json
{ "user": { "id": "USR-...", "username": "alice", "displayName": "Alice", "campusVerified": false } }
```

### 3.9 校园认证
- `POST /api/campus/verify`
- Auth：是
- 请求：
```json
{ "campusEmail": "alice@ntu.edu.sg", "campusName": "NTU", "studentId": "A1234567" }
```
- 响应：
```json
{ "user": { ... }, "campusVerified": true, "campusName": "NTU" }
```

---

## 4. 即时消息与好友

### 4.1 全局消息列表
- `GET /api/im/messages?limit=200`
- Auth：是

### 4.2 发送全局消息
- `POST /api/im/messages`
- Auth：是
- 请求：
```json
{ "content": "今晚有人去桌游吗？", "geo": { "lat": 1.29, "lng": 103.85, "label": "NTU" } }
```

### 4.3 好友与请求列表
- `GET /api/friends`
- Auth：是
- 响应：
```json
{
  "friends": [ { "id": "USR-...", "username": "bob", "displayName": "Bob" } ],
  "requests": [ { "id": "FR-...", "fromUserId": "USR-1", "toUserId": "USR-2", "status": "pending" } ]
}
```

### 4.4 发送好友请求
- `POST /api/friends/request`
- Auth：是
- 请求：
```json
{ "toUsername": "bob" }
```

### 4.5 处理好友请求
- `POST /api/friends/request/{request_id}/respond`
- Auth：是
- 请求：
```json
{ "accept": true }
```

### 4.6 私聊消息
- `GET /api/im/dm/{user_id}/messages`
- `POST /api/im/dm/{user_id}/messages`
- Auth：是
- POST 请求：
```json
{ "content": "周六一起看展？" }
```

---

## 5. 校园群聊

### 5.1 创建校园群
- `POST /api/campus/groups`
- Auth：是（通常需校园认证）

### 5.2 获取校园群
- `GET /api/campus/groups`
- Auth：是

### 5.3 加入校园群
- `POST /api/campus/groups/{group_id}/join`
- Auth：是

### 5.4 校园群消息
- `GET /api/campus/groups/{group_id}/messages`
- `POST /api/campus/groups/{group_id}/messages`
- Auth：是

---

## 6. 兴趣社群

### 6.1 获取兴趣群
- `GET /api/interest/groups?city=&country=&interest=&q=`
- Auth：可选（按可见范围过滤）

### 6.2 创建兴趣群
- `POST /api/interest/groups`
- Auth：是
- 请求：
```json
{
  "name": "Tokyo Boardgame Night",
  "interest": "桌游",
  "city": "Tokyo",
  "country": "Japan",
  "description": "每周一次",
  "visibility": "public",
  "inviteUsernames": []
}
```

### 6.3 加入兴趣群
- `POST /api/interest/groups/{group_id}/join`
- Auth：是

### 6.4 兴趣群消息
- `GET /api/interest/groups/{group_id}/messages`
- `POST /api/interest/groups/{group_id}/messages`
- Auth：是

### 6.5 发布社群下次活动（群聊可见）
- `POST /api/interest/groups/{group_id}/activities`
- Auth：是（群成员）
- 请求：
```json
{
  "theme": "周六桌游局",
  "startAt": "2026-03-15T19:00:00+08:00",
  "endAt": "2026-03-15T22:00:00+08:00",
  "venueName": "The Mind Cafe",
  "city": "Singapore",
  "country": "Singapore",
  "description": "新手友好",
  "googleMapsUri": "https://www.google.com/maps?q=1.295,103.859",
  "geo": { "lat": 1.295, "lng": 103.859, "label": "The Mind Cafe" }
}
```
- 响应：
```json
{
  "ok": true,
  "groupId": "IG-...",
  "activity": { "id": "IGA-...", "theme": "周六桌游局", "startAt": "...", "geo": { "lat": 1.295, "lng": 103.859 } },
  "message": { "id": "IGM-...", "kind": "interest_activity", "content": "【社群下次活动】...", "activity": { ... } }
}
```

---

## 7. 活动发现（Local Events）

### 7.1 获取活动
- `GET /api/local/events?city=&country=&category=&q=`
- Auth：可选

### 7.2 发布活动
- `POST /api/local/events`
- Auth：是

### 7.3 RSVP 活动
- `POST /api/local/events/{event_id}/rsvp`
- Auth：是
- 请求：
```json
{ "status": "going" }
```

### 7.4 已加入活动列表
- `GET /api/local/events/joined`
- Auth：是

### 7.5 活动详情
- `GET /api/local/events/{event_id}`
- Auth：可选（返回可见字段）

### 7.6 活动聊天消息
- `GET /api/local/events/{event_id}/messages`
- `POST /api/local/events/{event_id}/messages`
- Auth：是（已加入）

---

## 8. 路线生成与活动发起

### 8.1 生成路线
- `POST /api/generate-plan`
- Auth：可选
- 请求（示例）：
```json
{
  "companion": "朋友",
  "people": "2",
  "budget": "中预算",
  "timeSlot": "周末半天",
  "interest": "桌游+咖啡",
  "area": "Tokyo, Japan",
  "city": "Tokyo",
  "country": "Japan",
  "startDate": "2026-03-15",
  "startTime": "19:00",
  "fromCountry": "Singapore",
  "manualPlaces": [
    { "name": "Shibuya Sky", "city": "Tokyo", "country": "Japan" }
  ]
}
```
- 响应核心字段：
```json
{
  "id": "PL-...",
  "title": "Tokyo 桌游夜",
  "route": [
    { "point": "地点A", "lat": 35.6, "lng": 139.7, "date": "2026-03-15", "time": "19:00", "intro": "..." }
  ],
  "routePath": [ { "lat": 35.6, "lng": 139.7 } ],
  "validationSummary": { "total": 5, "verified": 5, "realtime": true },
  "routeSummary": { "distanceKm": 12.5, "durationMin": 68 },
  "bookingLinks": { "flights": "...", "hotels": "...", "attractions": "..." }
}
```

### 8.2 创建活动
- `POST /api/create-activity`
- Auth：可选（推荐登录）
- 请求包含 `plan` 与 `launchConfig`（日历、隐私、时间、地点等）

### 8.3 获取活动
- `GET /api/activities/{code}`

### 8.4 聊天总结生成路线
- `POST /api/im/summarize-plan`
- Auth：是
- 请求：
```json
{ "scope": "interest_group", "groupId": "IG-...", "limit": 100 }
```
- 响应：
```json
{ "intent": { ... }, "plan": { ... }, "messageCount": 35 }
```

---

## 9. 发现与真实地点

### 9.1 发现真实地点
- `GET /api/discovery/places?q=&city=&country=&category=&limit=`
- Auth：可选

### 9.2 个性化推荐地点
- `GET /api/discovery/recommendations?city=&country=&limit=`
- Auth：是（推荐）

### 9.3 即将开始路线
- `GET /api/discovery/upcoming-routes?city=&country=&limit=`
- Auth：可选

### 9.4 坐标反查地点
- `GET /api/places/reverse?lat=&lng=&city=&country=`
- `GET /api/geo/reverse-location?lat=&lng=`

### 9.5 手动地点记忆
- `GET /api/preferences/manual-places?q=&city=&country=&limit=`
- `POST /api/preferences/manual-places`
- `POST /api/preferences/track`

---

## 10. 旅行找搭子与文档/图片抽点

### 10.1 发布旅行帖子
- `POST /api/travel/posts`

### 10.2 获取旅行帖子
- `GET /api/travel/posts?toCountry=&toCity=`

### 10.3 加入帖子
- `POST /api/travel/posts/{post_id}/join`

### 10.4 生成旅行路线
- `POST /api/travel/posts/{post_id}/route`

### 10.5 旅行匹配
- `GET /api/travel/matches`

### 10.6 文档抽点路线
- `POST /api/travel/doc-route`

### 10.7 图片抽点路线
- `POST /api/travel/image-route`

---

## 11. 内容流与官方聚合

### 11.1 灵感内容
- `GET /api/inspirations`
- `POST /api/inspirations`
- `POST /api/inspirations/{post_id}/like`

### 11.2 官方发布
- `POST /api/official/posts`
- `GET /api/official/posts`

### 11.3 聚合流
- `GET /api/aggregated/feed`

### 11.4 开放发布接口
- `POST /api/open/publish`
- `GET /api/open/feed`

### 11.5 MOOK 攻略
- `GET /api/mook/guides?country=&minDays=&tag=`
- `GET /api/mook/guides/{guide_id}`

---

## 12. 协同旅行（Wanderlog 模式）

### 12.1 创建行程
- `POST /api/collab/trips`

### 12.2 获取我的行程
- `GET /api/collab/trips`

### 12.3 行程详情
- `GET /api/collab/trips/{trip_id}`

### 12.4 加入行程
- `POST /api/collab/trips/{trip_id}/join`

### 12.5 添加行程项
- `POST /api/collab/trips/{trip_id}/items`

### 12.6 添加费用
- `POST /api/collab/trips/{trip_id}/expenses`

### 12.7 导入预订信息
- `POST /api/collab/trips/{trip_id}/import-reservation`

### 12.8 分账结果
- `GET /api/collab/trips/{trip_id}/summary`

---

## 13. 前端对接建议

1. 所有可选参数在 query/body 中为空时可省略。
2. 客户端应统一处理：
   - 401：跳登录
   - 403：权限提示（未加入群、未校园认证等）
   - 409：资源冲突（用户名/邮箱已存在）
3. IM 目前以 HTTP 拉取为主，客户端建议保持 6~10 秒轮询。
4. 地图相关功能建议先请求 `/api/maps-config` 判断可用性。
5. 发布兴趣群活动后，消息 `kind=interest_activity`，客户端可渲染活动卡片和地图。

---

## 14. 最小联调流程（建议）

1. `POST /api/auth/register` 或 `POST /api/auth/login`
2. `GET /api/auth/me`
3. `POST /api/generate-plan` + `POST /api/create-activity`
4. `GET /api/interest/groups` -> `POST /join` -> `GET/POST /messages`
5. `POST /api/interest/groups/{id}/activities`（验证群聊活动卡）
6. `GET /api/discovery/places`（验证真实地点）

