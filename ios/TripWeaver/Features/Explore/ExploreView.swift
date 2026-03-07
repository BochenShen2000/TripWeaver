import SwiftUI

private struct DiscoverQueryBody: Encodable {
    let q: String
    let city: String
    let country: String
    let category: String
    let limit: Int
}

struct ExploreView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var q = "ramen"
    @State private var city = "Tokyo"
    @State private var country = "Japan"
    @State private var category = "restaurant"
    @State private var places: [DiscoveryPlace] = []
    @State private var loading = false
    @State private var message = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 14) {
                    filterForm

                    HStack(spacing: 10) {
                        Button("搜索真实地点") {
                            Task { await searchPlaces() }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(loading)

                        Button("猜你想去") {
                            Task { await loadRecommendations() }
                        }
                        .buttonStyle(.bordered)
                        .disabled(loading || session.token.isEmpty)
                    }

                    if !message.isEmpty {
                        Text(message)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if !places.isEmpty {
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

                    LazyVStack(spacing: 10) {
                        ForEach(places) { place in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(place.point)
                                    .font(.headline)
                                if let intro = place.intro {
                                    Text(intro)
                                        .font(.footnote)
                                        .foregroundStyle(.secondary)
                                        .lineLimit(2)
                                }
                                HStack(spacing: 8) {
                                    if let rating = place.rating {
                                        Text("⭐️ \(rating, specifier: "%.1f")")
                                            .font(.caption)
                                    }
                                    if let reason = place.recommendReason, !reason.isEmpty {
                                        Text(reason)
                                            .font(.caption)
                                            .foregroundStyle(.indigo)
                                    }
                                }
                            }
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("附近发现")
            .overlay(alignment: .topTrailing) {
                if loading { ProgressView().padding() }
            }
        }
    }

    private var filterForm: some View {
        VStack(spacing: 10) {
            TextField("关键词", text: $q)
                .textFieldStyle(.roundedBorder)
            TextField("城市", text: $city)
                .textFieldStyle(.roundedBorder)
            TextField("国家", text: $country)
                .textFieldStyle(.roundedBorder)
            TextField("分类（restaurant/attraction/hotel）", text: $category)
                .textFieldStyle(.roundedBorder)
        }
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
