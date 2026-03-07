import SwiftUI
import MapKit
import PhotosUI
import UIKit

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
    let launchConfig: ActivityLaunchConfigBody?
}

private struct ActivityLaunchConfigBody: Encodable {
    let title: String
    let calendar: String
    let privacy: String
    let timezone: String
    let startAt: String
    let endAt: String
    let venueName: String
    let description: String
    let ticketPrice: String
    let requiresApproval: Bool
    let attendeeLimit: Int
    let theme: String
    let coverImage: String?
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

private struct EditableRouteStop: Identifiable, Hashable {
    let id: UUID
    var point: String
    var intro: String
    var recommendReason: String
    var dateTime: Date
    var matchedName: String?
    var lat: Double?
    var lng: Double?
    var verified: Bool?
    var primaryType: String?
    var rating: Double?
    var userRatingCount: Int?
    var googleMapsUri: String?

    init(_ stop: RouteStop) {
        id = UUID()
        point = stop.point
        intro = stop.intro ?? ""
        recommendReason = stop.recommendReason ?? ""
        dateTime = EditableRouteStop.parseDateTime(date: stop.date, time: stop.time) ?? Date()
        matchedName = stop.matchedName
        lat = stop.lat
        lng = stop.lng
        verified = stop.verified
        primaryType = stop.primaryType
        rating = stop.rating
        userRatingCount = stop.userRatingCount
        googleMapsUri = stop.googleMapsUri
    }

    func toRouteStop() -> RouteStop {
        let dayFormatter = DateFormatter()
        dayFormatter.dateFormat = "yyyy-MM-dd"
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm"
        return RouteStop(
            point: point.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "未命名地点" : point.trimmingCharacters(in: .whitespacesAndNewlines),
            matchedName: matchedName,
            lat: lat,
            lng: lng,
            verified: verified,
            intro: intro.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : intro.trimmingCharacters(in: .whitespacesAndNewlines),
            primaryType: primaryType,
            rating: rating,
            userRatingCount: userRatingCount,
            date: dayFormatter.string(from: dateTime),
            time: timeFormatter.string(from: dateTime),
            googleMapsUri: googleMapsUri,
            recommendReason: recommendReason.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : recommendReason.trimmingCharacters(in: .whitespacesAndNewlines)
        )
    }

