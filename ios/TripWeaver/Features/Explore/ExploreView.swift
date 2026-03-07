import SwiftUI
import CoreLocation

private struct ExploreDestinationPreset: Identifiable {
    let country: String
    let cities: [String]
    var id: String { country }
}

private enum ExploreLocationError: LocalizedError {
    case permissionDenied
    case unavailable
    case requestInProgress

    var errorDescription: String? {
        switch self {
        case .permissionDenied:
            return "定位权限未开启，请在系统设置允许 TripWeaver 使用定位。"
        case .unavailable:
            return "当前无法获取定位，请稍后重试。"
        case .requestInProgress:
            return "定位请求进行中，请稍候。"
        }
    }
}

@MainActor
private final class ExploreLocationManager: NSObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()
    private var continuation: CheckedContinuation<CLLocationCoordinate2D, Error>?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func requestOneTimeLocation() async throws -> CLLocationCoordinate2D {
        if continuation != nil {
            throw ExploreLocationError.requestInProgress
        }
        return try await withCheckedThrowingContinuation { cont in
            continuation = cont
            let status = manager.authorizationStatus
            switch status {
            case .authorizedAlways, .authorizedWhenInUse:
                manager.requestLocation()
            case .notDetermined:
                manager.requestWhenInUseAuthorization()
            case .denied, .restricted:
                finish(with: .failure(ExploreLocationError.permissionDenied))
            @unknown default:
                finish(with: .failure(ExploreLocationError.unavailable))
            }
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard continuation != nil else { return }
        let status = manager.authorizationStatus
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            manager.requestLocation()
        case .denied, .restricted:
            finish(with: .failure(ExploreLocationError.permissionDenied))
        case .notDetermined:
            break
        @unknown default:
            finish(with: .failure(ExploreLocationError.unavailable))
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.first else {
            finish(with: .failure(ExploreLocationError.unavailable))
            return
        }
        finish(with: .success(location.coordinate))
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        finish(with: .failure(error))
    }

    private func finish(with result: Result<CLLocationCoordinate2D, Error>) {
        guard let continuation else { return }
        self.continuation = nil
        switch result {
        case .success(let coordinate):
            continuation.resume(returning: coordinate)
        case .failure(let error):
            continuation.resume(throwing: error)
        }
    }
}

