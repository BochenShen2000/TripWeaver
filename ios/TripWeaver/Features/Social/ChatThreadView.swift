import SwiftUI
import MapKit

enum ChatThreadKind {
    case global
    case direct(userId: String)
    case campus(groupId: String)
    case interest(groupId: String)
    case event(eventId: String)
}

private struct ThreadMessageBody: Encodable {
    let content: String
}

private struct ThreadJoinEventBody: Encodable {
    let status: String
}

private struct ThreadEmptyBody: Encodable {}

private struct ThreadGeoPayload: Encodable {
    let lat: Double
    let lng: Double
    let label: String?
}

private struct ThreadInterestActivityBody: Encodable {
    let theme: String
    let startAt: String
    let endAt: String?
    let venueName: String
    let city: String
    let country: String
    let description: String?
    let googleMapsUri: String?
    let geo: ThreadGeoPayload?
}

private struct ThreadInterestActivityPublishResponse: Decodable {
    let ok: Bool?
    let groupId: String?
    let activity: InterestActivityPayload?
    let message: ChatMessage?
}

struct ChatThreadView: View {
    @EnvironmentObject private var session: SessionStore

    let title: String
    let subtitle: String
    let kind: ChatThreadKind
    let initiallyJoined: Bool

    @State private var messages: [ChatMessage] = []
    @State private var draft = ""
    @State private var loading = false
    @State private var joined: Bool
    @State private var statusMessage = ""
    @State private var eventDetail: DiscoveryRouteEvent?
    @State private var showActivityComposer = false
    @State private var publishingActivity = false
    @State private var activityTheme = ""
    @State private var activityVenue = ""
    @State private var activityCity = ""
    @State private var activityCountry = ""
    @State private var activityDescription = ""
    @State private var activityMapsUri = ""
    @State private var activityLat = ""
    @State private var activityLng = ""
    @State private var activityStartAt = Date().addingTimeInterval(24 * 3600)
    @State private var activityEndAt = Date().addingTimeInterval(25 * 3600)

    init(title: String, subtitle: String, kind: ChatThreadKind, initiallyJoined: Bool = true) {
        self.title = title
        self.subtitle = subtitle
        self.kind = kind
        self.initiallyJoined = initiallyJoined
        _joined = State(initialValue: initiallyJoined)
    }

