import SwiftUI
import MapKit

private struct CreateActivityBody: Encodable {
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

private struct SaveManualPlacesBody: Encodable {
    let city: String
    let country: String
    let places: [ManualPlaceInput]
}

private struct SaveManualPlacesResponse: Decodable {
    let ok: Bool
}

private struct PlanInputField: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.footnote)
                .foregroundStyle(.secondary)
            TextField(placeholder, text: $text)
                .keyboardType(keyboard)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
        }
    }
}

struct PlanView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var intent = IntentPayload()
    @State private var loading = false
    @State private var plan: Plan?
    @State private var errorMessage = ""
    @State private var activityMessage = ""
    @State private var showAdvanced = false
    @State private var startDateTime = Date()
    @State private var manualInput = ""
    @State private var manualPlaces: [ManualPlaceInput] = []
    @State private var manualSuggestions: [ManualPlaceInput] = []
    @State private var loadingSuggestions = false
    @State private var showMapPicker = false
    @State private var resolvingMapPoint = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradientBackground()

                AppPage {
                    quickEntryCard
                    inputCard
                    actionCard

                    if let plan {
                        planCard(plan)
                    }
                }
            }
            .navigationTitle("路线生成")
            .toolbarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .task(id: session.token) {
                await loadManualSuggestions(q: "")
            }
            .onChange(of: manualInput) { _, value in
                Task { await loadManualSuggestions(q: value) }
            }
        }
    }

    private var quickEntryCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("AI 活动发起器")
                    .font(.headline)
                Text("输入你的同伴和兴趣，自动生成可执行路线")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        quickTag("今晚 city walk") {
                            intent.timeSlot = "今天晚上"
                            intent.interest = "city walk"
                        }
                        quickTag("周末咖啡+展") {
                            intent.timeSlot = "周末半天"
                            intent.interest = "咖啡+看展"
                        }
                        quickTag("桌游局") {
                            intent.timeSlot = "今天晚上"
                            intent.interest = "桌游"
                        }
                        quickTag("公园野餐") {
                            intent.timeSlot = "周末半天"
                            intent.interest = "野餐"
                        }
                        quickTag("露营日") {
                            intent.timeSlot = "周末全天"
                            intent.interest = "露营"
                        }
                        quickTag("朋友聚餐") {
                            intent.timeSlot = "今天晚上"
                            intent.interest = "聚餐"
                        }
                        quickTag("情侣约会") {
                            intent.companion = "情侣"
                            intent.people = "2"
                            intent.interest = "夜景+餐厅"
                        }
                    }
                }
            }
        }
    }

    private var inputCard: some View {
        TWCard {
            VStack(spacing: 10) {
                PlanInputField(title: "兴趣", placeholder: "美食/看展/city walk/桌游/露营/野餐/聚餐", text: $intent.interest)
                HStack(spacing: 8) {
                    PlanInputField(title: "城市", placeholder: "Tokyo", text: $intent.city)
                    PlanInputField(title: "国家", placeholder: "Japan", text: $intent.country)
                }
                DatePicker(
                    "开始时间",
                    selection: $startDateTime,
                    displayedComponents: [.date, .hourAndMinute]
                )
                .datePickerStyle(.compact)
                .tint(AppTheme.brand)

                manualPlacesSection

                DisclosureGroup(isExpanded: $showAdvanced) {
                    VStack(spacing: 10) {
                        PlanInputField(title: "同伴关系", placeholder: "朋友/同学/情侣", text: $intent.companion)
                        PlanInputField(title: "人数", placeholder: "2", text: $intent.people, keyboard: .numberPad)
                        PlanInputField(title: "预算", placeholder: "低预算/中预算/高预算", text: $intent.budget)
                        PlanInputField(title: "时间段", placeholder: "今天晚上/周末半天", text: $intent.timeSlot)
                        PlanInputField(title: "区域（可选）", placeholder: "Tokyo, Japan", text: $intent.area)
                        PlanInputField(title: "结束日期", placeholder: "YYYY-MM-DD", text: $intent.endDate)
                        PlanInputField(title: "出发国家", placeholder: "Singapore", text: $intent.fromCountry)
                    }
                    .padding(.top, 8)
                } label: {
                    Text("高级参数")
                        .font(.subheadline.weight(.medium))
                }
            }
        }
    }

    private var actionCard: some View {
        TWCard {
            VStack(spacing: 8) {
                Button {
                    Task { await generatePlan() }
                } label: {
                    HStack {
                        if loading { ProgressView().tint(.white).controlSize(.small) }
                        Text(loading ? "生成中..." : "AI 生成路线")
                    }
                }
                .buttonStyle(TWPrimaryButtonStyle())
                .disabled(loading)

                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                if !activityMessage.isEmpty {
                    Text(activityMessage)
                        .font(.footnote)
                        .foregroundStyle(.green)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private var manualPlacesSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("手动地点（可选）")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Button(showMapPicker ? "收起地图" : "地图标点") {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        showMapPicker.toggle()
                    }
                }
                .font(.caption.weight(.semibold))
                .foregroundStyle(AppTheme.brandDeep)
            }

            HStack(spacing: 8) {
                TextField("输入地点名，如：Shibuya Sky", text: $manualInput)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                Button("添加") {
                    addManualPlaceFromText()
                }
                .buttonStyle(TWSecondaryButtonStyle())
                .frame(width: 86)
                .disabled(manualInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }

            if loadingSuggestions {
                HStack(spacing: 8) {
                    ProgressView()
                        .controlSize(.small)
                    Text("加载历史地点中...")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            if !manualSuggestions.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(manualSuggestions.prefix(8)) { place in
                            Button(place.name) {
                                addManualPlace(place, persist: false)
                            }
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.white.opacity(0.82), in: Capsule())
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, 2)
                }
            }

            if showMapPicker {
                ManualPlaceMapPicker(places: manualPlaces) { coordinate in
                    Task { await resolveMapPointAndAdd(coordinate) }
                }
                if resolvingMapPoint {
                    Text("正在校验地图标点附近真实地点...")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            if !manualPlaces.isEmpty {
                VStack(spacing: 6) {
                    ForEach(manualPlaces) { place in
                        HStack(spacing: 8) {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(place.name)
                                    .font(.subheadline.weight(.semibold))
                                    .lineLimit(1)
                                Text(displayLocation(place))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                            }
                            Spacer()
                            Button {
                                removeManualPlace(place)
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundStyle(.secondary)
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
            }
        }
    }

    private func quickTag(_ label: String, apply: @escaping () -> Void) -> some View {
        Button(label) {
            apply()
        }
        .font(.caption.weight(.semibold))
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.white.opacity(0.85), in: Capsule())
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func planCard(_ plan: Plan) -> some View {
        TWCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(plan.title)
                    .font(.title3.bold())

                if let narrative = plan.narrative {
                    VStack(alignment: .leading, spacing: 5) {
                        if let hook = narrative.hook, !hook.isEmpty {
                            Text(hook)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(AppTheme.brandDeep)
                        }
                        if let vibe = narrative.vibe, !vibe.isEmpty {
                            Text(vibe)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        if let insights = narrative.searchInsights, !insights.isEmpty {
                            ForEach(Array(insights.prefix(3).enumerated()), id: \.offset) { _, item in
                                Text("• \(item)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 9)
                    .background(Color.white.opacity(0.76), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                }

                if let budget = plan.budgetEstimate {
                    Text("预算：\(budget)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                if let summary = plan.routeSummary {
                    Text("总路径：约 \(summary.distanceKm ?? 0, specifier: "%.1f") km / \(summary.durationMin ?? 0) 分钟")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                PlaceMapView(route: plan.route)

                VStack(spacing: 8) {
                    ForEach(Array(plan.route.enumerated()), id: \.element.id) { idx, stop in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(idx + 1). \((stop.date ?? "")) \((stop.time ?? "")) \(stop.point)")
                                .font(.subheadline.weight(.semibold))
                            if let intro = stop.intro {
                                Text(intro)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(3)
                            }
                            if let reason = stop.recommendReason, !reason.isEmpty {
                                Text(reason)
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.brandDeep)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 9)
                        .background(Color.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                    }
                }

                if let reason = plan.reason, !reason.isEmpty {
                    Text(reason)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Button("一键发起活动") {
                    Task { await createActivity(from: plan) }
                }
                .buttonStyle(TWSecondaryButtonStyle())
            }
        }
    }

    private func generatePlan() async {
        loading = true
        errorMessage = ""
        activityMessage = ""
        defer { loading = false }

        syncStartDateTimeToIntent()
        var requestIntent = intent

        if requestIntent.area.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            let c = requestIntent.city.trimmingCharacters(in: .whitespacesAndNewlines)
            let k = requestIntent.country.trimmingCharacters(in: .whitespacesAndNewlines)
            if !c.isEmpty || !k.isEmpty {
                requestIntent.area = [c, k].filter { !$0.isEmpty }.joined(separator: ", ")
            }
        }
        requestIntent.seedPoints = manualPlaces.isEmpty ? nil : manualPlaces.map(\.name)
        requestIntent.manualPlaces = manualPlaces.isEmpty ? nil : manualPlaces

        do {
            let result: Plan = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/generate-plan",
                method: .post,
                token: session.token,
                body: requestIntent
            )
            plan = result
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func createActivity(from plan: Plan) async {
        do {
            let body = CreateActivityBody(
                id: plan.id,
                title: plan.title,
                budgetEstimate: plan.budgetEstimate,
                reason: plan.reason,
                route: plan.route,
                routePath: plan.routePath,
                validationSummary: plan.validationSummary,
                routeSummary: plan.routeSummary,
                bookingLinks: plan.bookingLinks
            )
            let result: GenerateActivityResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/create-activity",
                method: .post,
                token: session.token,
                body: body
            )
            let when = formatShortTime(result.startAt)
            let whereText = result.venueName ?? "待定地点"
            activityMessage = "活动已发起：\(result.code ?? "-") · \(when) @ \(whereText)"
        } catch {
            activityMessage = "发起失败：\(error.localizedDescription)"
        }
    }

    private func addManualPlaceFromText() {
        let text = manualInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        let place = ManualPlaceInput(
            name: text,
            placeId: nil,
            lat: nil,
            lng: nil,
            city: intent.city,
            country: intent.country,
            address: nil,
            source: "manual_text",
            count: nil,
            lastAt: nil,
            score: nil
        )
        addManualPlace(place, persist: true)
        manualInput = ""
    }

    private func addManualPlace(_ place: ManualPlaceInput, persist: Bool) {
        let candidate = normalizedManualPlace(place)
        let existed = manualPlaces.contains { $0.id == candidate.id || normalizeName($0.name) == normalizeName(candidate.name) }
        if !existed {
            manualPlaces.append(candidate)
        }
        if persist {
            Task {
                await saveManualPlaces([candidate])
                await loadManualSuggestions(q: "")
            }
        }
    }

    private func removeManualPlace(_ place: ManualPlaceInput) {
        manualPlaces.removeAll { $0.id == place.id }
    }

    private func normalizedManualPlace(_ place: ManualPlaceInput) -> ManualPlaceInput {
        ManualPlaceInput(
            name: place.name.trimmingCharacters(in: .whitespacesAndNewlines),
            placeId: place.placeId,
            lat: place.lat,
            lng: place.lng,
            city: (place.city?.isEmpty == false ? place.city : intent.city),
            country: (place.country?.isEmpty == false ? place.country : intent.country),
            address: place.address,
            source: place.source ?? "manual_input",
            count: place.count,
            lastAt: place.lastAt,
            score: place.score
        )
    }

    private func normalizeName(_ value: String) -> String {
        value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    private func displayLocation(_ place: ManualPlaceInput) -> String {
        if let address = place.address, !address.isEmpty {
            return address
        }
        var items: [String] = []
        if let city = place.city, !city.isEmpty { items.append(city) }
        if let country = place.country, !country.isEmpty { items.append(country) }
        if items.isEmpty, let lat = place.lat, let lng = place.lng {
            return "\(String(format: "%.5f", lat)), \(String(format: "%.5f", lng))"
        }
        return items.isEmpty ? "手动地点" : items.joined(separator: ", ")
    }

    private func loadManualSuggestions(q: String) async {
        guard !session.token.isEmpty else {
            manualSuggestions = []
            return
        }
        loadingSuggestions = true
        defer { loadingSuggestions = false }
        do {
            var comps = URLComponents(string: "/api/preferences/manual-places")
            comps?.queryItems = [
                URLQueryItem(name: "q", value: q.trimmingCharacters(in: .whitespacesAndNewlines)),
                URLQueryItem(name: "city", value: intent.city),
                URLQueryItem(name: "country", value: intent.country),
                URLQueryItem(name: "limit", value: "12"),
            ]
            let path = comps?.string ?? "/api/preferences/manual-places"
            let result: [ManualPlaceInput] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            manualSuggestions = result
        } catch {
            manualSuggestions = []
        }
    }

    private func saveManualPlaces(_ places: [ManualPlaceInput]) async {
        guard !session.token.isEmpty else { return }
        guard !places.isEmpty else { return }
        let body = SaveManualPlacesBody(
            city: intent.city,
            country: intent.country,
            places: places
        )
        do {
            let _: SaveManualPlacesResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/preferences/manual-places",
                method: .post,
                token: session.token,
                body: body
            )
        } catch {
            // ignore persist errors; user can still continue planning
        }
    }

    private func resolveMapPointAndAdd(_ coordinate: CLLocationCoordinate2D) async {
        resolvingMapPoint = true
        defer { resolvingMapPoint = false }

        do {
            var comps = URLComponents(string: "/api/places/reverse")
            comps?.queryItems = [
                URLQueryItem(name: "lat", value: String(coordinate.latitude)),
                URLQueryItem(name: "lng", value: String(coordinate.longitude)),
                URLQueryItem(name: "city", value: intent.city),
                URLQueryItem(name: "country", value: intent.country),
            ]
            let path = comps?.string ?? "/api/places/reverse?lat=\(coordinate.latitude)&lng=\(coordinate.longitude)"
            let place: DiscoveryPlace = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            let manual = ManualPlaceInput(
                name: place.point,
                placeId: place.placeId,
                lat: place.lat,
                lng: place.lng,
                city: intent.city,
                country: intent.country,
                address: nil,
                source: "map_pin",
                count: nil,
                lastAt: nil,
                score: nil
            )
            addManualPlace(manual, persist: true)
        } catch {
            let latText = String(format: "%.4f", coordinate.latitude)
            let lngText = String(format: "%.4f", coordinate.longitude)
            let fallback = ManualPlaceInput(
                name: "地图标点 \(latText), \(lngText)",
                placeId: nil,
                lat: coordinate.latitude,
                lng: coordinate.longitude,
                city: intent.city,
                country: intent.country,
                address: nil,
                source: "map_pin",
                count: nil,
                lastAt: nil,
                score: nil
            )
            addManualPlace(fallback, persist: true)
        }
    }

    private func syncStartDateTimeToIntent() {
        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = "yyyy-MM-dd"
        intent.startDate = dayFormatter.string(from: startDateTime)

        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm"
        intent.startTime = timeFormatter.string(from: startDateTime)
    }

    private func formatShortTime(_ iso: String?) -> String {
        guard let iso, !iso.isEmpty else { return "时间待定" }
        let inFmt = ISO8601DateFormatter()
        guard let date = inFmt.date(from: iso) else { return iso }
        let outFmt = DateFormatter()
        outFmt.dateFormat = "MM-dd HH:mm"
        return outFmt.string(from: date)
    }
}

private struct ManualPlaceMapPicker: View {
    let places: [ManualPlaceInput]
    let onPick: (CLLocationCoordinate2D) -> Void

    @State private var position: MapCameraPosition = .automatic

    var body: some View {
        ZStack(alignment: .topLeading) {
            MapReader { proxy in
                Map(position: $position) {
                    ForEach(Array(places.enumerated()), id: \.element.id) { idx, place in
                        if let lat = place.lat, let lng = place.lng {
                            Marker("\(idx + 1). \(place.name)", coordinate: CLLocationCoordinate2D(latitude: lat, longitude: lng))
                                .tint(AppTheme.brand)
                        }
                    }
                }
                .mapStyle(.standard(elevation: .realistic))
                .gesture(
                    SpatialTapGesture().onEnded { value in
                        guard let coordinate = proxy.convert(value.location, from: .local) else { return }
                        onPick(coordinate)
                    }
                )
            }

            Text("点地图可添加地点")
                .font(.caption2.weight(.semibold))
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background(Color.white.opacity(0.9), in: Capsule())
                .padding(10)
        }
        .frame(height: 220)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.white.opacity(0.7), lineWidth: 1)
        }
        .onAppear {
            fitToPins()
        }
        .onChange(of: places.map(\.id).joined(separator: "|")) { _, _ in
            fitToPins()
        }
    }

    private func fitToPins() {
        let coords = places.compactMap { place -> CLLocationCoordinate2D? in
            guard let lat = place.lat, let lng = place.lng else { return nil }
            return CLLocationCoordinate2D(latitude: lat, longitude: lng)
        }
        guard !coords.isEmpty else { return }
        if coords.count == 1 {
            position = .region(
                MKCoordinateRegion(
                    center: coords[0],
                    span: MKCoordinateSpan(latitudeDelta: 0.03, longitudeDelta: 0.03)
                )
            )
            return
        }

        let lats = coords.map(\.latitude)
        let lngs = coords.map(\.longitude)
        guard let minLat = lats.min(), let maxLat = lats.max(), let minLng = lngs.min(), let maxLng = lngs.max() else { return }
        position = .region(
            MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2),
                span: MKCoordinateSpan(
                    latitudeDelta: max(0.03, (maxLat - minLat) * 1.8),
                    longitudeDelta: max(0.03, (maxLng - minLng) * 1.8)
                )
            )
        )
    }
}
