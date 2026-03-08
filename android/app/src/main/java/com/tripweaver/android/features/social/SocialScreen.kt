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
import androidx.compose.material3.AlertDialog
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
import androidx.compose.ui.unit.dp
import com.tripweaver.android.core.ApiClient
import com.tripweaver.android.core.SessionStore
import com.tripweaver.android.model.AuthUser
import com.tripweaver.android.model.CampusGroup
import com.tripweaver.android.model.DiscoveryRouteEvent
import com.tripweaver.android.model.FriendRequest
import com.tripweaver.android.model.FriendsPayload
import com.tripweaver.android.model.InterestGroup
import com.tripweaver.android.ui.TwCard
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
private data class FriendRequestBody(val toUsername: String)

@Serializable
private data class FriendRespondBody(val accept: Boolean)

@Serializable
private data class CreateInterestGroupBody(
    val name: String,
    val interest: String,
    val city: String,
    val country: String,
    val description: String,
    val visibility: String,
    val inviteUsernames: List<String> = emptyList(),
)

@Composable
fun SocialScreen(
    session: SessionStore,
    onOpenChat: (type: ChatThreadType, id: String, title: String, subtitle: String, joined: Boolean) -> Unit,
) {
    val scope = rememberCoroutineScope()

    var loading by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }
    var friendUsername by remember { mutableStateOf("") }

    val friends = remember { mutableStateListOf<AuthUser>() }
    val requests = remember { mutableStateListOf<FriendRequest>() }
    val interestGroups = remember { mutableStateListOf<InterestGroup>() }
    val campusGroups = remember { mutableStateListOf<CampusGroup>() }
    val joinedEvents = remember { mutableStateListOf<DiscoveryRouteEvent>() }

    var showCreateInterestDialog by remember { mutableStateOf(false) }
    var igName by remember { mutableStateOf("") }
    var igInterest by remember { mutableStateOf("") }
    var igCity by remember { mutableStateOf("Singapore") }
    var igCountry by remember { mutableStateOf("Singapore") }
    var igDesc by remember { mutableStateOf("") }
    var igVisibility by remember { mutableStateOf("public") }

    fun refreshAll() {
        if (session.token.isBlank()) {
            friends.clear(); requests.clear(); interestGroups.clear(); campusGroups.clear(); joinedEvents.clear()
            return
        }
        scope.launch {
            loading = true
            try {
                val token = session.token
                val base = session.apiBaseUrl
                val friendsPayload = ApiClient.get<FriendsPayload>(base, "/api/friends", token)
                val ig = ApiClient.get<List<InterestGroup>>(base, "/api/interest/groups", token)
                val cg = runCatching { ApiClient.get<List<CampusGroup>>(base, "/api/campus/groups", token) }.getOrDefault(emptyList())
                val events = runCatching { ApiClient.get<List<DiscoveryRouteEvent>>(base, "/api/local/events/joined", token) }.getOrDefault(emptyList())
                friends.clear(); friends.addAll(friendsPayload.friends)
                requests.clear(); requests.addAll(friendsPayload.requests)
                interestGroups.clear(); interestGroups.addAll(ig)
                campusGroups.clear(); campusGroups.addAll(cg)
                joinedEvents.clear(); joinedEvents.addAll(events)
            } catch (e: Exception) {
                message = e.message ?: "加载失败"
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(session.token) { refreshAll() }

    if (showCreateInterestDialog) {
        AlertDialog(
            onDismissRequest = { showCreateInterestDialog = false },
            title = { Text("创建兴趣群") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = igName, onValueChange = { igName = it }, label = { Text("社群名") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = igInterest, onValueChange = { igInterest = it }, label = { Text("兴趣") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = igCity, onValueChange = { igCity = it }, label = { Text("城市") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = igCountry, onValueChange = { igCountry = it }, label = { Text("国家和地区") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = igDesc, onValueChange = { igDesc = it }, label = { Text("社群介绍") }, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(value = igVisibility, onValueChange = { igVisibility = it }, label = { Text("可见范围(public/campus/invite)") }, modifier = Modifier.fillMaxWidth())
                }
            },
            confirmButton = {
                Button(onClick = {
                    scope.launch {
                        loading = true
                        try {
                            val created = ApiClient.post<InterestGroup, CreateInterestGroupBody>(
                                baseUrl = session.apiBaseUrl,
                                path = "/api/interest/groups",
                                token = session.token,
                                body = CreateInterestGroupBody(
                                    name = igName,
                                    interest = igInterest,
                                    city = igCity,
                                    country = igCountry,
                                    description = igDesc,
                                    visibility = igVisibility,
                                ),
                            )
                            message = "兴趣群已创建：${created.name}"
                            showCreateInterestDialog = false
                            refreshAll()
                        } catch (e: Exception) {
                            message = e.message ?: "创建失败"
                        } finally {
                            loading = false
                        }
                    }
                }, enabled = !loading && igName.isNotBlank() && igInterest.isNotBlank()) {
                    Text("创建")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreateInterestDialog = false }) { Text("取消") }
            },
        )
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
                    Text("聊天")
                    Text(if (session.token.isBlank()) "请先登录查看会话" else "好友、群聊、活动会话")
                    if (message.isNotBlank()) Text(message)
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("添加好友")
                    OutlinedTextField(
                        value = friendUsername,
                        onValueChange = { friendUsername = it },
                        label = { Text("输入用户名") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                scope.launch {
                                    loading = true
                                    try {
                                        ApiClient.post<JsonObject, FriendRequestBody>(
                                            baseUrl = session.apiBaseUrl,
                                            path = "/api/friends/request",
                                            token = session.token,
                                            body = FriendRequestBody(friendUsername),
                                        )
                                        friendUsername = ""
                                        message = "好友请求已发送"
                                        refreshAll()
                                    } catch (e: Exception) {
                                        message = e.message ?: "发送失败"
                                    } finally {
                                        loading = false
                                    }
                                }
                            },
                            enabled = session.token.isNotBlank() && !loading && friendUsername.isNotBlank(),
                        ) { Text("发送好友请求") }
                        Button(onClick = { showCreateInterestDialog = true }, enabled = session.token.isNotBlank() && !loading) {
                            Text("创建兴趣群")
                        }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("活动聊天")
                    if (joinedEvents.isEmpty()) {
                        Text("暂无已加入活动")
                    } else {
                        joinedEvents.forEach { event ->
                            Button(onClick = {
                                onOpenChat(
                                    ChatThreadType.EVENT,
                                    event.id,
                                    event.title,
                                    "${event.venueName ?: "待定地点"}",
                                    true,
                                )
                            }, modifier = Modifier.fillMaxWidth()) {
                                Text(event.title)
                            }
                        }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("好友私聊")
                    if (friends.isEmpty()) Text("暂无好友")
                    friends.forEach { friend ->
                        Button(onClick = {
                            onOpenChat(ChatThreadType.DIRECT, friend.id, friend.displayName, "@${friend.username}", true)
                        }, modifier = Modifier.fillMaxWidth()) {
                            Text(friend.displayName)
                        }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("好友请求")
                    if (requests.isEmpty()) Text("暂无好友请求")
                    requests.forEach { req ->
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                            Text("${req.fromUserId} -> ${req.toUserId}", modifier = Modifier.weight(1f))
                            TextButton(onClick = {
                                scope.launch {
                                    runCatching {
                                        ApiClient.post<JsonObject, FriendRespondBody>(
                                            baseUrl = session.apiBaseUrl,
                                            path = "/api/friends/request/${req.id}/respond",
                                            token = session.token,
                                            body = FriendRespondBody(true),
                                        )
                                    }.onSuccess {
                                        refreshAll(); message = "已同意好友请求"
                                    }.onFailure {
                                        message = it.message ?: "操作失败"
                                    }
                                }
                            }) { Text("同意") }
                            TextButton(onClick = {
                                scope.launch {
                                    runCatching {
                                        ApiClient.post<JsonObject, FriendRespondBody>(
                                            baseUrl = session.apiBaseUrl,
                                            path = "/api/friends/request/${req.id}/respond",
                                            token = session.token,
                                            body = FriendRespondBody(false),
                                        )
                                    }.onSuccess {
                                        refreshAll(); message = "已拒绝好友请求"
                                    }.onFailure {
                                        message = it.message ?: "操作失败"
                                    }
                                }
                            }) { Text("拒绝") }
                        }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("社群")
                    Button(onClick = { onOpenChat(ChatThreadType.GLOBAL, "global", "公共旅行讨论区", "全体可见", true) }, modifier = Modifier.fillMaxWidth()) {
                        Text("公共旅行讨论区")
                    }

                    interestGroups.forEach { group ->
                        val joined = group.members?.any { it.id == session.user?.id } == true
                        Button(onClick = {
                            onOpenChat(
                                ChatThreadType.INTEREST,
                                group.id,
                                group.name,
                                "${group.interest ?: "兴趣"} · ${group.city.orEmpty()} ${group.country.orEmpty()}",
                                joined,
                            )
                        }, modifier = Modifier.fillMaxWidth()) {
                            Text("兴趣群：${group.name}")
                        }
                    }

                    campusGroups.forEach { group ->
                        val joined = group.members?.any { it.id == session.user?.id } == true
                        Button(onClick = {
                            onOpenChat(ChatThreadType.CAMPUS, group.id, group.name, group.campusName ?: "校园群", joined)
                        }, modifier = Modifier.fillMaxWidth()) {
                            Text("校园群：${group.name}")
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}
