package com.tripweaver.android.features.social

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tripweaver.android.core.ApiClient
import com.tripweaver.android.core.SessionStore
import com.tripweaver.android.model.ChatMessage
import com.tripweaver.android.model.DiscoveryRouteEvent
import com.tripweaver.android.model.GenerateActivityResponse
import com.tripweaver.android.model.InterestActivityPayload
import com.tripweaver.android.model.InterestActivityPublishResponse
import com.tripweaver.android.model.RouteStop
import com.tripweaver.android.ui.TwCard
import com.tripweaver.android.ui.TwRouteMap
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

@Serializable
private data class MessageBody(val content: String)

@Serializable
private data class EmptyBody(val ok: Boolean = true)

@Serializable
private data class EventJoinBody(val status: String)

@Serializable
data class InterestGeoBody(
    val lat: Double,
    val lng: Double,
    val label: String? = null,
)

@Serializable
data class InterestActivityBody(
    val theme: String,
    val startAt: String,
    val endAt: String? = null,
    val venueName: String,
    val city: String,
    val country: String,
    val description: String? = null,
    val googleMapsUri: String? = null,
    val geo: InterestGeoBody? = null,
)

@Composable
fun ChatThreadScreen(
    session: SessionStore,
    type: ChatThreadType,
    id: String,
    title: String,
    subtitle: String,
    initiallyJoined: Boolean,
) {
    val scope = rememberCoroutineScope()
    val uriHandler = LocalUriHandler.current

    val messages = remember { mutableStateListOf<ChatMessage>() }

    var draft by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var joined by remember { mutableStateOf(initiallyJoined) }
    var eventDetail by remember { mutableStateOf<DiscoveryRouteEvent?>(null) }

    var showActivityComposer by remember { mutableStateOf(false) }
    var activityTheme by remember { mutableStateOf("社群线下活动") }
    var activityVenue by remember { mutableStateOf("") }
    var activityCity by remember { mutableStateOf("Singapore") }
    var activityCountry by remember { mutableStateOf("Singapore") }
    var activityDescription by remember { mutableStateOf("") }
    var activityMapsUri by remember { mutableStateOf("") }
    var activityLat by remember { mutableStateOf("") }
    var activityLng by remember { mutableStateOf("") }
    var activityStartAt by remember { mutableStateOf(nowIso()) }
    var activityEndAt by remember { mutableStateOf(nowIso(3600_000)) }

    val needsJoin = type == ChatThreadType.CAMPUS || type == ChatThreadType.INTEREST || type == ChatThreadType.EVENT

    suspend fun loadEventDetail() {
        if (type != ChatThreadType.EVENT || session.token.isBlank()) return
        runCatching {
            ApiClient.get<DiscoveryRouteEvent>(
                baseUrl = session.apiBaseUrl,
                path = "/api/local/events/$id",
                token = session.token,
            )
        }.onSuccess {
            eventDetail = it
        }
    }

    suspend fun loadMessages() {
        if (session.token.isBlank()) return
        if (needsJoin && !joined) return
        loading = true
        try {
            val path = when (type) {
                ChatThreadType.GLOBAL -> "/api/im/messages?limit=200"
                ChatThreadType.DIRECT -> "/api/im/dm/$id/messages"
                ChatThreadType.CAMPUS -> "/api/campus/groups/$id/messages"
                ChatThreadType.INTEREST -> "/api/interest/groups/$id/messages"
                ChatThreadType.EVENT -> "/api/local/events/$id/messages"
            }
            val result = ApiClient.get<List<ChatMessage>>(session.apiBaseUrl, path, session.token)
            messages.clear(); messages.addAll(result)
        } catch (e: Exception) {
            status = e.message ?: "加载失败"
        } finally {
            loading = false
        }
    }

    suspend fun joinThread() {
        if (session.token.isBlank()) return
        loading = true
        try {
            when (type) {
                ChatThreadType.CAMPUS -> {
                    ApiClient.post<JsonObject, EmptyBody>(session.apiBaseUrl, "/api/campus/groups/$id/join", EmptyBody(), session.token)
                }
                ChatThreadType.INTEREST -> {
                    ApiClient.post<JsonObject, EmptyBody>(session.apiBaseUrl, "/api/interest/groups/$id/join", EmptyBody(), session.token)
                }
                ChatThreadType.EVENT -> {
                    ApiClient.post<GenerateActivityResponse, EventJoinBody>(session.apiBaseUrl, "/api/local/events/$id/rsvp", EventJoinBody("going"), session.token)
                }
                ChatThreadType.GLOBAL, ChatThreadType.DIRECT -> Unit
            }
            joined = true
            status = "加入成功"
            loadEventDetail()
            loadMessages()
        } catch (e: Exception) {
            status = e.message ?: "加入失败"
        } finally {
            loading = false
        }
    }

    suspend fun sendMessage() {
        val text = draft.trim()
        if (text.isBlank() || session.token.isBlank()) return
        if (needsJoin && !joined) return
        loading = true
        try {
            val path = when (type) {
                ChatThreadType.GLOBAL -> "/api/im/messages"
                ChatThreadType.DIRECT -> "/api/im/dm/$id/messages"
                ChatThreadType.CAMPUS -> "/api/campus/groups/$id/messages"
                ChatThreadType.INTEREST -> "/api/interest/groups/$id/messages"
                ChatThreadType.EVENT -> "/api/local/events/$id/messages"
            }
            val sent = ApiClient.post<ChatMessage, MessageBody>(
                baseUrl = session.apiBaseUrl,
                path = path,
                token = session.token,
                body = MessageBody(text),
            )
            messages.add(sent)
            draft = ""
        } catch (e: Exception) {
            status = e.message ?: "发送失败"
        } finally {
            loading = false
        }
    }

    suspend fun publishInterestActivity() {
        if (type != ChatThreadType.INTEREST || session.token.isBlank()) return
        loading = true
        try {
            val lat = activityLat.toDoubleOrNull()
            val lng = activityLng.toDoubleOrNull()
            val geo = if (lat != null && lng != null) {
                InterestGeoBody(lat, lng, listOf(activityVenue, activityCity, activityCountry).filter { it.isNotBlank() }.joinToString(", "))
            } else {
                null
            }
            val body = InterestActivityBody(
                theme = activityTheme,
                startAt = activityStartAt,
                endAt = activityEndAt,
                venueName = activityVenue,
                city = activityCity,
                country = activityCountry,
                description = activityDescription.ifBlank { null },
                googleMapsUri = activityMapsUri.ifBlank { null },
                geo = geo,
            )
            val resp = ApiClient.post<InterestActivityPublishResponse, InterestActivityBody>(
                baseUrl = session.apiBaseUrl,
                path = "/api/interest/groups/$id/activities",
                token = session.token,
                body = body,
            )
            resp.message?.let { messages.add(it) } ?: loadMessages()
            status = "社群活动已发布"
            showActivityComposer = false
        } catch (e: Exception) {
            status = e.message ?: "发布失败"
        } finally {
            loading = false
        }
    }

    LaunchedEffect(type, id, session.token, joined) {
        if (session.token.isNotBlank()) {
            loadEventDetail()
            loadMessages()
        }
    }

    LaunchedEffect(type, id, session.token, joined) {
        while (session.token.isNotBlank()) {
            delay(8000)
            if (needsJoin && !joined) continue
            runCatching { loadMessages() }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(title, fontWeight = FontWeight.SemiBold)
                    Text(subtitle)
                    if (needsJoin) Text(if (joined) "已加入" else "未加入")
                    if (status.isNotBlank()) Text(status)
                }
            }
        }

        if (session.token.isBlank()) {
            item {
                TwCard { Text("请先登录再进入聊天") }
            }
        } else if (needsJoin && !joined) {
            item {
                TwCard {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("先报名/加入，再开始聊天")
                        Button(onClick = { scope.launch { joinThread() } }, enabled = !loading) {
                            Text(if (loading) "处理中..." else "立即加入")
                        }
                    }
                }
            }
        } else {
            if (type == ChatThreadType.EVENT && eventDetail != null) {
                item {
                    val route = eventRouteForMap(eventDetail)
                    if (route.isNotEmpty()) {
                        TwCard {
                            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("活动地图")
                                TwRouteMap(route = route)
                            }
                        }
                    }
                }
            }

            if (type == ChatThreadType.INTEREST) {
                item {
                    TwCard {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = { showActivityComposer = !showActivityComposer }) {
                                Text(if (showActivityComposer) "收起发布活动" else "发布社群下次活动")
                            }
                            if (showActivityComposer) {
                                OutlinedTextField(value = activityTheme, onValueChange = { activityTheme = it }, label = { Text("活动主题") }, modifier = Modifier.fillMaxWidth())
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(value = activityStartAt, onValueChange = { activityStartAt = it }, label = { Text("开始时间ISO") }, modifier = Modifier.weight(1f))
                                    OutlinedTextField(value = activityEndAt, onValueChange = { activityEndAt = it }, label = { Text("结束时间ISO") }, modifier = Modifier.weight(1f))
                                }
                                OutlinedTextField(value = activityVenue, onValueChange = { activityVenue = it }, label = { Text("地点名称") }, modifier = Modifier.fillMaxWidth())
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(value = activityCity, onValueChange = { activityCity = it }, label = { Text("城市") }, modifier = Modifier.weight(1f))
                                    OutlinedTextField(value = activityCountry, onValueChange = { activityCountry = it }, label = { Text("国家和地区") }, modifier = Modifier.weight(1f))
                                }
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(value = activityLat, onValueChange = { activityLat = it }, label = { Text("纬度(可选)") }, modifier = Modifier.weight(1f))
                                    OutlinedTextField(value = activityLng, onValueChange = { activityLng = it }, label = { Text("经度(可选)") }, modifier = Modifier.weight(1f))
                                }
                                OutlinedTextField(value = activityMapsUri, onValueChange = { activityMapsUri = it }, label = { Text("Google Maps链接(可选)") }, modifier = Modifier.fillMaxWidth())
                                OutlinedTextField(value = activityDescription, onValueChange = { activityDescription = it }, label = { Text("活动说明") }, modifier = Modifier.fillMaxWidth())
                                Button(onClick = { scope.launch { publishInterestActivity() } }, enabled = !loading && activityTheme.isNotBlank() && activityVenue.isNotBlank()) {
                                    Text(if (loading) "发布中..." else "发布到群聊")
                                }
                            }
                        }
                    }
                }
            }

            item {
                TwCard {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (messages.isEmpty()) {
                            Text("暂无消息")
                        } else {
                            messages.forEach { msg ->
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.fillMaxWidth()) {
                                    Text((msg.user?.displayName ?: msg.fromUserId ?: "成员") + " · " + formatDateTime(msg.createdAt), fontWeight = FontWeight.Medium)
                                    Text(msg.content)
                                    msg.activity?.let { act ->
                                        InterestActivityCard(activity = act, onOpenMap = { url ->
                                            runCatching { uriHandler.openUri(url) }
                                        })
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item {
                TwCard {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = draft, onValueChange = { draft = it }, label = { Text("输入消息") }, modifier = Modifier.fillMaxWidth())
                        Button(onClick = { scope.launch { sendMessage() } }, enabled = !loading && draft.isNotBlank()) {
                            Text(if (loading) "发送中..." else "发送")
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

@Composable
private fun InterestActivityCard(
    activity: InterestActivityPayload,
    onOpenMap: (String) -> Unit,
) {
    val route = listOfNotNull(activity.toRouteStop())
    TwCard {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("活动主题：${activity.theme.orEmpty()}", fontWeight = FontWeight.SemiBold)
            Text("时间：${formatDateTime(activity.startAt)}${activity.endAt?.let { " - ${formatDateTime(it)}" } ?: ""}")
            Text("地点：${listOf(activity.venueName, activity.city, activity.country).filter { !it.isNullOrBlank() }.joinToString(" · ")}")
            if (activity.geo?.lat != null && activity.geo?.lng != null) {
                Text("坐标：${"%.5f".format(activity.geo.lat)}, ${"%.5f".format(activity.geo.lng)}")
                TwRouteMap(route = route, heightDp = 150)
            }
            activity.googleMapsUri?.takeIf { it.isNotBlank() }?.let { url ->
                TextButton(onClick = { onOpenMap(url) }) { Text("打开地图") }
            }
        }
    }
}

private fun InterestActivityPayload.toRouteStop(): RouteStop? {
    val lat = geo?.lat ?: return null
    val lng = geo?.lng ?: return null
    return RouteStop(
        point = venueName ?: theme ?: "活动地点",
        matchedName = venueName ?: theme,
        lat = lat,
        lng = lng,
        verified = true,
        intro = description,
        primaryType = "interest_activity",
        googleMapsUri = googleMapsUri,
    )
}

private fun eventRouteForMap(detail: DiscoveryRouteEvent?): List<RouteStop> {
    if (detail == null) return emptyList()
    if (!detail.route.isNullOrEmpty()) return detail.route
    val lat = detail.geo?.lat
    val lng = detail.geo?.lng
    if (lat != null && lng != null) {
        return listOf(
            RouteStop(
                point = detail.venueName ?: detail.title,
                matchedName = detail.venueName ?: detail.title,
                lat = lat,
                lng = lng,
                verified = true,
                intro = detail.description,
                primaryType = detail.category,
            ),
        )
    }
    return emptyList()
}

private fun formatDateTime(iso: String?): String {
    if (iso.isNullOrBlank()) return ""
    return runCatching {
        OffsetDateTime.parse(iso).format(DateTimeFormatter.ofPattern("MM-dd HH:mm"))
    }.getOrElse { iso }
}

private fun nowIso(offsetMs: Long = 0L): String =
    OffsetDateTime.now(java.time.ZoneOffset.UTC).plusNanos(offsetMs * 1_000_000).toString()
