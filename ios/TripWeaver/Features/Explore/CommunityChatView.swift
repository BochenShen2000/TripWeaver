import SwiftUI
import MapKit

enum CommunityType {
    case interest
    case campus

    var label: String {
        switch self {
        case .interest:
            return "同好社群"
        case .campus:
            return "校园社群"
        }
    }

    var joinPrefix: String {
        switch self {
        case .interest:
            return "/api/interest/groups"
        case .campus:
            return "/api/campus/groups"
        }
    }

    var messagesPrefix: String {
        switch self {
        case .interest:
            return "/api/interest/groups"
        case .campus:
            return "/api/campus/groups"
        }
    }
}

private struct CommunityMessageBody: Encodable {
    let content: String
}

private struct CommunityEmptyBody: Encodable {}

private struct CommunityGeoPayload: Encodable {
    let lat: Double
    let lng: Double
    let label: String?
}

private struct CommunityInterestActivityBody: Encodable {
    let theme: String
    let startAt: String
    let endAt: String?
    let venueName: String
    let city: String
    let country: String
    let description: String?
    let googleMapsUri: String?
    let geo: CommunityGeoPayload?
}

private struct CommunityInterestActivityPublishResponse: Decodable {
    let ok: Bool?
    let groupId: String?
    let activity: InterestActivityPayload?
    let message: ChatMessage?
}

struct CommunityChatView: View {
    @EnvironmentObject private var session: SessionStore

    let communityId: String
    let communityName: String
    let subtitle: String
    let type: CommunityType
    let initiallyMember: Bool

    @State private var messages: [ChatMessage] = []
    @State private var draft = ""
    @State private var loading = false
    @State private var statusMessage = ""
    @State private var isMember: Bool
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

    init(
        communityId: String,
        communityName: String,
        subtitle: String,
        type: CommunityType,
        initiallyMember: Bool
    ) {
        self.communityId = communityId
        self.communityName = communityName
        self.subtitle = subtitle
        self.type = type
        self.initiallyMember = initiallyMember
        _isMember = State(initialValue: initiallyMember)
    }