struct ExploreView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var q = "聚餐"
    @State private var city = "Tokyo"
    @State private var country = "Japan"
    @State private var category = "restaurant"
    @State private var selectedCountryPreset = "Japan"
    @State private var selectedCityPreset = "Tokyo"
    @State private var locatingCurrentPosition = false
    @State private var locationHint = ""
    @StateObject private var locationManager = ExploreLocationManager()

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
                syncPresetSelectionFromLocation()
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
                destinationSelectorSection

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

    private var customLocationValue: String {
        "__custom__"
    }

    private var destinationPresets: [ExploreDestinationPreset] {
        [
            ExploreDestinationPreset(country: "Singapore", cities: ["Singapore"]),
            ExploreDestinationPreset(country: "Japan", cities: ["Tokyo", "Osaka", "Kyoto", "Sapporo", "Fukuoka"]),
            ExploreDestinationPreset(country: "South Korea", cities: ["Seoul", "Busan", "Jeju"]),
            ExploreDestinationPreset(country: "Thailand", cities: ["Bangkok", "Chiang Mai", "Phuket"]),
            ExploreDestinationPreset(country: "China", cities: ["Shanghai", "Beijing", "Shenzhen", "Guangzhou", "Chengdu"]),
            ExploreDestinationPreset(country: "Malaysia", cities: ["Kuala Lumpur", "Johor Bahru", "Penang"]),
            ExploreDestinationPreset(country: "Indonesia", cities: ["Jakarta", "Bali", "Yogyakarta"]),
        ]
    }

    private var cityPresetsForSelectedCountry: [String] {
        guard selectedCountryPreset != customLocationValue else { return [] }
        return destinationPresets.first(where: { $0.country == selectedCountryPreset })?.cities ?? []
    }

    private var destinationSelectorSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("目的地")
                .font(.subheadline.weight(.semibold))

            HStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("城市")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Picker("城市", selection: $selectedCityPreset) {
                        ForEach(cityPresetsForSelectedCountry, id: \.self) { item in
                            Text(item).tag(item)
                        }
                        Text("手动输入").tag(customLocationValue)
                    }
                    .pickerStyle(.menu)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }

                VStack(alignment: .leading, spacing: 6) {
                    Text("国家和地区")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Picker("国家和地区", selection: $selectedCountryPreset) {
                        ForEach(destinationPresets) { item in
                            Text(item.country).tag(item.country)
                        }
                        Text("手动输入").tag(customLocationValue)
                    }
                    .pickerStyle(.menu)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }
            }

            HStack(spacing: 8) {
                if selectedCityPreset == customLocationValue || selectedCountryPreset == customLocationValue {
                    field("城市（手动输入）", text: $city)
                    field("国家和地区（手动输入）", text: $country)
                } else {
                    Button("应用目的地") {
                        applyPresetLocation()
                    }
                    .buttonStyle(TWSecondaryButtonStyle())
                }

                Button(locatingCurrentPosition ? "定位中..." : "使用当前位置") {
                    Task { await fillLocationFromCurrentPosition() }
                }
                .buttonStyle(TWSecondaryButtonStyle())
                .disabled(locatingCurrentPosition)
            }

            if !locationHint.isEmpty {
                Text(locationHint)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .onChange(of: selectedCountryPreset) { _, value in
            if value == customLocationValue {
                selectedCityPreset = customLocationValue
                return
            }
            if !cityPresetsForSelectedCountry.contains(selectedCityPreset) {
                selectedCityPreset = cityPresetsForSelectedCountry.first ?? customLocationValue
            }
            applyPresetLocation()
            Task { await refreshDiscoverFeed() }
        }
        .onChange(of: selectedCityPreset) { _, value in
            if value != customLocationValue {
                city = value
            }
            applyPresetLocation()
            Task { await refreshDiscoverFeed() }
        }
    }

    private func quickChip(_ title: String, apply: @escaping () -> Void) -> some View {
        Button(title) {
            apply()
            syncPresetSelectionFromLocation()
        }
        .font(.caption.weight(.semibold))
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.white.opacity(0.85), in: Capsule())
        .buttonStyle(.plain)
    }

    private func syncPresetSelectionFromLocation() {
        let normalizedCountry = country.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedCity = city.trimmingCharacters(in: .whitespacesAndNewlines)
        if let preset = destinationPresets.first(where: { $0.country.compare(normalizedCountry, options: .caseInsensitive) == .orderedSame }) {
            selectedCountryPreset = preset.country
            if let matchedCity = preset.cities.first(where: { $0.compare(normalizedCity, options: .caseInsensitive) == .orderedSame }) {
                selectedCityPreset = matchedCity
            } else {
                selectedCityPreset = normalizedCity.isEmpty ? (preset.cities.first ?? customLocationValue) : customLocationValue
            }
        } else {
            selectedCountryPreset = normalizedCountry.isEmpty ? "Singapore" : customLocationValue
            selectedCityPreset = normalizedCity.isEmpty ? "Singapore" : customLocationValue
        }
    }

    private func applyPresetLocation() {
        if selectedCountryPreset != customLocationValue {
            country = selectedCountryPreset
        }
        if selectedCityPreset != customLocationValue {
            city = selectedCityPreset
        }
    }

    private func fillLocationFromCurrentPosition() async {
        locatingCurrentPosition = true
        defer { locatingCurrentPosition = false }
        do {
            let coordinate = try await locationManager.requestOneTimeLocation()
            let geocoder = CLGeocoder()
            let location = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
            let placemarks = try await geocoder.reverseGeocodeLocation(location)
            let placemark = placemarks.first
            let resolvedCity = (placemark?.locality ?? placemark?.subAdministrativeArea ?? placemark?.administrativeArea ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            let resolvedCountry = (placemark?.country ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !resolvedCity.isEmpty, !resolvedCountry.isEmpty else {
                throw ExploreLocationError.unavailable
            }
            city = resolvedCity
            country = resolvedCountry
            syncPresetSelectionFromLocation()
            locationHint = "已定位：\(resolvedCity), \(resolvedCountry)"
            await refreshDiscoverFeed()
        } catch {
            locationHint = "定位失败：\(error.localizedDescription)"
        }
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
