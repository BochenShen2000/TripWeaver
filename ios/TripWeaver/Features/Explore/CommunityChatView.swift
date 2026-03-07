import SwiftUI

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
            await loadMessages()
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