    var body: some View {
        ZStack {
            AppGradientBackground()

            AppPage {
                headerCard

                if session.token.isEmpty {
                    TWCard {
                        Text("请先登录，再报名和参与社群聊天")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                } else if !isMember {
                    joinCard
                } else {
                    if type == .interest {
                        activityComposerCard
                    }
                    messagesCard
                    composeCard
                }
            }
        }
        .navigationTitle(communityName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if session.token.isEmpty || !isMember {
                    EmptyView()
                } else {
                    Button {
                        Task { await loadMessages() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
        .task {
            guard !session.token.isEmpty else { return }
            prepareInterestActivityDefaults()
            await loadMessages()
        }
        .task(id: "\(session.token)|\(isMember)") {
            guard !session.token.isEmpty, isMember else { return }
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 8_000_000_000)
                guard !Task.isCancelled else { break }
                guard !session.token.isEmpty, isMember else { continue }
                await loadMessagesSilently()
            }
        }
    }

    private var headerCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 7) {
                HStack(spacing: 8) {
                    Text(type.label)
                        .font(.caption2.weight(.semibold))
                        .padding(.horizontal, 7)
                        .padding(.vertical, 3)
                        .background(AppTheme.brand.opacity(0.15), in: Capsule())
                        .foregroundStyle(AppTheme.brandDeep)

                    if isMember {
                        Text("已报名")
                            .font(.caption2.weight(.semibold))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(Color.green.opacity(0.15), in: Capsule())
                            .foregroundStyle(.green)
                    } else {
                        Text("未报名")
                            .font(.caption2.weight(.semibold))
                            .padding(.horizontal, 7)
                            .padding(.vertical, 3)
                            .background(Color.orange.opacity(0.14), in: Capsule())
                            .foregroundStyle(.orange)
                    }
                }
                Text(subtitle)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                if !statusMessage.isEmpty {
                    Text(statusMessage)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var joinCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("先报名，再开始聊天")
                    .font(.headline)
                Text("加入后即可看到群内讨论并发送消息。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Button(loading ? "报名中..." : "报名加入") {
                    Task { await joinCommunity() }
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
                .frame(minHeight: 260, maxHeight: 420)
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

    private var composeCard: some View {
        TWCard {
            VStack(spacing: 8) {
                TextField("发送一条路线讨论消息", text: $draft, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

                Button(loading ? "发送中..." : "发送消息") {
                    Task { await sendMessage() }
                }
                .buttonStyle(TWSecondaryButtonStyle())
                .disabled(loading)
            }
        }
    }

    @ViewBuilder
    private var activityComposerCard: some View {
        if type == .interest, isMember {
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
        let mine = (item.user?.id == session.user?.id)
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
                if let activity = interestActivityFromMessage(item) {
                    interestActivityCard(activity, mine: mine)
                }
                Text(formatDateTime(item.createdAt))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            if !mine { Spacer(minLength: 36) }
        }
    }

    private func joinCommunity() async {
        guard !session.token.isEmpty else { return }
        loading = true
        defer { loading = false }

        do {
            let path = "\(type.joinPrefix)/\(encodedId)/join"
            switch type {
            case .interest:
                let _: InterestGroup = try await APIClient.request(
                    baseURL: session.apiBaseURL,
                    path: path,
                    method: .post,
                    token: session.token,
                    body: CommunityEmptyBody()
                )
            case .campus:
                let _: CampusGroup = try await APIClient.request(
                    baseURL: session.apiBaseURL,
                    path: path,
                    method: .post,
                    token: session.token,
                    body: CommunityEmptyBody()
                )
            }
            isMember = true
            statusMessage = "报名成功，已加入群聊"
            await loadMessages()
        } catch {
            statusMessage = "报名失败：\(error.localizedDescription)"
        }
    }

    private func loadMessages() async {
        guard !session.token.isEmpty else { return }
        loading = true
        defer { loading = false }

        do {
            let path = "\(type.messagesPrefix)/\(encodedId)/messages"
            let result: [ChatMessage] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            messages = result
            isMember = true
        } catch APIError.server(let msg) {
            if msg.localizedCaseInsensitiveContains("not a group member") {
                isMember = false
                statusMessage = "你还没报名该社群"
            } else {
                statusMessage = msg
            }
        } catch {
            statusMessage = error.localizedDescription
        }
    }

    private func loadMessagesSilently() async {
        guard !session.token.isEmpty, isMember else { return }
        do {
            let path = "\(type.messagesPrefix)/\(encodedId)/messages"
            let result: [ChatMessage] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                token: session.token
            )
            messages = result
        } catch {
            // Keep chat editable during background refresh.
        }
    }

    private func sendMessage() async {
        let content = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty, !session.token.isEmpty, isMember else { return }
        loading = true
        defer { loading = false }

        do {
            let path = "\(type.messagesPrefix)/\(encodedId)/messages"
            let sent: ChatMessage = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
                method: .post,
                token: session.token,
                body: CommunityMessageBody(content: content)
            )
            messages.append(sent)
            draft = ""
        } catch {
            statusMessage = "发送失败：\(error.localizedDescription)"
        }
    }

    private var canSubmitInterestActivity: Bool {
        !activityTheme.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !activityVenue.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !activityCity.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !activityCountry.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func prepareInterestActivityDefaults() {
        guard type == .interest else { return }
        if activityTheme.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            activityTheme = "社群线下活动"
        }
        if activityCity.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            activityCity = "Singapore"
        }
        if activityCountry.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            activityCountry = "Singapore"
        }
        if activityEndAt <= activityStartAt {
            activityEndAt = activityStartAt.addingTimeInterval(3600)
        }
    }

    private func publishInterestActivity() async {
        guard type == .interest, !session.token.isEmpty else { return }
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
        let body = CommunityInterestActivityBody(
            theme: activityTheme.trimmingCharacters(in: .whitespacesAndNewlines),
            startAt: ISO8601DateFormatter().string(from: activityStartAt),
            endAt: activityEndAt > activityStartAt ? ISO8601DateFormatter().string(from: activityEndAt) : nil,
            venueName: activityVenue.trimmingCharacters(in: .whitespacesAndNewlines),
            city: activityCity.trimmingCharacters(in: .whitespacesAndNewlines),
            country: activityCountry.trimmingCharacters(in: .whitespacesAndNewlines),
            description: activityDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : activityDescription.trimmingCharacters(in: .whitespacesAndNewlines),
            googleMapsUri: activityMapsUri.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : activityMapsUri.trimmingCharacters(in: .whitespacesAndNewlines),
            geo: hasGeo ? CommunityGeoPayload(lat: lat!, lng: lng!, label: locationLabel.isEmpty ? nil : locationLabel) : nil
        )

        do {
            let path = "/api/interest/groups/\(encodedId)/activities"
            let result: CommunityInterestActivityPublishResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: path,
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

    private var encodedId: String {
        communityId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? communityId
    }

    private func formatDateTime(_ iso: String?) -> String {
        guard let iso, !iso.isEmpty else { return "" }
        let inFmt = ISO8601DateFormatter()
        guard let date = inFmt.date(from: iso) else { return iso }
        let outFmt = DateFormatter()
        outFmt.dateFormat = "MM-dd HH:mm"
        return outFmt.string(from: date)
    }
}
