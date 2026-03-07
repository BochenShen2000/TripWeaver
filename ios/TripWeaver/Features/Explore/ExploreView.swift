import SwiftUI

struct ExploreView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var q = "ramen"
    @State private var city = "Tokyo"
    @State private var country = "Japan"
    @State private var category = "restaurant"
    @State private var places: [DiscoveryPlace] = []
    @State private var loading = false
    @State private var message = ""

    private let categoryChips = ["restaurant", "attraction", "hotel", "museum", "cafe"]

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradientBackground()

                ScrollView {
                    VStack(spacing: 12) {
                        queryCard
                        actionCard

                        if !places.isEmpty {
                            mapCard
                            placesCard
                        }
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 12)
                }
            }
            .navigationTitle("附近发现")
            .toolbarTitleDisplayMode(.inline)
            .overlay(alignment: .topTrailing) {
                if loading { ProgressView().padding(10) }
            }
        }
    }

    private var queryCard: some View {
        TWCard {
            VStack(spacing: 9) {
                HStack(spacing: 8) {
                    quickChip("东京美食") {
                        city = "Tokyo"
                        country = "Japan"
                        category = "restaurant"
                        q = "ramen"
                    }
                    quickChip("新加坡周末") {
                        city = "Singapore"
                        country = "Singapore"
                        category = "attraction"
                        q = "weekend"
                    }
                    Spacer(minLength: 0)
                }

                field("关键词", text: $q)
                HStack(spacing: 8) {
                    field("城市", text: $city)
                    field("国家", text: $country)
                }

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 7) {
                        ForEach(categoryChips, id: \.self) { item in
                            Button(item) {
                                category = item
                            }
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(
                                category == item ? AppTheme.brand.opacity(0.18) : Color.white.opacity(0.82),
                                in: Capsule()
                            )
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    private var actionCard: some View {
        TWCard {
            VStack(spacing: 8) {
                HStack(spacing: 8) {
                    Button("搜索真实地点") {
                        Task { await searchPlaces() }
                    }
                    .buttonStyle(TWPrimaryButtonStyle())
                    .disabled(loading)

                    Button("猜你想去") {
                        Task { await loadRecommendations() }
                    }
                    .buttonStyle(TWSecondaryButtonStyle())
                    .disabled(loading || session.token.isEmpty)
                }

                if !message.isEmpty {
                    Text(message)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private var mapCard: some View {
        TWCard {
            PlaceMapView(route: places.map { place in
                RouteStop(
                    point: place.point,
                    matchedName: place.matchedName,
                    lat: place.lat,
                    lng: place.lng,
                    verified: true,
                    intro: place.intro,
                    primaryType: nil,
                    rating: place.rating,
                    userRatingCount: place.userRatingCount,
                    date: "",
                    time: "",
                    googleMapsUri: place.googleMapsUri,
                    recommendReason: place.recommendReason
                )
            })
        }
    }

    private var placesCard: some View {
        TWCard {
            VStack(spacing: 9) {
                ForEach(places) { place in
                    VStack(alignment: .leading, spacing: 5) {
                        Text(place.point)
                            .font(.headline)
                        if let intro = place.intro {
                            Text(intro)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                                .lineLimit(3)
                        }
                        HStack(spacing: 8) {
                            if let rating = place.rating {
                                Text("⭐️ \(rating, specifier: "%.1f")")
                                    .font(.caption)
                            }
                            if let reason = place.recommendReason, !reason.isEmpty {
                                Text(reason)
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.brandDeep)
                                    .lineLimit(1)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 9)
                    .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }
            }
        }
    }

    private func field(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
    }

    private func quickChip(_ title: String, apply: @escaping () -> Void) -> some View {
        Button(title) {
            apply()
        }
        .font(.caption.weight(.semibold))
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.white.opacity(0.85), in: Capsule())
        .buttonStyle(.plain)
    }

    private func searchPlaces() async {
        loading = true
        defer { loading = false }
        do {
            let query = URLQueryItem(name: "q", value: q)
            let queryCity = URLQueryItem(name: "city", value: city)
            let queryCountry = URLQueryItem(name: "country", value: country)
            let queryCategory = URLQueryItem(name: "category", value: category)
            let queryLimit = URLQueryItem(name: "limit", value: "8")

            var comps = URLComponents(string: "/api/discovery/places")
            comps?.queryItems = [query, queryCity, queryCountry, queryCategory, queryLimit]
            let path = comps?.string ?? "/api/discovery/places"

            let result: [DiscoveryPlace] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            places = result
            message = "找到 \(result.count) 个地点"
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadRecommendations() async {
        guard !session.token.isEmpty else {
            message = "请先登录再拉取个性化推荐"
            return
        }
        loading = true
        defer { loading = false }
        do {
            var comps = URLComponents(string: "/api/discovery/recommendations")
            comps?.queryItems = [
                URLQueryItem(name: "city", value: city),
                URLQueryItem(name: "country", value: country),
                URLQueryItem(name: "limit", value: "8"),
            ]
            let path = comps?.string ?? "/api/discovery/recommendations"
            let result: [DiscoveryPlace] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            places = result
            message = "基于你的偏好推荐 \(result.count) 个地点"
        } catch {
            message = error.localizedDescription
        }
    }
}
