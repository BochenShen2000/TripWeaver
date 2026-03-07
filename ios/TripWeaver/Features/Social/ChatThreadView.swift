import SwiftUI

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
            if isEventThread {
                await loadEventDetail()
            }
            await loadMessages()
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

    private func messageRow(_ item: ChatMessage) -> some View {
        let mine = isMine(item)
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
