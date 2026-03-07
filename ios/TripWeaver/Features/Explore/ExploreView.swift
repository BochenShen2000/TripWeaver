import SwiftUI

struct ExploreView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var q = "聚餐"
    @State private var city = "Tokyo"
    @State private var country = "Japan"
    @State private var category = "restaurant"

    @State private var places: [DiscoveryPlace] = []
    @State private var upcomingRoutes: [DiscoveryRouteEvent] = []
    @State private var interestGroups: [InterestGroup] = []
    @State private var campusGroups: [CampusGroup] = []

    @State private var loading = false
    @State private var message = ""

    private let categoryChips = ["restaurant", "museum", "park", "campground", "board game cafe", "cafe", "attraction", "hotel"]

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradientBackground()

                AppPage {
                    discoverHeaderCard
                    upcomingRoutesCard
                    groupChatsCard
                    queryCard
                    actionCard

                    if !places.isEmpty {
                        mapCard
                        placesCard
                    }
                }
            }
            .navigationTitle("发现")
            .toolbarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .overlay(alignment: .topTrailing) {
                if loading { ProgressView().padding(10) }
            }
            .task {
                await refreshDiscoverFeed()
            }
        }
    }

    private var discoverHeaderCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Discover")
                    .font(.title3.weight(.bold))
                Text("发现活动 -> 找到人 -> 发起路线")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

                HStack(spacing: 8) {
                    field("城市", text: $city)
                    field("国家", text: $country)
                }

                Button("刷新发现流") {
                    Task { await refreshDiscoverFeed() }
                }
                .buttonStyle(TWSecondaryButtonStyle())
            }
        }
    }

    private var upcomingRoutesCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("即将开始的路线")
                        .font(.headline)
                    Spacer()
                    Text("\(upcomingRoutes.count) 条")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if upcomingRoutes.isEmpty {
                    Text("暂无即将开始的路线，你可以先在路线页发起一个活动。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(upcomingRoutes.prefix(8)) { event in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(event.title)
                                .font(.subheadline.weight(.semibold))
                            HStack(spacing: 8) {
                                Label(formatDateTime(event.startAt), systemImage: "calendar")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Label(event.venueName ?? "待定地点", systemImage: "mappin.and.ellipse")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Text("\(event.city ?? "") \(event.country ?? "")")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 9)
                        .background(Color.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                    }
                }
            }
        }
    }

    private var groupChatsCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("群聊与社群")
                    .font(.headline)

                if interestGroups.isEmpty && campusGroups.isEmpty {
                    Text("暂无可用群组，先在聊天页创建一个兴趣群。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                ForEach(interestGroups.prefix(6)) { group in
                    let subtitle = "\(group.interest ?? "兴趣") · \(group.city ?? "") \(group.country ?? "") · \(group.visibilityLabel)"
                    NavigationLink {
                        CommunityChatView(
                            communityId: group.id,
                            communityName: group.name,
                            subtitle: subtitle,
                            type: .interest,
                            initiallyMember: isCurrentUserMember(group.members)
                        )
                    } label: {
                        groupRow(
                            title: group.name,
                            subtitle: subtitle,
                            nextTime: group.nextMeetupAt,
                            badge: interestGroupBadge(group)
                        )
                    }
                    .buttonStyle(.plain)
                }

                ForEach(campusGroups.prefix(4)) { group in
                    NavigationLink {
                        CommunityChatView(
                            communityId: group.id,
                            communityName: group.name,
                            subtitle: group.campusName ?? "校园群",
                            type: .campus,
                            initiallyMember: isCurrentUserMember(group.members)
                        )
                    } label: {
                        groupRow(
                            title: group.name,
                            subtitle: group.campusName ?? "校园群",
                            nextTime: nil,
                            badge: "校园"
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func groupRow(title: String, subtitle: String, nextTime: String?, badge: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 7) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                    Text(badge)
                        .font(.caption2.weight(.semibold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(AppTheme.brand.opacity(0.16), in: Capsule())
                        .foregroundStyle(AppTheme.brandDeep)
                }
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                if let nextTime, !nextTime.isEmpty {
                    Text("下次活动：\(formatDateTime(nextTime))")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .background(Color.white.opacity(0.8), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
    }

    private func interestGroupBadge(_ group: InterestGroup) -> String {
        switch group.resolvedVisibility {
        case .public:
            return "公开"
        case .campus:
            return "同校"
        case .invite:
            return "邀请"
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
                    quickChip("桌游夜") {
                        city = "Singapore"
                        country = "Singapore"
                        category = "board game cafe"
                        q = "桌游"
                    }
                    quickChip("野餐公园") {
                        city = "Tokyo"
                        country = "Japan"
                        category = "park"
                        q = "picnic"
                    }
                    Spacer(minLength: 0)
                }

                field("关键词", text: $q)

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

    private func refreshDiscoverFeed() async {
        loading = true
        defer { loading = false }
        await loadUpcomingRoutes()
        await loadInterestGroups()
        await loadCampusGroups()
    }

    private func loadUpcomingRoutes() async {
        do {
            var comps = URLComponents(string: "/api/discovery/upcoming-routes")
            comps?.queryItems = [
                URLQueryItem(name: "city", value: city),
                URLQueryItem(name: "country", value: country),
                URLQueryItem(name: "limit", value: "8"),
            ]
            let path = comps?.string ?? "/api/discovery/upcoming-routes"
            let result: [DiscoveryRouteEvent] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            upcomingRoutes = result
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadInterestGroups() async {
        do {
            var comps = URLComponents(string: "/api/interest/groups")
            comps?.queryItems = [
                URLQueryItem(name: "city", value: city),
                URLQueryItem(name: "country", value: country),
            ]
            let path = comps?.string ?? "/api/interest/groups"
            let result: [InterestGroup] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            interestGroups = result
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadCampusGroups() async {
        guard !session.token.isEmpty else {
            campusGroups = []
            return
        }
        do {
            let result: [CampusGroup] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/campus/groups",
                token: session.token
            )
            campusGroups = result
        } catch {
            campusGroups = []
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

    private func formatDateTime(_ iso: String?) -> String {
        guard let iso, !iso.isEmpty else { return "时间待定" }
        let inFmt = ISO8601DateFormatter()
        guard let date = inFmt.date(from: iso) else { return iso }
        let outFmt = DateFormatter()
        outFmt.dateFormat = "MM-dd HH:mm"
        return outFmt.string(from: date)
    }

    private func isCurrentUserMember(_ members: [AuthUser]?) -> Bool {
        guard let members, let myId = session.user?.id, !myId.isEmpty else { return false }
        return members.contains(where: { $0.id == myId })
    }
}