    private static func parseDateTime(date: String?, time: String?) -> Date? {
        let day = (date ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let hm = (time ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !day.isEmpty, !hm.isEmpty else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        return formatter.date(from: "\(day) \(hm)")
    }
}

struct PlanView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
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
    @State private var editableStops: [EditableRouteStop] = []
    @State private var routeEditSnapshot: [EditableRouteStop] = []
    @State private var editingRoute = false
    @State private var launchCalendar = "个人日历"
    @State private var launchPrivacy = "私密"
    @State private var launchTitle = ""
    @State private var launchStartAt = Date()
    @State private var launchEndAt = Date().addingTimeInterval(3600)
    @State private var launchTimezone = "GMT+08:00 新加坡"
    @State private var launchVenue = ""
    @State private var launchDescription = ""
    @State private var launchTicketPrice = "免费"
    @State private var launchRequiresApproval = false
    @State private var launchAttendeeLimit = "50"
    @State private var launchTheme = "量子"
    @State private var launchCoverPickerItem: PhotosPickerItem?
    @State private var launchCoverImageData: Data?

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
            .onChange(of: launchCoverPickerItem) { _, item in
                Task {
                    guard let item else { return }
                    launchCoverImageData = try? await item.loadTransferable(type: Data.self)
                }
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
        let renderedPlan = mergedPlan(plan, with: editableStops)
        TWCard {
            VStack(alignment: .leading, spacing: 12) {
                planHeaderSection(title: renderedPlan.title, basePlan: plan)

                if let narrative = renderedPlan.narrative {
                    planNarrativeSection(narrative)
                }

                if let budget = renderedPlan.budgetEstimate {
                    Text("预算：\(budget)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                if let summary = renderedPlan.routeSummary {
                    let distance = summary.distanceKm ?? 0.0
                    let duration = summary.durationMin ?? 0
                    Text("总路径：约 \(distance, specifier: "%.1f") km / \(duration) 分钟")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                PlaceMapView(route: renderedPlan.route)

                routeStopsSection(renderedPlan: renderedPlan)

                if editingRoute {
                    Text("编辑中：调整站点顺序、时间、文案后点“保存修改”。地图会按当前编辑结果实时刷新。")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                activityComposerSection(renderedPlan)

                if let reason = renderedPlan.reason, !reason.isEmpty {
                    Text(reason)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Button("创建活动") {
                    Task {
                        await createActivity(from: renderedPlan, launchConfig: buildLaunchConfig())
                    }
                }
                .buttonStyle(TWSecondaryButtonStyle())
                .disabled(editingRoute || renderedPlan.route.isEmpty)
            }
        }
    }

    @ViewBuilder
    private func planHeaderSection(title: String, basePlan: Plan) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text(title)
                .font(.title3.bold())
            Spacer()
            if editingRoute {
                Button("取消") {
                    cancelRouteEditing()
                }
                .font(.caption.weight(.semibold))
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)

                Button("保存修改") {
                    saveRouteEditing(basePlan: basePlan)
                }
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(AppTheme.brand.opacity(0.14), in: Capsule())
                .buttonStyle(.plain)
            } else {
                Button("编辑路线") {
                    startRouteEditing(basePlan: basePlan)
                }
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(AppTheme.brand.opacity(0.14), in: Capsule())
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder
    private func planNarrativeSection(_ narrative: PlanNarrative) -> some View {
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

    @ViewBuilder
    private func routeStopsSection(renderedPlan: Plan) -> some View {
        VStack(spacing: 8) {
            if editingRoute {
                editableRouteStopsSection()
            } else {
                readOnlyRouteStopsSection(renderedPlan.route)
            }
        }
    }

    @ViewBuilder
    private func editableRouteStopsSection() -> some View {
        ForEach($editableStops) { $stop in
            let stopId = stop.id
            let idx = editableStops.firstIndex(where: { $0.id == stopId }) ?? 0
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("第 \(idx + 1) 站")
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Text(editableCoordinateText(stop))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                TextField("地点名称", text: $stop.point)
                    .textInputAutocapitalization(.words)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                DatePicker(
                    "到达时间",
                    selection: $stop.dateTime,
                    displayedComponents: [.date, .hourAndMinute]
                )
                .datePickerStyle(.compact)
                .tint(AppTheme.brand)
                TextField("地点介绍", text: $stop.intro, axis: .vertical)
                    .lineLimit(2...4)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                TextField("推荐理由", text: $stop.recommendReason, axis: .vertical)
                    .lineLimit(2...4)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                HStack(spacing: 8) {
                    Button("上移") {
                        moveEditableStop(stopId, offset: -1)
                    }
                    .buttonStyle(TWSecondaryButtonStyle())
                    .disabled(idx == 0)

                    Button("下移") {
                        moveEditableStop(stopId, offset: 1)
                    }
                    .buttonStyle(TWSecondaryButtonStyle())
                    .disabled(idx >= editableStops.count - 1)

                    Button("删除") {
                        removeEditableStop(stopId)
                    }
                    .buttonStyle(TWSecondaryButtonStyle())
                    .disabled(editableStops.count <= 1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10)
            .padding(.vertical, 9)
            .background(Color.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
        }

        Button {
            addEditableStop()
        } label: {
            Label("新增一站", systemImage: "plus.circle.fill")
        }
        .buttonStyle(TWSecondaryButtonStyle())
    }

    @ViewBuilder
    private func readOnlyRouteStopsSection(_ route: [RouteStop]) -> some View {
        ForEach(Array(route.enumerated()), id: \.offset) { idx, stop in
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

    private func mergedPlan(_ plan: Plan, with editableStops: [EditableRouteStop]) -> Plan {
        let resolvedRoute = editableStops.isEmpty ? plan.route : editableStops.map { $0.toRouteStop() }
        let routePath = buildRoutePath(for: resolvedRoute, fallback: plan.routePath)
        return Plan(
            id: plan.id,
            title: plan.title,
            budgetEstimate: plan.budgetEstimate,
            reason: plan.reason,
            route: resolvedRoute,
            routePath: routePath,
            validationSummary: plan.validationSummary,
            routeSummary: plan.routeSummary,
            bookingLinks: plan.bookingLinks,
            narrative: plan.narrative
        )
    }

    private func buildRoutePath(for route: [RouteStop], fallback: [RoutePathPoint]?) -> [RoutePathPoint]? {
        let points = route.compactMap { stop -> RoutePathPoint? in
            guard let lat = stop.lat, let lng = stop.lng else { return nil }
            return RoutePathPoint(lat: lat, lng: lng)
        }
        return points.count >= 2 ? points : fallback
    }

    private func editableCoordinateText(_ stop: EditableRouteStop) -> String {
        guard let lat = stop.lat, let lng = stop.lng else { return "坐标待补充" }
        return String(format: "%.4f, %.4f", lat, lng)
    }

    private func startRouteEditing(basePlan: Plan) {
        if editableStops.isEmpty {
            editableStops = basePlan.route.map(EditableRouteStop.init)
        }
        routeEditSnapshot = editableStops
        editingRoute = true
    }

    private func cancelRouteEditing() {
        editableStops = routeEditSnapshot
        editingRoute = false
    }

    private func saveRouteEditing(basePlan: Plan) {
        let updated = mergedPlan(basePlan, with: editableStops)
        plan = updated
        editableStops = updated.route.map(EditableRouteStop.init)
        routeEditSnapshot = editableStops
        syncLaunchComposer(with: updated, force: false)
        editingRoute = false
        activityMessage = "路线修改已保存，可直接发起活动。"
    }

    private func addEditableStop() {
        let seed = editableStops.last
        let stop = EditableRouteStop(
            RouteStop(
                point: "新地点",
                matchedName: nil,
                lat: seed?.lat,
                lng: seed?.lng,
                verified: nil,
                intro: "",
                primaryType: nil,
                rating: nil,
                userRatingCount: nil,
                date: nil,
                time: nil,
                googleMapsUri: nil,
                recommendReason: ""
            )
        )
        editableStops.append(stop)
    }

    private func moveEditableStop(_ id: UUID, offset: Int) {
        guard let currentIndex = editableStops.firstIndex(where: { $0.id == id }) else { return }
        let targetIndex = currentIndex + offset
        guard targetIndex >= 0, targetIndex < editableStops.count else { return }
        let item = editableStops.remove(at: currentIndex)
        editableStops.insert(item, at: targetIndex)
    }

    private func removeEditableStop(_ id: UUID) {
        editableStops.removeAll { $0.id == id }
        if editableStops.isEmpty, let first = plan?.route.first {
            editableStops = [EditableRouteStop(first)]
        }
    }

    @ViewBuilder
    private func activityComposerSection(_ plan: Plan) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                HStack(spacing: 12) {
                    Text("活动").font(.caption.weight(.bold)).foregroundStyle(.white)
                    Text("日历").font(.caption.weight(.semibold)).foregroundStyle(.white.opacity(0.78))
                    Text("发现").font(.caption.weight(.semibold)).foregroundStyle(.white.opacity(0.72))
                }
                Spacer()
                Text(launchCalendar)
                    .font(.caption2.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(.white.opacity(0.16), in: Capsule())
                Text(launchPrivacy)
                    .font(.caption2.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(.white.opacity(0.16), in: Capsule())
            }

            if horizontalSizeClass == .regular {
                HStack(alignment: .top, spacing: 10) {
                    launchCoverPanel
                    launchFieldsPanel
                }
            } else {
                launchCoverPanel
                launchFieldsPanel
            }
        }
        .padding(12)
        .background(
            LinearGradient(
                colors: [
                    Color(red: 0.16, green: 0.08, blue: 0.48),
                    Color(red: 0.20, green: 0.07, blue: 0.58),
                    Color(red: 0.14, green: 0.18, blue: 0.58),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 16, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.16), lineWidth: 1)
        )
        .onChange(of: launchStartAt) { _, _ in
            if launchEndAt <= launchStartAt {
                launchEndAt = launchStartAt.addingTimeInterval(3600)
            }
        }
    }

    private var launchCoverPanel: some View {
        VStack(alignment: .leading, spacing: 8) {
            ZStack {
                if let data = launchCoverImageData, let uiImage = UIImage(data: data) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(height: horizontalSizeClass == .regular ? 220 : 180)
                        .clipped()
                } else {
                    RoundedRectangle(cornerRadius: 13, style: .continuous)
                        .fill(launchThemeGradient(launchTheme))
                        .frame(height: horizontalSizeClass == .regular ? 220 : 180)
                    VStack(spacing: 6) {
                        Image(systemName: "face.smiling.inverse")
                            .font(.system(size: 34, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.9))
                        Text(launchTheme)
                            .font(.headline.weight(.bold))
                            .foregroundStyle(.white)
                        Text("Route Launch")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.85))
                    }
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))

            HStack(spacing: 8) {
                launchMenuField(title: "主题", value: $launchTheme, options: ["量子", "霓虹夜游", "城市漫游", "露营野餐"])
                Button("换一组") {
                    let all = ["量子", "霓虹夜游", "城市漫游", "露营野餐"]
                    let pool = all.filter { $0 != launchTheme }
                    launchTheme = pool.randomElement() ?? "量子"
                }
                .buttonStyle(TWSecondaryButtonStyle())
                .frame(maxWidth: 110)
            }

            PhotosPicker(selection: $launchCoverPickerItem, matching: .images, photoLibrary: .shared()) {
                Label("更换封面", systemImage: "photo")
                    .font(.caption.weight(.semibold))
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(TWSecondaryButtonStyle())
        }
        .frame(maxWidth: horizontalSizeClass == .regular ? 220 : .infinity, alignment: .leading)
    }

    private var launchFieldsPanel: some View {
        VStack(spacing: 8) {
            HStack(spacing: 8) {
                launchMenuField(title: "日历", value: $launchCalendar, options: ["个人日历", "社群日历", "校园日历"])
                launchMenuField(title: "可见性", value: $launchPrivacy, options: ["私密", "好友可见", "公开"])
            }

            launchTextField(title: "活动名称", text: $launchTitle, placeholder: "活动名称")

            HStack(spacing: 8) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("开始")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.78))
                    DatePicker("", selection: $launchStartAt, displayedComponents: [.date, .hourAndMinute])
                        .labelsHidden()
                        .datePickerStyle(.compact)
                        .tint(.white)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.17), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                VStack(alignment: .leading, spacing: 4) {
                    Text("结束")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.78))
                    DatePicker("", selection: $launchEndAt, displayedComponents: [.date, .hourAndMinute])
                        .labelsHidden()
                        .datePickerStyle(.compact)
                        .tint(.white)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 8)
                        .background(Color.white.opacity(0.17), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }

            launchTextField(title: "时区", text: $launchTimezone, placeholder: "GMT+08:00 新加坡")
            launchTextField(title: "添加活动地点", text: $launchVenue, placeholder: "线下地点或线上链接")
            launchTextField(title: "添加描述", text: $launchDescription, placeholder: "线下地点或线上链接", multiline: true)

            VStack(alignment: .leading, spacing: 6) {
                Text("活动选项")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.86))
                HStack {
                    Text("门票价格")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.82))
                    Spacer()
                    TextField("免费", text: $launchTicketPrice)
                        .keyboardType(.default)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 92)
                        .textFieldStyle(.plain)
                        .foregroundStyle(.white)
                }
                Divider().overlay(Color.white.opacity(0.2))
                Toggle(isOn: $launchRequiresApproval) {
                    Text("需要审核")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.82))
                }
                .tint(Color(red: 0.64, green: 0.82, blue: 1.0))
                Divider().overlay(Color.white.opacity(0.2))
                HStack {
                    Text("人数限制")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.82))
                    Spacer()
                    TextField("50", text: $launchAttendeeLimit)
                        .keyboardType(.numberPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 72)
                        .textFieldStyle(.plain)
                        .foregroundStyle(.white)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }

    @ViewBuilder
    private func launchTextField(title: String, text: Binding<String>, placeholder: String, multiline: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.78))
            if multiline {
                TextField(placeholder, text: text, axis: .vertical)
                    .lineLimit(2...4)
                    .textInputAutocapitalization(.sentences)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.17), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .foregroundStyle(.white)
            } else {
                TextField(placeholder, text: text)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.17), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .foregroundStyle(.white)
            }
        }
    }

    private func launchMenuField(title: String, value: Binding<String>, options: [String]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.78))
            Menu {
                ForEach(options, id: \.self) { option in
                    Button(option) {
                        value.wrappedValue = option
                    }
                }
            } label: {
                HStack {
                    Text(value.wrappedValue)
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    Image(systemName: "chevron.down")
                        .font(.caption2)
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .background(Color.white.opacity(0.17), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
        }
    }

    private func launchThemeGradient(_ theme: String) -> LinearGradient {
        switch theme {
        case "霓虹夜游":
            return LinearGradient(colors: [Color(red: 0.18, green: 0.07, blue: 0.49), Color(red: 0.41, green: 0.14, blue: 0.73), Color(red: 0.15, green: 0.43, blue: 0.77)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case "城市漫游":
            return LinearGradient(colors: [Color(red: 0.15, green: 0.40, blue: 0.56), Color(red: 0.15, green: 0.62, blue: 0.73), Color(red: 0.50, green: 0.78, blue: 0.85)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case "露营野餐":
            return LinearGradient(colors: [Color(red: 0.18, green: 0.43, blue: 0.29), Color(red: 0.27, green: 0.61, blue: 0.37), Color(red: 0.56, green: 0.81, blue: 0.63)], startPoint: .topLeading, endPoint: .bottomTrailing)
        default:
            return LinearGradient(colors: [Color(red: 0.31, green: 0.80, blue: 0.89), Color(red: 0.37, green: 0.68, blue: 0.95), Color(red: 0.60, green: 0.48, blue: 0.96)], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    private func buildLaunchConfig() -> ActivityLaunchConfigBody {
        let limit = max(1, min(5000, Int(launchAttendeeLimit) ?? 50))
        let formatter = ISO8601DateFormatter()
        return ActivityLaunchConfigBody(
            title: launchTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "活动名称" : launchTitle.trimmingCharacters(in: .whitespacesAndNewlines),
            calendar: launchCalendar.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "个人日历" : launchCalendar,
            privacy: launchPrivacy.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "私密" : launchPrivacy,
            timezone: launchTimezone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "GMT+08:00 新加坡" : launchTimezone,
            startAt: formatter.string(from: launchStartAt),
            endAt: formatter.string(from: launchEndAt),
            venueName: launchVenue.trimmingCharacters(in: .whitespacesAndNewlines),
            description: launchDescription.trimmingCharacters(in: .whitespacesAndNewlines),
            ticketPrice: launchTicketPrice.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "免费" : launchTicketPrice,
            requiresApproval: launchRequiresApproval,
            attendeeLimit: limit,
            theme: launchTheme.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "量子" : launchTheme,
            coverImage: encodedLaunchCoverDataURL()
        )
    }

    private func encodedLaunchCoverDataURL() -> String? {
        guard let data = launchCoverImageData, !data.isEmpty else { return nil }
        let maxBytes = 180_000
        if data.count > maxBytes { return nil }
        return "data:image/jpeg;base64,\(data.base64EncodedString())"
    }

    private func syncLaunchComposer(with plan: Plan, force: Bool) {
        let now = Date()
        let fallbackStart = now.addingTimeInterval(2 * 3600)
        let fallbackEnd = fallbackStart.addingTimeInterval(3600)
        let first = plan.route.first
        let last = plan.route.last
        let start = dateFromStop(first) ?? fallbackStart
        var end = dateFromStop(last) ?? fallbackEnd
        if end <= start {
            end = start.addingTimeInterval(3600)
        }
        if force || launchTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            launchTitle = plan.title
        }
        if force || launchVenue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            launchVenue = first?.point ?? first?.matchedName ?? ""
        }
        if force || launchDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            launchDescription = plan.reason ?? ""
        }
        if force {
            launchStartAt = start
            launchEndAt = end
        }
    }

    private func dateFromStop(_ stop: RouteStop?) -> Date? {
        guard let stop else { return nil }
        let day = (stop.date ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        let hm = (stop.time ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !day.isEmpty else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        if !hm.isEmpty, let date = formatter.date(from: "\(day) \(hm)") {
            return date
        }
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: day)
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
            editableStops = result.route.map(EditableRouteStop.init)
            routeEditSnapshot = editableStops
            syncLaunchComposer(with: result, force: true)
            editingRoute = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func createActivity(from plan: Plan, launchConfig: ActivityLaunchConfigBody?) async {
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
                bookingLinks: plan.bookingLinks,
                launchConfig: launchConfig
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