    var body: some View {
        ZStack {
            AppGradientBackground()

            VStack(spacing: 10) {
                headerCard

                if session.token.isEmpty {
                    loginHintCard
                } else if needsJoin && !joined {
                    if isEventThread {
                        eventMapCard
                    }
                    joinCard
                } else {
                    if isEventThread {
                        eventMapCard
                    }
                    if isInterestThread {
                        activityComposerCard
                    }
                    messagesCard
                        .frame(maxHeight: .infinity)
                    composeCard
                }
            }
            .padding(.horizontal, AppLayout.horizontalPadding)
            .padding(.top, 10)
            .padding(.bottom, 8)
            .frame(maxWidth: AppLayout.maxContentWidth)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await loadMessages() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(session.token.isEmpty || loading)
            }
        }
        .task {
            guard !session.token.isEmpty else { return }
            prepareInterestActivityDefaults()
            if isEventThread {
                await loadEventDetail()
            }
            await loadMessages()
        }
        .task(id: "\(session.token)|\(joined)") {
            guard !session.token.isEmpty, shouldAutoRefresh else { return }
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 8_000_000_000)
                guard !Task.isCancelled else { break }
                guard !session.token.isEmpty else { continue }
                if needsJoin && !joined { continue }
                await loadMessagesSilently()
            }
        }
    }

    private var headerCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text(subtitle)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                if needsJoin {
                    Text(joined ? "已加入" : "未加入")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(joined ? .green : .orange)
                }
                if !statusMessage.isEmpty {
                    Text(statusMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var loginHintCard: some View {
        TWCard {
            Text("请先登录再进入聊天")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var joinCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("先报名/加入，再开始聊天")
                    .font(.headline)
                Text("加入后就可以查看群内消息并发送内容。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button(loading ? "处理中..." : "立即加入") {
                    Task { await joinThread() }
                }
                .buttonStyle(TWPrimaryButtonStyle())
                .disabled(loading)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var messagesCard: some View {
        TWCard {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(spacing: 8) {
                        ForEach(messages) { item in
                            messageRow(item)
                                .id(item.id)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .onChange(of: messages.map(\.id).joined(separator: "|")) { _, _ in
                    if let last = messages.last?.id {
                        withAnimation(.easeOut(duration: 0.2)) {
                            proxy.scrollTo(last, anchor: .bottom)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var eventMapCard: some View {
        let route = eventRouteForMap()
        if route.isEmpty {
            EmptyView()
        } else {
            TWCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("活动地图")
                        .font(.subheadline.weight(.semibold))
                    PlaceMapView(route: route, height: 180)
                }
            }
        }
    }

    private var composeCard: some View {
        TWCard {
            VStack(spacing: 8) {
                TextField("输入消息", text: $draft, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

                Button(loading ? "发送中..." : "发送") {
                    Task { await sendMessage() }
                }
                .buttonStyle(TWSecondaryButtonStyle())
                .disabled(loading)
            }
        }
    }

    @ViewBuilder
    private var activityComposerCard: some View {
        if joined, isInterestThread {
            TWCard {
                VStack(alignment: .leading, spacing: 8) {
                    Button(showActivityComposer ? "收起发布活动" : "发布社群下次活动") {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            showActivityComposer.toggle()
                        }
                    }
                    .buttonStyle(TWSecondaryButtonStyle())

                    if showActivityComposer {
                        TextField("活动主题（如 周五桌游夜）", text: $activityTheme)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

                        DatePicker("开始时间", selection: $activityStartAt, displayedComponents: [.date, .hourAndMinute])
                            .datePickerStyle(.compact)
                            .tint(AppTheme.brand)
                        DatePicker("结束时间", selection: $activityEndAt, displayedComponents: [.date, .hourAndMinute])
                            .datePickerStyle(.compact)
                            .tint(AppTheme.brand)

                        TextField("地点名称", text: $activityVenue)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

                        HStack(spacing: 8) {
                            TextField("城市", text: $activityCity)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 9)
                                .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                            TextField("国家和地区", text: $activityCountry)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 9)
                                .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                        }

                        HStack(spacing: 8) {
                            TextField("纬度(可选)", text: $activityLat)
                                .keyboardType(.decimalPad)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 9)
                                .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                            TextField("经度(可选)", text: $activityLng)
                                .keyboardType(.decimalPad)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 9)
                                .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                        }

                        TextField("Google Maps 链接(可选)", text: $activityMapsUri)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

                        TextField("活动说明（可选）", text: $activityDescription, axis: .vertical)
                            .lineLimit(2...4)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 9)
                            .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

                        Button(publishingActivity ? "发布中..." : "发布到群聊") {
                            Task { await publishInterestActivity() }
                        }
                        .buttonStyle(TWPrimaryButtonStyle())
                        .disabled(publishingActivity || !canSubmitInterestActivity)
                    }
                }
            }
        }
    }

    private func messageRow(_ item: ChatMessage) -> some View {
        let mine = isMine(item)
        let activity = interestActivityFromMessage(item)
        return HStack {
            if mine { Spacer(minLength: 36) }
            VStack(alignment: mine ? .trailing : .leading, spacing: 4) {
                if !mine {
                    Text(item.user?.displayName ?? "成员")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Text(item.content)
                    .font(.subheadline)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(
                        mine ? AppTheme.brand.opacity(0.95) : Color.white.opacity(0.9),
                        in: RoundedRectangle(cornerRadius: 10, style: .continuous)
                    )
                    .foregroundStyle(mine ? .white : .primary)
                if let activity {
                    interestActivityCard(activity, mine: mine)
                }
                Text(formatDateTime(item.createdAt))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            if !mine { Spacer(minLength: 36) }
        }
    }

    private var needsJoin: Bool {
        switch kind {
        case .campus, .interest, .event:
            return true
        case .global, .direct:
            return false
        }
    }

    private var isEventThread: Bool {
        if case .event = kind { return true }
        return false
    }

    private var isInterestThread: Bool {
        if case .interest = kind { return true }
        return false
    }

    private var shouldAutoRefresh: Bool {
        switch kind {
        case .global, .campus, .interest, .event:
            return true
        case .direct:
            return false
        }
    }

    private var interestGroupId: String? {
        if case .interest(let groupId) = kind { return groupId }
        return nil
    }

    private var canSubmitInterestActivity: Bool {
        !activityTheme.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !activityVenue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !activityCity.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !activityCountry.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func prepareInterestActivityDefaults() {
        guard isInterestThread else { return }
        if activityTheme.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            activityTheme = "社群线下活动"
        }
        if activityEndAt <= activityStartAt {
            activityEndAt = activityStartAt.addingTimeInterval(3600)
        }
    }

    private func publishInterestActivity() async {
        guard let groupId = interestGroupId, !session.token.isEmpty else { return }
        guard canSubmitInterestActivity else { return }
        publishingActivity = true
        defer { publishingActivity = false }

        let lat = Double(activityLat.trimmingCharacters(in: .whitespacesAndNewlines))
        let lng = Double(activityLng.trimmingCharacters(in: .whitespacesAndNewlines))
        let hasGeo = (lat != nil && lng != nil)
        let locationLabel = [activityVenue, activityCity, activityCountry]
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        let body = ThreadInterestActivityBody(
            theme: activityTheme.trimmingCharacters(in: .whitespacesAndNewlines),
            startAt: ISO8601DateFormatter().string(from: activityStartAt),
            endAt: activityEndAt > activityStartAt ? ISO8601DateFormatter().string(from: activityEndAt) : nil,
            venueName: activityVenue.trimmingCharacters(in: .whitespacesAndNewlines),
            city: activityCity.trimmingCharacters(in: .whitespacesAndNewlines),
            country: activityCountry.trimmingCharacters(in: .whitespacesAndNewlines),
            description: activityDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : activityDescription.trimmingCharacters(in: .whitespacesAndNewlines),
            googleMapsUri: activityMapsUri.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : activityMapsUri.trimmingCharacters(in: .whitespacesAndNewlines),
            geo: hasGeo ? ThreadGeoPayload(lat: lat!, lng: lng!, label: locationLabel.isEmpty ? nil : locationLabel) : nil
        )

        do {
            let result: ThreadInterestActivityPublishResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/interest/groups/\(encode(groupId))/activities",
                method: .post,
                token: session.token,
                body: body
            )
            if let message = result.message {
                messages.append(message)
            } else {
                await loadMessages()
            }
            statusMessage = "社群活动已发布，成员可在聊天中查看地图信息"
            showActivityComposer = false
        } catch {
            statusMessage = "发布失败：\(error.localizedDescription)"
        }
    }

    private func interestActivityFromMessage(_ item: ChatMessage) -> InterestActivityPayload? {
        guard item.kind == "interest_activity" else { return nil }
        return item.activity
    }

    @ViewBuilder
    private func interestActivityCard(_ activity: InterestActivityPayload, mine: Bool) -> some View {
        VStack(alignment: mine ? .trailing : .leading, spacing: 5) {
            Text("活动主题：\(activity.theme ?? "社群活动")")
                .font(.caption.weight(.semibold))
                .foregroundStyle(AppTheme.brandDeep)
            Text("时间：\(formatDateTime(activity.startAt))\(activity.endAt == nil ? "" : " - \(formatDateTime(activity.endAt))")")
                .font(.caption2)
                .foregroundStyle(.secondary)
            let location = [activity.venueName, activity.city, activity.country]
                .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
                .joined(separator: " · ")
            if !location.isEmpty {
                Text("地点：\(location)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            if let geo = activity.geo, let lat = geo.lat, let lng = geo.lng {
                Text("坐标：\(String(format: "%.5f", lat)), \(String(format: "%.5f", lng))")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                PlaceMapView(
                    route: [
                        RouteStop(
                            point: activity.venueName ?? activity.theme ?? "活动地点",
                            matchedName: activity.venueName ?? activity.theme ?? "活动地点",
                            lat: lat,
                            lng: lng,
                            verified: true,
                            intro: activity.description,
                            primaryType: "interest_activity",
                            rating: nil,
                            userRatingCount: nil,
                            date: nil,
                            time: nil,
                            googleMapsUri: activity.googleMapsUri,
                            recommendReason: nil
                        ),
                    ],
                    height: 130
                )
            }
            if let mapsUri = activity.googleMapsUri, !mapsUri.isEmpty, let url = URL(string: mapsUri) {
                Link("打开地图", destination: url)
                    .font(.caption.weight(.semibold))
            }
        }
        .frame(maxWidth: .infinity, alignment: mine ? .trailing : .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(Color.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func joinThread() async {
        guard !session.token.isEmpty else { return }
        loading = true
        defer { loading = false }

        do {
            switch kind {
            case .campus(let groupId):
                let _: CampusGroup = try await APIClient.request(
                    baseURL: session.apiBaseURL,
                    path: "/api/campus/groups/\(encode(groupId))/join",
                    method: .post,
                    token: session.token,
                    body: ThreadEmptyBody()
                )
            case .interest(let groupId):
                let _: InterestGroup = try await APIClient.request(
                    baseURL: session.apiBaseURL,
                    path: "/api/interest/groups/\(encode(groupId))/join",
                    method: .post,
                    token: session.token,
                    body: ThreadEmptyBody()
                )
            case .event(let eventId):
                let _: DiscoveryRouteEvent = try await APIClient.request(
                    baseURL: session.apiBaseURL,
                    path: "/api/local/events/\(encode(eventId))/rsvp",
                    method: .post,
                    token: session.token,
                    body: ThreadJoinEventBody(status: "going")
                )
            case .global, .direct:
                break
            }
            joined = true
            statusMessage = "加入成功"
            if isEventThread {
                await loadEventDetail()
            }
            await loadMessages()
        } catch {
            statusMessage = "加入失败：\(error.localizedDescription)"
        }
    }

    private func loadEventDetail() async {
        guard case .event(let eventId) = kind else { return }
        do {
            let detail: DiscoveryRouteEvent = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/local/events/\(encode(eventId))",
                token: session.token
            )
            eventDetail = detail
        } catch {
            // keep chat usable even if event detail fails
        }
    }

    private func loadMessages() async {
        guard !session.token.isEmpty else { return }
        if needsJoin && !joined { return }
        loading = true
        defer { loading = false }

        do {
            let path: String
            switch kind {
            case .global:
                path = "/api/im/messages?limit=200"
            case .direct(let userId):
                path = "/api/im/dm/\(encode(userId))/messages"
            case .campus(let groupId):
                path = "/api/campus/groups/\(encode(groupId))/messages"
            case .interest(let groupId):
                path = "/api/interest/groups/\(encode(groupId))/messages"
            case .event(let eventId):
                path = "/api/local/events/\(encode(eventId))/messages"
            }

            let result: [ChatMessage] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            messages = result
        } catch APIError.server(let msg) {
            if msg.localizedCaseInsensitiveContains("not a group member") || msg.localizedCaseInsensitiveContains("not joined") {
                joined = false
                statusMessage = "你还没加入该会话"
            } else {
                statusMessage = msg
            }
        } catch {
            statusMessage = error.localizedDescription
        }
    }

    private func loadMessagesSilently() async {
        guard !session.token.isEmpty else { return }
        if needsJoin && !joined { return }
        do {
            let path: String
            switch kind {
            case .global:
                path = "/api/im/messages?limit=200"
            case .direct(let userId):
                path = "/api/im/dm/\(encode(userId))/messages"
            case .campus(let groupId):
                path = "/api/campus/groups/\(encode(groupId))/messages"
            case .interest(let groupId):
                path = "/api/interest/groups/\(encode(groupId))/messages"
            case .event(let eventId):
                path = "/api/local/events/\(encode(eventId))/messages"
            }
            let result: [ChatMessage] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            messages = result
        } catch {
            // Keep interaction uninterrupted during background refresh.
        }
    }

    private func sendMessage() async {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !session.token.isEmpty else { return }
        if needsJoin && !joined { return }

        loading = true
        defer { loading = false }

        do {
            let path: String
            switch kind {
            case .global:
                path = "/api/im/messages"
            case .direct(let userId):
                path = "/api/im/dm/\(encode(userId))/messages"
            case .campus(let groupId):
                path = "/api/campus/groups/\(encode(groupId))/messages"
            case .interest(let groupId):
                path = "/api/interest/groups/\(encode(groupId))/messages"
            case .event(let eventId):
                path = "/api/local/events/\(encode(eventId))/messages"
            }

            let sent: ChatMessage = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                method: .post,
                token: session.token,
                body: ThreadMessageBody(content: text)
            )
            messages.append(sent)
            draft = ""
        } catch {
            statusMessage = "发送失败：\(error.localizedDescription)"
        }
    }

    private func encode(_ raw: String) -> String {
        raw.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? raw
    }

    private func isMine(_ item: ChatMessage) -> Bool {
        let myId = session.user?.id ?? ""
        if let fromUserId = item.fromUserId, !fromUserId.isEmpty {
            return fromUserId == myId
        }
        return item.user?.id == myId
    }

    private func formatDateTime(_ iso: String?) -> String {
        guard let iso, !iso.isEmpty else { return "" }
        let inFmt = ISO8601DateFormatter()
        guard let date = inFmt.date(from: iso) else { return iso }
        let outFmt = DateFormatter()
        outFmt.dateFormat = "MM-dd HH:mm"
        return outFmt.string(from: date)
    }

    private func eventRouteForMap() -> [RouteStop] {
        if let route = eventDetail?.route, !route.isEmpty {
            return route
        }
        if let lat = eventDetail?.geo?.lat, let lng = eventDetail?.geo?.lng {
            return [
                RouteStop(
                    point: eventDetail?.venueName ?? title,
                    matchedName: eventDetail?.venueName ?? title,
                    lat: lat,
                    lng: lng,
                    verified: true,
                    intro: eventDetail?.description,
                    primaryType: eventDetail?.category,
                    rating: nil,
                    userRatingCount: nil,
                    date: nil,
                    time: nil,
                    googleMapsUri: nil,
                    recommendReason: nil
                ),
            ]
        }
        return []
    }
}
