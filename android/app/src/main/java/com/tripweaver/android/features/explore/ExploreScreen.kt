package com.tripweaver.android.features.explore

import android.Manifest
import android.annotation.SuppressLint
import android.location.Geocoder
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import com.google.android.gms.location.LocationServices
import com.tripweaver.android.core.ApiClient
import com.tripweaver.android.core.SessionStore
import com.tripweaver.android.features.social.ChatThreadType
import com.tripweaver.android.model.CampusGroup
import com.tripweaver.android.model.DiscoveryPlace
import com.tripweaver.android.model.DiscoveryRouteEvent
import com.tripweaver.android.model.InspirationPost
import com.tripweaver.android.model.InterestGroup
import com.tripweaver.android.model.RouteStop
import com.tripweaver.android.ui.TwCard
import com.tripweaver.android.ui.TwRouteMap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import java.text.SimpleDateFormat
import java.util.Locale

@Serializable
private data class CreateInspirationBody(
    val title: String,
    val city: String,
    val country: String,
    val tags: List<String> = emptyList(),
    val places: List<String> = emptyList(),
    val coverImageUrl: String? = null,
    val photoUrls: List<String> = emptyList(),
    val videoLinks: List<String> = emptyList(),
    val content: String,
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun ExploreScreen(
    session: SessionStore,
    onOpenChat: (type: ChatThreadType, id: String, title: String, subtitle: String, joined: Boolean) -> Unit,
) {
    val context = LocalContext.current
    val uriHandler = LocalUriHandler.current
    val scope = rememberCoroutineScope()
    val fused = remember { LocationServices.getFusedLocationProviderClient(context) }

    val countryPresets = remember {
        linkedMapOf(
            "Singapore" to listOf("Singapore"),
            "Japan" to listOf("Tokyo", "Osaka", "Kyoto", "Sapporo", "Fukuoka"),
            "South Korea" to listOf("Seoul", "Busan", "Jeju"),
            "Thailand" to listOf("Bangkok", "Chiang Mai", "Phuket"),
            "China" to listOf("Shanghai", "Beijing", "Shenzhen", "Guangzhou", "Chengdu"),
            "Malaysia" to listOf("Kuala Lumpur", "Johor Bahru", "Penang"),
            "Indonesia" to listOf("Jakarta", "Bali", "Yogyakarta"),
        )
    }

    var q by remember { mutableStateOf("聚餐") }
    var category by remember { mutableStateOf("restaurant") }
    var country by remember { mutableStateOf("Japan") }
    var city by remember { mutableStateOf("Tokyo") }
    var countryExpanded by remember { mutableStateOf(false) }
    var cityExpanded by remember { mutableStateOf(false) }

    val upcomingRoutes = remember { mutableStateListOf<DiscoveryRouteEvent>() }
    val interestGroups = remember { mutableStateListOf<InterestGroup>() }
    val campusGroups = remember { mutableStateListOf<CampusGroup>() }
    val places = remember { mutableStateListOf<DiscoveryPlace>() }
    val inspirations = remember { mutableStateListOf<InspirationPost>() }

    var inspirationTitle by remember { mutableStateOf("") }
    var inspirationTags by remember { mutableStateOf("") }
    var inspirationPlaces by remember { mutableStateOf("") }
    var inspirationCoverUrl by remember { mutableStateOf("") }
    var inspirationPhotoUrls by remember { mutableStateOf("") }
    var inspirationVideoLinks by remember { mutableStateOf("") }
    var inspirationContent by remember { mutableStateOf("") }

    var loading by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }

    val categoryChips = listOf("restaurant", "museum", "park", "campground", "board game cafe", "cafe", "attraction", "hotel")

    fun refreshFeed() {
        scope.launch {
            loading = true
            try {
                val base = session.apiBaseUrl
                val token = session.token.ifBlank { null }
                val upPath = "/api/discovery/upcoming-routes?" + ApiClient.query(
                    mapOf("city" to city, "country" to country, "limit" to "8"),
                )
                val igPath = "/api/interest/groups?" + ApiClient.query(
                    mapOf("city" to city, "country" to country),
                )
                val insPath = "/api/inspirations?" + ApiClient.query(
                    mapOf("city" to city, "country" to country),
                )
                val up = ApiClient.get<List<DiscoveryRouteEvent>>(base, upPath, token)
                val ig = ApiClient.get<List<InterestGroup>>(base, igPath, token)
                val cg = runCatching { ApiClient.get<List<CampusGroup>>(base, "/api/campus/groups", token) }.getOrDefault(emptyList())
                val ins = runCatching { ApiClient.get<List<InspirationPost>>(base, insPath, token) }.getOrDefault(emptyList())
                upcomingRoutes.clear(); upcomingRoutes.addAll(up)
                interestGroups.clear(); interestGroups.addAll(ig)
                campusGroups.clear(); campusGroups.addAll(cg)
                inspirations.clear(); inspirations.addAll(ins)
                message = "发现流已刷新"
            } catch (e: Exception) {
                message = e.message ?: "加载失败"
            } finally {
                loading = false
            }
        }
    }

    fun searchPlaces(recommend: Boolean = false) {
        scope.launch {
            loading = true
            try {
                val base = session.apiBaseUrl
                val token = session.token.ifBlank { null }
                val path = if (recommend) {
                    "/api/discovery/recommendations?" + ApiClient.query(
                        mapOf("city" to city, "country" to country, "limit" to "8"),
                    )
                } else {
                    "/api/discovery/places?" + ApiClient.query(
                        mapOf("q" to q, "city" to city, "country" to country, "category" to category, "limit" to "8"),
                    )
                }
                val data = ApiClient.get<List<DiscoveryPlace>>(base, path, token)
                places.clear(); places.addAll(data)
                message = if (recommend) "已返回推荐 ${data.size} 条" else "找到 ${data.size} 个地点"
            } catch (e: Exception) {
                message = e.message ?: "搜索失败"
            } finally {
                loading = false
            }
        }
    }

    fun parseListInput(raw: String): List<String> {
        return raw
            .split(Regex("[\\n,，;；]+"))
            .map { it.trim() }
            .filter { it.isNotEmpty() }
    }

    fun normalizeHttpUrl(raw: String): String {
        val text = raw.trim()
        if (text.isEmpty()) return ""
        return runCatching {
            val uri = java.net.URI(text)
            val scheme = (uri.scheme ?: "").lowercase()
            if ((scheme == "http" || scheme == "https") && !uri.host.isNullOrBlank()) text else ""
        }.getOrDefault("")
    }

    fun normalizePhotoUrls(raw: String, cover: String): List<String> {
        val pool = mutableListOf<String>()
        val normalizedCover = normalizeHttpUrl(cover)
        if (normalizedCover.isNotEmpty()) pool.add(normalizedCover)
        pool.addAll(parseListInput(raw).map(::normalizeHttpUrl).filter { it.isNotEmpty() })
        return pool
            .distinctBy { it.lowercase() }
            .take(9)
    }

    fun normalizeVideoUrls(raw: String): List<String> {
        return parseListInput(raw)
            .map(::normalizeHttpUrl)
            .filter { it.isNotEmpty() }
            .filter {
                val lower = it.lowercase()
                lower.contains("youtube.com") || lower.contains("youtu.be") || lower.contains("bilibili.com") || lower.contains("b23.tv")
            }
            .distinctBy { it.lowercase() }
            .take(4)
    }

    fun loadInspirations() {
        scope.launch {
            try {
                val path = "/api/inspirations?" + ApiClient.query(
                    mapOf("city" to city, "country" to country),
                )
                val data = ApiClient.get<List<InspirationPost>>(session.apiBaseUrl, path, session.token.ifBlank { null })
                inspirations.clear(); inspirations.addAll(data)
            } catch (_: Exception) {
                inspirations.clear()
            }
        }
    }

    fun createInspiration() {
        scope.launch {
            if (session.token.isBlank()) {
                message = "请先登录后发布灵感"
                return@launch
            }
            val title = inspirationTitle.trim()
            val content = inspirationContent.trim()
            val normalizedCity = city.trim()
            val normalizedCountry = country.trim()
            if (title.isEmpty() || content.isEmpty() || normalizedCity.isEmpty() || normalizedCountry.isEmpty()) {
                message = "请填写标题、内容、城市和国家和地区"
                return@launch
            }
            loading = true
            try {
                val cover = normalizeHttpUrl(inspirationCoverUrl)
                val body = CreateInspirationBody(
                    title = title,
                    city = normalizedCity,
                    country = normalizedCountry,
                    tags = parseListInput(inspirationTags).take(12),
                    places = parseListInput(inspirationPlaces).take(20),
                    coverImageUrl = cover.ifBlank { null },
                    photoUrls = normalizePhotoUrls(inspirationPhotoUrls, cover),
                    videoLinks = normalizeVideoUrls(inspirationVideoLinks),
                    content = content,
                )
                ApiClient.post<InspirationPost, CreateInspirationBody>(
                    baseUrl = session.apiBaseUrl,
                    path = "/api/inspirations",
                    body = body,
                    token = session.token.ifBlank { null },
                )
                inspirationTitle = ""
                inspirationTags = ""
                inspirationPlaces = ""
                inspirationCoverUrl = ""
                inspirationPhotoUrls = ""
                inspirationVideoLinks = ""
                inspirationContent = ""
                message = "灵感已发布"
                loadInspirations()
            } catch (e: Exception) {
                message = e.message ?: "发布失败"
            } finally {
                loading = false
            }
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
        val allowed = grants[Manifest.permission.ACCESS_FINE_LOCATION] == true || grants[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (!allowed) {
            message = "定位权限未开启"
            return@rememberLauncherForActivityResult
        }
        scope.launch {
            loading = true
            try {
                val location = fused.lastLocation.await()
                if (location == null) {
                    message = "暂时无法获取定位"
                } else {
                    val resolved = reverseGeocode(context, location.latitude, location.longitude)
                    city = resolved.first
                    country = resolved.second
                    message = "已定位：$city, $country"
                    refreshFeed()
                }
            } catch (e: Exception) {
                message = "定位失败：${e.message ?: "unknown"}"
            } finally {
                loading = false
            }
        }
    }

    LaunchedEffect(Unit) { refreshFeed() }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Discover")
                    Text("发现活动 -> 找到人 -> 发起路线")
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        ExposedDropdownMenuBox(expanded = countryExpanded, onExpandedChange = { countryExpanded = !countryExpanded }, modifier = Modifier.weight(1f)) {
                            OutlinedTextField(
                                value = country,
                                onValueChange = { country = it },
                                readOnly = false,
                                label = { Text("国家和地区") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = countryExpanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth(),
                            )
                            ExposedDropdownMenu(expanded = countryExpanded, onDismissRequest = { countryExpanded = false }) {
                                countryPresets.keys.forEach { c ->
                                    DropdownMenuItem(text = { Text(c) }, onClick = {
                                        country = c
                                        city = countryPresets[c]?.firstOrNull().orEmpty()
                                        countryExpanded = false
                                    })
                                }
                            }
                        }

                        ExposedDropdownMenuBox(expanded = cityExpanded, onExpandedChange = { cityExpanded = !cityExpanded }, modifier = Modifier.weight(1f)) {
                            OutlinedTextField(
                                value = city,
                                onValueChange = { city = it },
                                readOnly = false,
                                label = { Text("城市") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = cityExpanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth(),
                            )
                            ExposedDropdownMenu(expanded = cityExpanded, onDismissRequest = { cityExpanded = false }) {
                                (countryPresets[country] ?: emptyList()).forEach { c ->
                                    DropdownMenuItem(text = { Text(c) }, onClick = { city = c; cityExpanded = false })
                                }
                            }
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { refreshFeed() }, enabled = !loading) { Text("刷新发现流") }
                        Button(onClick = {
                            permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
                        }, enabled = !loading) { Text("使用当前位置") }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("即将开始的路线")
                    if (upcomingRoutes.isEmpty()) {
                        Text("暂无即将开始的路线")
                    } else {
                        upcomingRoutes.take(8).forEach { event ->
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp), modifier = Modifier.fillMaxWidth()) {
                                Text(event.title)
                                Text("${formatDateTime(event.startAt)} · ${event.venueName ?: "待定地点"}")
                                Text("${event.city.orEmpty()} ${event.country.orEmpty()}")
                            }
                        }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("群聊与社群")
                    if (interestGroups.isEmpty() && campusGroups.isEmpty()) {
                        Text("暂无可用群组")
                    }
                    interestGroups.take(6).forEach { group ->
                        val subtitle = "${group.interest ?: "兴趣"} · ${group.city.orEmpty()} ${group.country.orEmpty()}"
                        Button(onClick = {
                            val joined = group.members?.any { it.id == session.user?.id } == true
                            onOpenChat(ChatThreadType.INTEREST, group.id, group.name, subtitle, joined)
                        }, modifier = Modifier.fillMaxWidth()) {
                            Text("兴趣群：${group.name}")
                        }
                    }
                    campusGroups.take(4).forEach { group ->
                        val subtitle = group.campusName ?: "校园群"
                        Button(onClick = {
                            val joined = group.members?.any { it.id == session.user?.id } == true
                            onOpenChat(ChatThreadType.CAMPUS, group.id, group.name, subtitle, joined)
                        }, modifier = Modifier.fillMaxWidth()) {
                            Text("校园群：${group.name}")
                        }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(
                            "东京美食" to { city = "Tokyo"; country = "Japan"; category = "restaurant"; q = "ramen" },
                            "新加坡周末" to { city = "Singapore"; country = "Singapore"; category = "attraction"; q = "weekend" },
                            "桌游夜" to { city = "Singapore"; country = "Singapore"; category = "board game cafe"; q = "桌游" },
                        ).forEach { (name, act) -> AssistChip(onClick = act, label = { Text(name) }) }
                    }

                    OutlinedTextField(value = q, onValueChange = { q = it }, label = { Text("关键词") }, modifier = Modifier.fillMaxWidth())
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        categoryChips.forEach { chip ->
                            AssistChip(onClick = { category = chip }, label = { Text(if (category == chip) "$chip ✓" else chip) })
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Button(onClick = { searchPlaces(recommend = false) }, enabled = !loading, modifier = Modifier.weight(1f)) { Text("搜索真实地点") }
                        Button(onClick = { searchPlaces(recommend = true) }, enabled = !loading && session.token.isNotBlank(), modifier = Modifier.weight(1f)) { Text("猜你想去") }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("灵感分享（照片 + B站/YouTube）")
                    OutlinedTextField(
                        value = inspirationTitle,
                        onValueChange = { inspirationTitle = it },
                        label = { Text("标题") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = inspirationTags,
                            onValueChange = { inspirationTags = it },
                            label = { Text("标签（逗号分隔）") },
                            modifier = Modifier.weight(1f),
                        )
                        OutlinedTextField(
                            value = inspirationPlaces,
                            onValueChange = { inspirationPlaces = it },
                            label = { Text("地点（逗号分隔）") },
                            modifier = Modifier.weight(1f),
                        )
                    }
                    OutlinedTextField(
                        value = inspirationCoverUrl,
                        onValueChange = { inspirationCoverUrl = it },
                        label = { Text("封面图链接（可选）") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = inspirationPhotoUrls,
                        onValueChange = { inspirationPhotoUrls = it },
                        label = { Text("照片链接（多条可换行/逗号）") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                    )
                    OutlinedTextField(
                        value = inspirationVideoLinks,
                        onValueChange = { inspirationVideoLinks = it },
                        label = { Text("视频链接（仅 B站/YouTube）") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                    )
                    OutlinedTextField(
                        value = inspirationContent,
                        onValueChange = { inspirationContent = it },
                        label = { Text("攻略内容") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Button(onClick = { createInspiration() }, enabled = !loading, modifier = Modifier.weight(1f)) {
                            Text("发布灵感")
                        }
                        Button(onClick = { loadInspirations() }, enabled = !loading, modifier = Modifier.weight(1f)) {
                            Text("刷新灵感")
                        }
                    }
                    if (inspirations.isEmpty()) {
                        Text("暂无灵感内容")
                    } else {
                        inspirations.take(5).forEach { post ->
                            val coverUrl = normalizeHttpUrl(post.coverImageUrl.orEmpty())
                            val photoUrls = buildList {
                                if (coverUrl.isNotEmpty()) add(coverUrl)
                                post.photoUrls
                                    .orEmpty()
                                    .map(::normalizeHttpUrl)
                                    .filter { it.isNotEmpty() }
                                    .forEach { url ->
                                        if (none { it.equals(url, ignoreCase = true) }) add(url)
                                    }
                            }.take(6)
                            val videoLinks = post.videoLinks
                                .orEmpty()
                                .mapNotNull { item ->
                                    val clean = normalizeHttpUrl(item.url)
                                    if (clean.isEmpty()) {
                                        null
                                    } else {
                                        clean to (item.platform ?: if (clean.lowercase().contains("bili")) "bilibili" else "youtube")
                                    }
                                }
                                .distinctBy { it.first.lowercase() }
                                .take(3)
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp), modifier = Modifier.fillMaxWidth()) {
                                Text(post.title)
                                Text("${post.city.orEmpty()} ${post.country.orEmpty()} · 点赞 ${post.likes?.size ?: 0}")
                                post.content?.takeIf { it.isNotBlank() }?.let { Text(it) }
                                val mediaMeta = "图片 ${photoUrls.size} 张 · 视频 ${videoLinks.size} 条"
                                Text(mediaMeta)
                                if (photoUrls.isNotEmpty()) {
                                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        photoUrls.forEachIndexed { idx, url ->
                                            TextButton(onClick = { runCatching { uriHandler.openUri(url) } }) {
                                                Text("查看图片 ${idx + 1}")
                                            }
                                        }
                                    }
                                }
                                if (videoLinks.isNotEmpty()) {
                                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        videoLinks.forEach { (url, platform) ->
                                            val label = if (platform.lowercase().contains("bili")) "打开 B站视频" else "打开 YouTube 视频"
                                            TextButton(onClick = { runCatching { uriHandler.openUri(url) } }) {
                                                Text(label)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (message.isNotBlank()) {
            item { TwCard { Text(message) } }
        }

        if (places.isNotEmpty()) {
            item {
                TwCard {
                    val route = places.mapNotNull { place ->
                        if (place.lat != null && place.lng != null) {
                            RouteStop(
                                point = place.point,
                                matchedName = place.matchedName,
                                lat = place.lat,
                                lng = place.lng,
                                verified = true,
                                intro = place.intro,
                                rating = place.rating,
                                userRatingCount = place.userRatingCount,
                                recommendReason = place.recommendReason,
                            )
                        } else {
                            null
                        }
                    }
                    TwRouteMap(route = route)
                }
            }
        }

        items(places) { place ->
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(place.point)
                    place.intro?.let { Text(it) }
                    Text("评分：${place.rating ?: 0.0}")
                    place.recommendReason?.let { Text(it) }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = {
                            val joined = interestGroups.firstOrNull()?.members?.any { it.id == session.user?.id } == true
                            onOpenChat(
                                ChatThreadType.GLOBAL,
                                "global",
                                "Global 群聊",
                                "想去 ${place.point}，找搭子一起",
                                joined,
                            )
                        }) { Text("找搭子") }
                        TextButton(onClick = {
                            val seed = place.point
                            q = seed
                            category = place.primaryTypeOrCategory()
                        }) { Text("同款路线") }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

private fun DiscoveryPlace.primaryTypeOrCategory(): String = when {
    !priceLevel.isNullOrBlank() -> "restaurant"
    else -> "attraction"
}

private fun formatDateTime(iso: String?): String {
    if (iso.isNullOrBlank()) return "时间待定"
    return runCatching {
        val instant = java.time.OffsetDateTime.parse(iso)
        val fmt = java.time.format.DateTimeFormatter.ofPattern("MM-dd HH:mm")
        instant.format(fmt)
    }.getOrElse { iso }
}

@SuppressLint("MissingPermission")
private suspend fun reverseGeocode(context: android.content.Context, lat: Double, lng: Double): Pair<String, String> {
    return withContext(Dispatchers.IO) {
        runCatching {
            val geocoder = Geocoder(context, Locale.getDefault())
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                var city = ""
                var country = ""
                val lock = Object()
                geocoder.getFromLocation(lat, lng, 1) { list ->
                    val first = list.firstOrNull()
                    city = first?.locality ?: first?.subAdminArea ?: first?.adminArea.orEmpty()
                    country = first?.countryName.orEmpty()
                    synchronized(lock) { lock.notifyAll() }
                }
                synchronized(lock) { lock.wait(1200) }
                city to country
            } else {
                @Suppress("DEPRECATION")
                val list = geocoder.getFromLocation(lat, lng, 1)
                val first = list?.firstOrNull()
                val city = first?.locality ?: first?.subAdminArea ?: first?.adminArea.orEmpty()
                val country = first?.countryName.orEmpty()
                city to country
            }
        }.getOrElse { "" to "" }
    }
}
