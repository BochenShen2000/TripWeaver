package com.tripweaver.android.features.plan

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
import androidx.compose.ui.unit.dp
import com.google.android.gms.location.LocationServices
import com.tripweaver.android.core.ApiClient
import com.tripweaver.android.core.ApiException
import com.tripweaver.android.core.SessionStore
import com.tripweaver.android.model.GenerateActivityResponse
import com.tripweaver.android.model.IntentPayload
import com.tripweaver.android.model.ManualPlaceInput
import com.tripweaver.android.model.Plan
import com.tripweaver.android.model.RouteStop
import com.tripweaver.android.ui.TwCard
import com.tripweaver.android.ui.TwRouteMap
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Serializable
private data class LaunchConfigBody(
    val title: String,
    val calendar: String,
    val privacy: String,
    val timezone: String,
    val startAt: String,
    val endAt: String,
    val venueName: String,
    val description: String,
    val ticketPrice: String,
    val requiresApproval: Boolean,
    val attendeeLimit: Int,
    val theme: String,
    val coverImage: String? = null,
)

@Serializable
private data class CreateActivityBody(
    val id: String,
    val title: String,
    val budgetEstimate: String? = null,
    val reason: String? = null,
    val route: List<RouteStop>,
    val routePath: List<com.tripweaver.android.model.RoutePathPoint>? = null,
    val launchConfig: LaunchConfigBody,
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun PlanScreen(
    session: SessionStore,
    onOpenManualRoute: () -> Unit = {},
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
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

    var companion by remember { mutableStateOf("朋友") }
    var people by remember { mutableStateOf("2") }
    var budget by remember { mutableStateOf("中预算") }
    var timeSlot by remember { mutableStateOf("周末半天") }
    var interest by remember { mutableStateOf("city walk") }
    var area by remember { mutableStateOf("") }
    var country by remember { mutableStateOf("Singapore") }
    var city by remember { mutableStateOf("Singapore") }
    var startDateTime by remember { mutableStateOf(localDateTimeInput(Date(System.currentTimeMillis() + 2 * 3600_000))) }
    var endDate by remember { mutableStateOf("") }
    var fromCountry by remember { mutableStateOf("") }

    var manualInput by remember { mutableStateOf("") }
    val manualPlaces = remember { mutableStateListOf<ManualPlaceInput>() }

    var plan by remember { mutableStateOf<Plan?>(null) }
    var loading by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf("") }

    var countryExpanded by remember { mutableStateOf(false) }
    var cityExpanded by remember { mutableStateOf(false) }

    var launchPrivacy by remember { mutableStateOf("私密") }
    var launchTitle by remember { mutableStateOf("") }
    var launchVenue by remember { mutableStateOf("") }
    var launchDescription by remember { mutableStateOf("") }
    var launching by remember { mutableStateOf(false) }

    LaunchedEffect(session.pendingManualPlan?.id) {
        val pending = session.pendingManualPlan ?: return@LaunchedEffect
        plan = pending
        launchTitle = pending.title
        launchVenue = pending.route.firstOrNull()?.point.orEmpty()
        launchDescription = pending.reason.orEmpty()
        message = "已回填手动路线 ${pending.route.size} 站"
        session.setPendingManualPlan(null)
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
                    area = listOf(city, country).filter { it.isNotBlank() }.joinToString(", ")
                    message = "已定位：$city, $country"
                }
            } catch (e: Exception) {
                message = "定位失败：${e.message ?: "unknown"}"
            } finally {
                loading = false
            }
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
                    Text("AI 活动发起器")
                    Text("输入同伴和兴趣，自动生成可执行路线")
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(
                            "今晚 city walk" to { interest = "city walk"; timeSlot = "今天晚上" },
                            "周末咖啡+展" to { interest = "咖啡+看展"; timeSlot = "周末半天" },
                            "桌游局" to { interest = "桌游"; timeSlot = "今天晚上" },
                            "公园野餐" to { interest = "野餐"; timeSlot = "周末半天" },
                            "露营日" to { interest = "露营"; timeSlot = "周末全天" },
                            "朋友聚餐" to { interest = "聚餐"; timeSlot = "今天晚上" },
                        ).forEach { (label, action) ->
                            AssistChip(onClick = action, label = { Text(label) })
                        }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = interest, onValueChange = { interest = it }, label = { Text("兴趣") }, modifier = Modifier.fillMaxWidth())
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
                                    DropdownMenuItem(
                                        text = { Text(c) },
                                        onClick = {
                                            country = c
                                            city = countryPresets[c]?.firstOrNull().orEmpty()
                                            countryExpanded = false
                                        },
                                    )
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

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        Button(onClick = {
                            permissionLauncher.launch(
                                arrayOf(
                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                    Manifest.permission.ACCESS_COARSE_LOCATION,
                                ),
                            )
                        }) {
                            Text("使用当前位置")
                        }
                        TextButton(onClick = { area = listOf(city, country).filter { it.isNotBlank() }.joinToString(", ") }) {
                            Text("填入区域")
                        }
                    }

                    OutlinedTextField(value = startDateTime, onValueChange = { startDateTime = it }, label = { Text("开始时间(YYYY-MM-DDTHH:mm)") }, modifier = Modifier.fillMaxWidth())

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(value = companion, onValueChange = { companion = it }, label = { Text("同伴关系") }, modifier = Modifier.weight(1f))
                        OutlinedTextField(value = people, onValueChange = { people = it }, label = { Text("人数") }, modifier = Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(value = budget, onValueChange = { budget = it }, label = { Text("预算") }, modifier = Modifier.weight(1f))
                        OutlinedTextField(value = timeSlot, onValueChange = { timeSlot = it }, label = { Text("时间段") }, modifier = Modifier.weight(1f))
                    }
                    OutlinedTextField(value = area, onValueChange = { area = it }, label = { Text("区域") }, modifier = Modifier.fillMaxWidth())
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(value = endDate, onValueChange = { endDate = it }, label = { Text("结束日期(可选)") }, modifier = Modifier.weight(1f))
                        OutlinedTextField(value = fromCountry, onValueChange = { fromCountry = it }, label = { Text("出发国家(可选)") }, modifier = Modifier.weight(1f))
                    }

                    OutlinedTextField(value = manualInput, onValueChange = { manualInput = it }, label = { Text("手动地点（可选）") }, modifier = Modifier.fillMaxWidth())
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = {
                            val name = manualInput.trim()
                            if (name.isNotEmpty()) {
                                manualPlaces.add(ManualPlaceInput(name = name, city = city, country = country, source = "manual_input"))
                                manualInput = ""
                            }
                        }) { Text("添加地点") }
                        if (manualPlaces.isNotEmpty()) {
                            TextButton(onClick = { manualPlaces.clear() }) { Text("清空") }
                        }
                    }
                    if (manualPlaces.isNotEmpty()) {
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            manualPlaces.forEachIndexed { index, place ->
                                AssistChip(
                                    onClick = { manualPlaces.removeAt(index) },
                                    label = { Text(place.name) },
                                )
                            }
                        }
                    }

                    Button(
                        onClick = {
                            scope.launch {
                                loading = true
                                message = ""
                                try {
                                    val normalizedStart = parseDateTimeInput(startDateTime)
                                    val payload = IntentPayload(
                                        companion = companion,
                                        people = people,
                                        budget = budget,
                                        timeSlot = timeSlot,
                                        interest = interest,
                                        area = area.ifBlank { listOf(city, country).joinToString(", ") },
                                        city = city,
                                        country = country,
                                        startDate = normalizedStart.first,
                                        startTime = normalizedStart.second,
                                        endDate = endDate,
                                        fromCountry = fromCountry,
                                        manualPlaces = manualPlaces.toList().takeIf { it.isNotEmpty() },
                                        seedPoints = manualPlaces.map { it.name }.takeIf { it.isNotEmpty() },
                                    )
                                    val resp = ApiClient.post<Plan, IntentPayload>(
                                        baseUrl = session.apiBaseUrl,
                                        path = "/api/generate-plan",
                                        body = payload,
                                        token = session.token.ifBlank { null },
                                    )
                                    plan = resp
                                    launchTitle = resp.title
                                    launchVenue = resp.route.firstOrNull()?.point.orEmpty()
                                    launchDescription = resp.reason.orEmpty()
                                    message = "已生成 ${resp.route.size} 站"
                                } catch (e: Exception) {
                                    message = e.message ?: "生成失败"
                                } finally {
                                    loading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !loading,
                    ) {
                        Text(if (loading) "生成中..." else "AI 生成路线")
                    }

                    Button(
                        onClick = onOpenManualRoute,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("手动添加路线")
                    }
                }
            }
        }

        item {
            if (message.isNotBlank()) {
                TwCard { Text(message) }
            }
        }

        plan?.let { generated ->
            item {
                TwCard {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(generated.title)
                        generated.narrative?.hook?.takeIf { it.isNotBlank() }?.let { Text(it) }
                        generated.budgetEstimate?.let { Text("预算：$it") }
                        generated.routeSummary?.let { Text("总路径：约 ${it.distanceKm ?: 0.0} km / ${it.durationMin ?: 0} 分钟") }
                        TwRouteMap(route = generated.route, routePath = generated.routePath)
                    }
                }
            }

            item {
                TwCard {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("发起活动")
                        OutlinedTextField(value = launchTitle, onValueChange = { launchTitle = it }, label = { Text("活动标题") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = launchVenue, onValueChange = { launchVenue = it }, label = { Text("活动地点") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = launchDescription, onValueChange = { launchDescription = it }, label = { Text("活动描述") }, modifier = Modifier.fillMaxWidth())
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            AssistChip(onClick = { launchPrivacy = "私密" }, label = { Text(if (launchPrivacy == "私密") "私密 ✓" else "私密") })
                            AssistChip(onClick = { launchPrivacy = "公开" }, label = { Text(if (launchPrivacy == "公开") "公开 ✓" else "公开") })
                        }
                        Button(
                            onClick = {
                                scope.launch {
                                    launching = true
                                    try {
                                        val startAt = generated.route.firstOrNull()?.let { stopToIso(it) } ?: nowIso()
                                        val endAt = generated.route.lastOrNull()?.let { stopToIso(it) } ?: nowIso(3600_000)
                                        val body = CreateActivityBody(
                                            id = generated.id,
                                            title = launchTitle.ifBlank { generated.title },
                                            budgetEstimate = generated.budgetEstimate,
                                            reason = generated.reason,
                                            route = generated.route,
                                            routePath = generated.routePath,
                                            launchConfig = LaunchConfigBody(
                                                title = launchTitle.ifBlank { generated.title },
                                                calendar = "个人日历",
                                                privacy = launchPrivacy,
                                                timezone = "GMT+08:00 新加坡",
                                                startAt = startAt,
                                                endAt = endAt,
                                                venueName = launchVenue,
                                                description = launchDescription,
                                                ticketPrice = "免费",
                                                requiresApproval = false,
                                                attendeeLimit = 50,
                                                theme = "城市漫游",
                                            ),
                                        )
                                        val activity = ApiClient.post<GenerateActivityResponse, CreateActivityBody>(
                                            baseUrl = session.apiBaseUrl,
                                            path = "/api/create-activity",
                                            body = body,
                                            token = session.token.ifBlank { null },
                                        )
                                        message = "活动已创建：${activity.code ?: activity.title ?: "成功"}"
                                    } catch (e: Exception) {
                                        message = e.message ?: "创建活动失败"
                                    } finally {
                                        launching = false
                                    }
                                }
                            },
                            enabled = !launching,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(if (launching) "创建中..." else "一键创建活动")
                        }
                    }
                }
            }

            items(generated.route) { stop ->
                TwCard {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(listOf(stop.date, stop.time, stop.point).filter { !it.isNullOrBlank() }.joinToString(" "))
                        stop.intro?.takeIf { it.isNotBlank() }?.let { Text(it) }
                        stop.recommendReason?.takeIf { it.isNotBlank() }?.let { Text(it) }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

private fun parseDateTimeInput(input: String): Pair<String, String> {
    val normalized = input.trim()
    if (normalized.contains("T")) {
        val parts = normalized.split("T")
        if (parts.size >= 2) {
            val date = parts[0]
            val time = parts[1].take(5)
            return date to time
        }
    }
    return "" to ""
}

private fun localDateTimeInput(date: Date): String {
    val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault())
    return fmt.format(date)
}

private fun nowIso(offsetMs: Long = 0L): String =
    java.time.OffsetDateTime.now(java.time.ZoneOffset.UTC).plusNanos(offsetMs * 1_000_000).toString()

private fun stopToIso(stop: RouteStop): String {
    val day = stop.date.orEmpty()
    val hm = stop.time.orEmpty()
    return if (day.isNotBlank() && hm.isNotBlank()) {
        "${day}T${hm}:00+08:00"
    } else {
        nowIso()
    }
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
                    synchronized(lock) {
                        lock.notifyAll()
                    }
                }
                synchronized(lock) {
                    lock.wait(1200)
                }
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
