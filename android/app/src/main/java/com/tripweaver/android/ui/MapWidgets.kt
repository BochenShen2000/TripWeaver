package com.tripweaver.android.ui

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.MapProperties
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.Polyline
import com.google.maps.android.compose.rememberCameraPositionState
import com.tripweaver.android.model.RoutePathPoint
import com.tripweaver.android.model.RouteStop

@Composable
fun TwRouteMap(
    route: List<RouteStop>,
    routePath: List<RoutePathPoint>? = null,
    heightDp: Int = 220,
) {
    val points = route.mapNotNull { stop ->
        val lat = stop.lat
        val lng = stop.lng
        if (lat != null && lng != null) LatLng(lat, lng) else null
    }
    if (points.isEmpty()) return

    val first = points.first()
    val cameraState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(first, 12f)
    }
    val pathLatLng = routePath?.map { LatLng(it.lat, it.lng) }.orEmpty()

    GoogleMap(
        modifier = Modifier
            .fillMaxWidth()
            .height(heightDp.dp),
        cameraPositionState = cameraState,
        properties = MapProperties(isMyLocationEnabled = false),
    ) {
        points.forEachIndexed { idx, p ->
            val title = route.getOrNull(idx)?.point ?: "第${idx + 1}站"
            Marker(
                state = MarkerState(position = p),
                title = "${idx + 1}. $title",
            )
        }
        if (pathLatLng.size >= 2) {
            Polyline(points = pathLatLng, color = TwColors.Brand, width = 8f)
        } else if (points.size >= 2) {
            Polyline(points = points, color = TwColors.Brand, width = 8f)
        }
    }
}
