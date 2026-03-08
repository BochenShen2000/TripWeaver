package com.tripweaver.android.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AuthUser(
    val id: String,
    val username: String,
    val displayName: String,
    val email: String? = null,
    val phone: String? = null,
    val campusVerified: Boolean? = null,
    val campusName: String? = null,
    val campusEmail: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class AuthResponse(
    val token: String,
    val user: AuthUser,
    val created: Boolean? = null,
)

@Serializable
data class MeResponse(val user: AuthUser)

@Serializable
data class IntentPayload(
    val companion: String = "朋友",
    val people: String = "2",
    val budget: String = "中预算",
    val timeSlot: String = "周末半天",
    val interest: String = "美食",
    val area: String = "",
    val city: String,
    val country: String,
    val startDate: String = "",
    val endDate: String = "",
    val startTime: String = "",
    val fromCountry: String = "",
    val seedPoints: List<String>? = null,
    val manualPlaces: List<ManualPlaceInput>? = null,
)

@Serializable
data class ManualPlaceInput(
    val name: String,
    val placeId: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val city: String? = null,
    val country: String? = null,
    val address: String? = null,
    val source: String? = null,
    val count: Int? = null,
    val lastAt: String? = null,
    val score: Double? = null,
)

@Serializable
data class Plan(
    val id: String,
    val title: String,
    val budgetEstimate: String? = null,
    val reason: String? = null,
    val route: List<RouteStop> = emptyList(),
    val routePath: List<RoutePathPoint>? = null,
    val validationSummary: ValidationSummary? = null,
    val routeSummary: RouteSummary? = null,
    val bookingLinks: BookingLinks? = null,
    val narrative: PlanNarrative? = null,
)

@Serializable
data class PlanNarrative(
    val hook: String? = null,
    val vibe: String? = null,
    val searchInsights: List<String>? = null,
    val llmEnhanced: Boolean? = null,
)

@Serializable
data class ValidationSummary(
    val total: Int? = null,
    val verified: Int? = null,
    val realtime: Boolean? = null,
    val multiDay: Int? = null,
)

@Serializable
data class RouteSummary(
    val distanceKm: Double? = null,
    val durationMin: Int? = null,
)

@Serializable
data class BookingLinks(
    val flights: String? = null,
    val hotels: String? = null,
    val attractions: String? = null,
)

@Serializable
data class RoutePathPoint(val lat: Double, val lng: Double)

@Serializable
data class RouteStop(
    val point: String,
    val matchedName: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val verified: Boolean? = null,
    val intro: String? = null,
    val primaryType: String? = null,
    val rating: Double? = null,
    val userRatingCount: Int? = null,
    val date: String? = null,
    val time: String? = null,
    val googleMapsUri: String? = null,
    val recommendReason: String? = null,
)

@Serializable
data class GenerateActivityResponse(
    val code: String? = null,
    val title: String? = null,
    val schedule: String? = null,
    val link: String? = null,
    val startAt: String? = null,
    val endAt: String? = null,
    val venueName: String? = null,
    val city: String? = null,
    val country: String? = null,
    val privacy: String? = null,
    val localEventId: String? = null,
)

@Serializable
data class DiscoveryPlace(
    val point: String,
    val matchedName: String? = null,
    val placeId: String? = null,
    val lat: Double? = null,
    val lng: Double? = null,
    val intro: String? = null,
    val rating: Double? = null,
    val userRatingCount: Int? = null,
    val openNow: Boolean? = null,
    val priceLevel: String? = null,
    val recommendReason: String? = null,
    val googleMapsUri: String? = null,
    val coverImageUrl: String? = null,
)

@Serializable
data class InspirationVideoLink(
    val url: String,
    val platform: String? = null,
)

@Serializable
data class InspirationPost(
    val id: String,
    val title: String,
    val content: String? = null,
    val city: String? = null,
    val country: String? = null,
    val tags: List<String>? = null,
    val places: List<String>? = null,
    val photoUrls: List<String>? = null,
    val videoLinks: List<InspirationVideoLink>? = null,
    val coverImageUrl: String? = null,
    val source: String? = null,
    val creator: AuthUser? = null,
    val likes: List<String>? = null,
    val createdAt: String? = null,
)

@Serializable
data class ChatGeo(
    val lat: Double? = null,
    val lng: Double? = null,
    val label: String? = null,
)

@Serializable
data class InterestActivityPayload(
    val id: String,
    val theme: String? = null,
    val description: String? = null,
    val startAt: String? = null,
    val endAt: String? = null,
    val venueName: String? = null,
    val city: String? = null,
    val country: String? = null,
    val geo: ChatGeo? = null,
    val googleMapsUri: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class ChatMessage(
    val id: String,
    val content: String,
    val user: AuthUser? = null,
    val fromUserId: String? = null,
    val toUserId: String? = null,
    val kind: String? = null,
    val geo: ChatGeo? = null,
    val activity: InterestActivityPayload? = null,
    val createdAt: String? = null,
)

@Serializable
data class FriendRequest(
    val id: String,
    val fromUserId: String,
    val toUserId: String,
    val status: String,
    val createdAt: String? = null,
    val respondedAt: String? = null,
)

@Serializable
data class FriendsPayload(
    val friends: List<AuthUser> = emptyList(),
    val requests: List<FriendRequest> = emptyList(),
)

@Serializable
data class CampusGroup(
    val id: String,
    val name: String,
    val description: String? = null,
    val campusName: String? = null,
    val members: List<AuthUser>? = null,
    val createdAt: String? = null,
)

@Serializable
enum class InterestGroupVisibility {
    @SerialName("public")
    PUBLIC,

    @SerialName("campus")
    CAMPUS,

    @SerialName("invite")
    INVITE,
}

@Serializable
data class InterestGroup(
    val id: String,
    val name: String,
    val interest: String? = null,
    val city: String? = null,
    val country: String? = null,
    val description: String? = null,
    val visibility: String? = null,
    val campusOnly: Boolean? = null,
    val campusName: String? = null,
    val allowedUserIds: List<String>? = null,
    val nextMeetupAt: String? = null,
    val nextActivity: InterestActivityPayload? = null,
    val members: List<AuthUser>? = null,
    val createdAt: String? = null,
)

@Serializable
data class EventGeo(
    val lat: Double? = null,
    val lng: Double? = null,
)

@Serializable
data class DiscoveryRouteEvent(
    val id: String,
    val title: String,
    val category: String? = null,
    val city: String? = null,
    val country: String? = null,
    val venueName: String? = null,
    val startAt: String? = null,
    val endAt: String? = null,
    val description: String? = null,
    val price: Double? = null,
    val currency: String? = null,
    val tags: List<String>? = null,
    val source: String? = null,
    val geo: EventGeo? = null,
    val route: List<RouteStop>? = null,
    val routePath: List<RoutePathPoint>? = null,
)

@Serializable
data class CampusVerifyResponse(
    val user: AuthUser,
    val campusVerified: Boolean? = null,
    val campusName: String? = null,
)

@Serializable
data class RequestCodeResponse(
    val identifierHint: String,
    val debugCode: String? = null,
)

@Serializable
data class InterestActivityPublishResponse(
    val ok: Boolean? = null,
    val groupId: String? = null,
    val activity: InterestActivityPayload? = null,
    val message: ChatMessage? = null,
)

@Serializable
data class ApiErrorResponse(
    val error: String? = null,
    val detail: String? = null,
)
