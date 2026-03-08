package com.tripweaver.android.features.plan

import android.location.Location
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
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
import com.tripweaver.android.model.DiscoveryPlace
import com.tripweaver.android.model.Plan
import com.tripweaver.android.model.RoutePathPoint
import com.tripweaver.android.model.RouteStop
import com.tripweaver.android.model.RouteSummary
import com.tripweaver.android.model.ValidationSummary
import com.tripweaver.android.ui.TwCard
import com.tripweaver.android.ui.TwRouteMap
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

private data class ManualRouteDraftStop(
    val id: String,
    val point: String = "",
    val matchedName: String = "",
    val dateTime: String = "",
    val intro: String = "",
    val recommendReason: String = "",
    val lat: String = "",
    val lng: String = "",
    val googleMapsUri: String = "",
    val verified: Boolean = false,
)

@Composable
fun ManualRouteScreen(
    session: SessionStore,
    onBack: () -> Unit,
    onComplete: (Plan) -> Unit,
) {
    val scope = rememberCoroutineScope()

    var title by remember { mutableStateOf("我的旅行路线") }
    var city by remember { mutableStateOf("Singapore") }
    var country by remember { mutableStateOf("Singapore") }
    var note by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }
    var verifyingStopId by remember { mutableStateOf("") }

    val now = remember { System.currentTimeMillis() }
    val stops = remember {
        mutableStateListOf(
            createDraftStop(now + 2 * 3600_000L),
            createDraftStop(now + 3 * 3600_000L + 1800_000L),
        )
    }

    val previewRoute = stops.mapNotNull { draftToRouteStop(it) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("手动添加路线")
                    Text("逐站填写地点与时间，完成后回填到路线页并可直接发起活动。")
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = onBack) { Text("返回") }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("路线标题") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = city,
                            onValueChange = { city = it },
                            label = { Text("城市") },
                            modifier = Modifier.weight(1f),
                        )
                        OutlinedTextField(
                            value = country,
                            onValueChange = { country = it },
                            label = { Text("国家和地区") },
                            modifier = Modifier.weight(1f),
                        )
                    }
                    OutlinedTextField(
                        value = note,
                        onValueChange = { note = it },
                        label = { Text("路线说明（可选）") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                    )
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("路线站点")
                    Button(
                        onClick = {
                            val seedMs = parseDraftDateTime(stops.lastOrNull()?.dateTime)?.atZone(ZoneId.systemDefault())?.toInstant()?.toEpochMilli()
                                ?: System.currentTimeMillis() + 2 * 3600_000L
                            stops.add(createDraftStop(seedMs + 90 * 60_000L))
                        },
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("新增一站")
                    }
                }
            }
        }

        itemsIndexed(stops, key = { _, item -> item.id }) { index, stop ->
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("第 ${index + 1} 站")
                    OutlinedTextField(
                        value = stop.point,
                        onValueChange = { value ->
                            stops[index] = stop.copy(point = value)
                        },
                        label = { Text("地点名") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    OutlinedTextField(
                        value = stop.dateTime,
                        onValueChange = { value -> stops[index] = stop.copy(dateTime = value) },
                        label = { Text("到达时间（YYYY-MM-DDTHH:mm）") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = stop.lat,
                            onValueChange = { value ->
                                stops[index] = stop.copy(lat = value)
                            },
                            label = { Text("纬度") },
                            modifier = Modifier.weight(1f),
                        )
                        OutlinedTextField(
                            value = stop.lng,
                            onValueChange = { value ->
                                stops[index] = stop.copy(lng = value)
                            },
                            label = { Text("经度") },
                            modifier = Modifier.weight(1f),
                        )
                    }
                    OutlinedTextField(
                        value = stop.intro,
                        onValueChange = { value -> stops[index] = stop.copy(intro = value) },
                        label = { Text("地点介绍") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                    )
                    OutlinedTextField(
                        value = stop.recommendReason,
                        onValueChange = { value -> stops[index] = stop.copy(recommendReason = value) },
                        label = { Text("推荐理由") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        TextButton(
                            onClick = {
                                if (index <= 0) return@TextButton
                                val current = stops.removeAt(index)
                                stops.add(index - 1, current)
                            },
                            enabled = index > 0,
                            modifier = Modifier.weight(1f),
                        ) { Text("上移") }
                        TextButton(
                            onClick = {
                                if (index >= stops.lastIndex) return@TextButton
                                val current = stops.removeAt(index)
                                stops.add(index + 1, current)
                            },
                            enabled = index < stops.lastIndex,
                            modifier = Modifier.weight(1f),
                        ) { Text("下移") }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        TextButton(
                            onClick = {
                                scope.launch {
                                    val point = stop.point.trim()
                                    if (point.isEmpty()) {
                                        message = "请先填写地点名再校验。"
                                        return@launch
                                    }
                                    val normalizedCity = city.trim()
                                    val normalizedCountry = country.trim()
                                    if (normalizedCity.isEmpty() || normalizedCountry.isEmpty()) {
                                        message = "请先填写城市和国家和地区。"
                                        return@launch
                                    }
                                    verifyingStopId = stop.id
                                    runCatching {
                                        verifyDraftStopFromApi(
                                            session = session,
                                            stop = stop,
                                            city = normalizedCity,
                                            country = normalizedCountry,
                                        )
                                    }.onSuccess { verified ->
                                        val currentIdx = stops.indexOfFirst { it.id == stop.id }
                                        if (currentIdx >= 0) {
                                            stops[currentIdx] = verified
                                        }
                                        message = "已校验：${verified.point}"
                                    }.onFailure { err ->
                                        message = err.message ?: "校验失败"
                                    }
                                    verifyingStopId = ""
                                }
                            },
                            modifier = Modifier.weight(1f),
                        ) {
                            Text(if (verifyingStopId == stop.id) "校验中..." else "校验真实地点")
                        }
                        TextButton(
                            onClick = {
                                if (stops.size <= 1) {
                                    message = "至少保留 1 站"
                                    return@TextButton
                                }
                                stops.removeAt(index)
                            },
                            modifier = Modifier.weight(1f),
                        ) { Text("删除") }
                    }
                }
            }
        }

        if (previewRoute.any { it.lat != null && it.lng != null }) {
            item {
                TwCard {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("地图预览")
                        TwRouteMap(route = previewRoute)
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (message.isNotBlank()) {
                        Text(message)
                    }
                    Button(
                        onClick = {
                            scope.launch {
                                saving = true
                                runCatching {
                                    buildManualPlan(
                                        title = title,
                                        city = city,
                                        country = country,
                                        note = note,
                                        stops = stops.toList(),
                                    )
                                }.onSuccess { plan ->
                                    onComplete(plan)
                                }.onFailure { err ->
                                    message = err.message ?: "回填失败"
                                }
                                saving = false
                            }
                        },
                        enabled = !saving,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text(if (saving) "处理中..." else "完成并回填到路线页")
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

private fun createDraftStop(seedMillis: Long): ManualRouteDraftStop {
    return ManualRouteDraftStop(
        id = "mrs_${System.nanoTime()}",
        dateTime = formatDraftDateTime(seedMillis),
    )
}

private fun formatDraftDateTime(timeMillis: Long): String {
    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")
    return LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(timeMillis), ZoneId.systemDefault()).format(formatter)
}

private fun parseDraftDateTime(text: String): LocalDateTime? {
    val input = text.trim()
    if (input.isBlank()) return null
    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm")
    return runCatching { LocalDateTime.parse(input, formatter) }.getOrNull()
}

private fun parseDraftCoord(text: String): Double? {
    val value = text.trim()
    if (value.isEmpty()) return null
    return value.toDoubleOrNull()
}

private fun draftToRouteStop(draft: ManualRouteDraftStop): RouteStop? {
    val point = draft.point.trim()
    if (point.isEmpty()) return null
    val dt = parseDraftDateTime(draft.dateTime)
    val date = dt?.toLocalDate()?.toString()
    val time = dt?.toLocalTime()?.toString()?.take(5)
    val lat = parseDraftCoord(draft.lat)
    val lng = parseDraftCoord(draft.lng)
    val mapsUri = draft.googleMapsUri.trim().ifBlank {
        if (lat != null && lng != null) {
            "https://www.google.com/maps?q=${"%.5f".format(lat)},${"%.5f".format(lng)}"
        } else {
            ""
        }
    }
    return RouteStop(
        point = point,
        matchedName = draft.matchedName.trim().ifBlank { null },
        lat = lat,
        lng = lng,
        verified = draft.verified || (lat != null && lng != null),
        intro = draft.intro.trim().ifBlank { null },
        primaryType = null,
        rating = null,
        userRatingCount = null,
        date = date,
        time = time,
        googleMapsUri = mapsUri.ifBlank { null },
        recommendReason = draft.recommendReason.trim().ifBlank { null },
    )
}

private fun buildManualPlan(
    title: String,
    city: String,
    country: String,
    note: String,
    stops: List<ManualRouteDraftStop>,
): Plan {
    val normalizedTitle = title.trim()
    val normalizedCity = city.trim()
    val normalizedCountry = country.trim()
    if (normalizedTitle.isEmpty()) throw IllegalArgumentException("请填写路线标题")
    if (normalizedCity.isEmpty() || normalizedCountry.isEmpty()) throw IllegalArgumentException("请填写城市和国家和地区")

    val route = stops.mapNotNull { draftToRouteStop(it) }
    if (route.isEmpty()) throw IllegalArgumentException("请至少填写一个有效站点")

    val routePath = route
        .mapNotNull { stop ->
            val lat = stop.lat
            val lng = stop.lng
            if (lat != null && lng != null) RoutePathPoint(lat = lat, lng = lng) else null
        }
        .takeIf { it.size >= 2 }

    val days = route.mapNotNull { it.date?.trim()?.takeIf { d -> d.isNotEmpty() } }.toSet()
    val summary = computeManualRouteSummary(route)

    return Plan(
        id = "PLAN-MANUAL-${System.currentTimeMillis()}",
        title = normalizedTitle,
        budgetEstimate = "中预算",
        reason = note.trim().ifBlank { "这条路线由你手动创建，可继续编辑并直接发起活动。" },
        route = route,
        routePath = routePath,
        validationSummary = ValidationSummary(
            total = route.size,
            verified = route.count { it.verified == true },
            realtime = true,
            multiDay = if (days.isEmpty()) 1 else days.size,
        ),
        routeSummary = summary,
        bookingLinks = null,
        narrative = null,
    )
}

private fun computeManualRouteSummary(route: List<RouteStop>): RouteSummary? {
    if (route.isEmpty()) return null

    var totalDistanceKm = 0.0
    var hasDistance = false
    route.windowed(size = 2, step = 1).forEach { pair ->
        val a = pair[0]
        val b = pair[1]
        val lat1 = a.lat
        val lng1 = a.lng
        val lat2 = b.lat
        val lng2 = b.lng
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return@forEach
        val result = FloatArray(1)
        Location.distanceBetween(lat1, lng1, lat2, lng2, result)
        totalDistanceKm += (result[0] / 1000.0)
        hasDistance = true
    }

    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
    val first = route.firstOrNull()?.let { stop ->
        val d = stop.date?.trim().orEmpty()
        val t = stop.time?.trim().orEmpty()
        if (d.isNotEmpty() && t.isNotEmpty()) runCatching { LocalDateTime.parse("$d $t", formatter) }.getOrNull() else null
    }
    val last = route.lastOrNull()?.let { stop ->
        val d = stop.date?.trim().orEmpty()
        val t = stop.time?.trim().orEmpty()
        if (d.isNotEmpty() && t.isNotEmpty()) runCatching { LocalDateTime.parse("$d $t", formatter) }.getOrNull() else null
    }

    val durationMin = if (first != null && last != null && last.isAfter(first)) {
        java.time.Duration.between(first, last).toMinutes().toInt()
    } else {
        null
    }

    if (!hasDistance && durationMin == null) return null
    return RouteSummary(
        distanceKm = if (hasDistance) (kotlin.math.round(totalDistanceKm * 100.0) / 100.0) else null,
        durationMin = durationMin,
    )
}

private suspend fun verifyDraftStopFromApi(
    session: SessionStore,
    stop: ManualRouteDraftStop,
    city: String,
    country: String,
): ManualRouteDraftStop {
    val query = ApiClient.query(
        mapOf(
            "q" to stop.point.trim(),
            "city" to city,
            "country" to country,
            "limit" to "1",
        ),
    )
    val path = if (query.isBlank()) "/api/discovery/places" else "/api/discovery/places?$query"
    val result: List<DiscoveryPlace> = ApiClient.get(
        baseUrl = session.apiBaseUrl,
        path = path,
        token = session.token.ifBlank { null },
    )
    val best = result.firstOrNull() ?: throw IllegalArgumentException("未找到匹配地点")
    return stop.copy(
        point = best.point.ifBlank { stop.point },
        matchedName = best.matchedName.orEmpty(),
        intro = stop.intro.ifBlank { best.intro.orEmpty() },
        recommendReason = stop.recommendReason.ifBlank { best.recommendReason.orEmpty() },
        lat = best.lat?.toString() ?: stop.lat,
        lng = best.lng?.toString() ?: stop.lng,
        googleMapsUri = best.googleMapsUri.orEmpty().ifBlank { stop.googleMapsUri },
        verified = true,
    )
}
