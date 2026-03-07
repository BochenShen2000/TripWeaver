import Foundation
import CoreLocation

struct AuthUser: Codable, Identifiable {
    let id: String
    let username: String
    let displayName: String
    let email: String?
    let phone: String?
    let campusVerified: Bool?
    let campusName: String?
    let campusEmail: String?
    let createdAt: String?
}

struct AuthResponse: Codable {
    let token: String
    let user: AuthUser
    let created: Bool?
}

struct MeResponse: Codable {
    let user: AuthUser
}

struct IntentPayload: Codable {
    var companion: String = "朋友"
    var people: String = "2"
    var budget: String = "中预算"
    var timeSlot: String = "周末半天"
    var interest: String = "美食"
    var area: String = "Tokyo, Japan"
    var city: String = ""
    var country: String = ""
    var startDate: String = ""
    var endDate: String = ""
    var fromCountry: String = ""
}

struct Plan: Codable, Identifiable {
    let id: String
    let title: String
    let budgetEstimate: String?
    let reason: String?
    let route: [RouteStop]
    let routePath: [RoutePathPoint]?
    let validationSummary: ValidationSummary?
    let routeSummary: RouteSummary?
    let bookingLinks: BookingLinks?
}

struct ValidationSummary: Codable {
    let total: Int?
    let verified: Int?
    let realtime: Bool?
    let multiDay: Int?
}

struct RouteSummary: Codable {
    let distanceKm: Double?
    let durationMin: Int?
}

struct BookingLinks: Codable {
    let flights: String?
    let hotels: String?
    let attractions: String?
}

struct RoutePathPoint: Codable {
    let lat: Double
    let lng: Double

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

struct RouteStop: Codable, Identifiable {
    let point: String
    let matchedName: String?
    let lat: Double?
    let lng: Double?
    let verified: Bool?
    let intro: String?
    let primaryType: String?
    let rating: Double?
    let userRatingCount: Int?
    let date: String?
    let time: String?
    let googleMapsUri: String?
    let recommendReason: String?

    var id: String {
        [date ?? "", time ?? "", point, String(lat ?? 0), String(lng ?? 0)].joined(separator: "|")
    }

    var coordinate: CLLocationCoordinate2D? {
        guard let lat, let lng else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

struct GenerateActivityResponse: Codable {
    let code: String?
    let title: String?
    let schedule: String?
    let link: String?
}

struct DiscoveryPlace: Codable, Identifiable {
    let point: String
    let matchedName: String?
    let lat: Double?
    let lng: Double?
    let intro: String?
    let rating: Double?
    let userRatingCount: Int?
    let openNow: Bool?
    let priceLevel: String?
    let recommendReason: String?
    let googleMapsUri: String?
    let coverImageUrl: String?

    var id: String {
        [point, String(lat ?? 0), String(lng ?? 0)].joined(separator: "|")
    }

    var coordinate: CLLocationCoordinate2D? {
        guard let lat, let lng else { return nil }
        return CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

struct APIErrorResponse: Codable {
    let error: String
}

struct ChatMessage: Codable, Identifiable {
    let id: String
    let content: String
    let user: AuthUser?
    let fromUserId: String?
    let toUserId: String?
    let createdAt: String?
}

struct FriendRequest: Codable, Identifiable {
    let id: String
    let fromUserId: String
    let toUserId: String
    let status: String
    let createdAt: String?
    let respondedAt: String?
}

struct FriendsPayload: Codable {
    let friends: [AuthUser]
    let requests: [FriendRequest]?
}

struct CampusGroup: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let campusName: String?
    let members: [AuthUser]?
    let createdAt: String?
}
