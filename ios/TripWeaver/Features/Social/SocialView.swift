import SwiftUI

private enum ChatScope: String, CaseIterable, Identifiable {
    case global = "群聊"
    case direct = "好友"
    case campus = "校园群"

    var id: String { rawValue }
}

private struct MessageBody: Encodable {
    let content: String
}

private struct FriendRequestBody: Encodable {
    let toUsername: String
}

private struct FriendRespondBody: Encodable {
    let accept: Bool
}

private struct CreateCampusGroupBody: Encodable {
    let name: String
    let description: String
}

private struct EmptyBody: Encodable {}

struct SocialView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var scope: ChatScope = .global

    @State private var globalMessages: [ChatMessage] = []
    @State private var dmMessages: [ChatMessage] = []
    @State private var campusMessages: [ChatMessage] = []

    @State private var friends: [AuthUser] = []
    @State private var requests: [FriendRequest] = []
    @State private var selectedFriendId: String = ""

    @State private var campusGroups: [CampusGroup] = []
    @State private var selectedCampusGroupId: String = ""
    @State private var campusNeedJoin = false

    @State private var draft = ""
    @State private var friendUsername = ""
    @State private var newGroupName = ""
    @State private var newGroupDesc = ""

    @State private var loading = false
    @State private var message = ""

    private let templates = [
        "今晚就去吗？我这边有条路线", 
        "预算控制在 300 内可以吗", 
        "周六下午 2 点集合？", 
        "我来发起活动，你们一键加入", 
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradientBackground()

                if !session.isLoggedIn {
                    loginPrompt
                } else {
                    VStack(spacing: 12) {
                        scopePicker
                        contentCard
                        composeBar
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                }
            }
            .navigationTitle("聊天")
            .toolbarTitleDisplayMode(.inline)
            .overlay(alignment: .topTrailing) {
                if loading {
                    ProgressView()
                        .padding(10)
                }
            }
            .task {
                guard session.isLoggedIn else { return }
                await bootstrapData()
            }
            .onChange(of: scope) { _, newValue in
                Task { await loadForScope(newValue) }
            }
        }
    }

    private var loginPrompt: some View {
        VStack(spacing: 12) {
            TWCard {
                VStack(alignment: .leading, spacing: 8) {
                    Text("登录后可用")
                        .font(.title3.weight(.semibold))
                    Text("支持公共群聊、好友私聊和校园群聊。")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .padding()
        }
    }

    private var scopePicker: some View {
        TWCard {
            Picker("聊天范围", selection: $scope) {
                ForEach(ChatScope.allCases) { item in
                    Text(item.rawValue).tag(item)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    @ViewBuilder
    private var contentCard: some View {
        TWCard {
            VStack(spacing: 12) {
                headerTools
                Divider()
                messageList
            }
        }
    }

    @ViewBuilder
    private var headerTools: some View {
        switch scope {
        case .global:
            VStack(alignment: .leading, spacing: 8) {
                Text("公共旅行讨论区")
                    .font(.headline)
                Text("适合快速对齐“今晚去哪 / 周末怎么玩”。")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        case .direct:
            VStack(spacing: 10) {
                addFriendBar
                requestBar
                friendSelector
            }
        case .campus:
            VStack(spacing: 10) {
                groupSelector
                createGroupForm
                if campusNeedJoin, !selectedCampusGroupId.isEmpty {
                    Button("加入当前群") {
                        Task { await joinSelectedCampusGroup() }
                    }
                    .buttonStyle(TWSecondaryButtonStyle())
                }
            }
        }
    }

    private var addFriendBar: some View {
        HStack(spacing: 8) {
            TextField("输入用户名加好友", text: $friendUsername)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled(true)
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: 10, style: .continuous))

            Button("发送") {
                Task { await sendFriendRequest() }
            }
            .buttonStyle(TWSecondaryButtonStyle())
            .frame(width: 86)
        }
    }

    private var requestBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                if requests.isEmpty {
                    Text("暂无待处理好友请求")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(requests) { req in
                        HStack(spacing: 6) {
                            Text(friendRequestTitle(req))
                                .font(.caption)
                            Button("同意") {
                                Task { await respondRequest(req, accept: true) }
                            }
                            .font(.caption.weight(.semibold))
                            .buttonStyle(.bordered)
                            Button("拒绝") {
                                Task { await respondRequest(req, accept: false) }
                            }
                            .font(.caption.weight(.semibold))
                            .buttonStyle(.bordered)
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 7)
                        .background(Color.white.opacity(0.76), in: Capsule())
                    }
                }
            }
        }
    }

    private var friendSelector: some View {
        VStack(spacing: 6) {
            if friends.isEmpty {
                Text("暂无好友，先加一个吧")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                ForEach(Array(friends.prefix(8))) { friend in
                    Button {
                        selectedFriendId = friend.id
                        Task { await loadDMMessages() }
                    } label: {
                        HStack(spacing: 10) {
                            Circle()
                                .fill(AppTheme.brand.opacity(0.16))
                                .frame(width: 34, height: 34)
                                .overlay {
                                    Text(initials(friend.displayName))
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(AppTheme.brandDeep)
                                }
                            VStack(alignment: .leading, spacing: 2) {
                                Text(friend.displayName)
                                    .font(.subheadline.weight(.medium))
                                Text("@\(friend.username)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer(minLength: 0)
                            if friend.id == selectedFriendId {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(AppTheme.brand)
                            }
                        }
                        .padding(.horizontal, 10)
                        .padding(.vertical, 8)
                        .background(friend.id == selectedFriendId ? AppTheme.brand.opacity(0.13) : Color.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private var groupSelector: some View {
        HStack(spacing: 8) {
            if campusGroups.isEmpty {
                Text("暂无校园群，可先创建")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Spacer()
            } else {
                Menu {
                    ForEach(campusGroups) { group in
                        Button(group.name) {
                            selectedCampusGroupId = group.id
                            Task { await loadCampusMessages() }
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "person.3.fill")
                        Text(selectedCampusGroupName)
                            .lineLimit(1)
                        Spacer()
                        Image(systemName: "chevron.down")
                            .font(.caption)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            Button("刷新") {
                Task { await loadCampusGroups() }
            }
            .buttonStyle(TWSecondaryButtonStyle())
            .frame(width: 82)
        }
    }

    private var createGroupForm: some View {
        HStack(spacing: 8) {
            TextField("新群名", text: $newGroupName)
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .background(Color.white.opacity(0.84), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            TextField("描述", text: $newGroupDesc)
                .padding(.horizontal, 10)
                .padding(.vertical, 9)
                .background(Color.white.opacity(0.84), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            Button("创建") {
                Task { await createCampusGroup() }
            }
            .buttonStyle(TWSecondaryButtonStyle())
            .frame(width: 82)
        }
    }

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(currentMessages) { item in
                        messageRow(item)
                            .id(item.id)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 2)
            }
            .frame(minHeight: 260, maxHeight: 430)
            .onChange(of: currentMessages.map(\.id).joined(separator: "|")) { _, _ in
                if let last = currentMessages.last?.id {
                    withAnimation(.easeOut(duration: 0.22)) {
                        proxy.scrollTo(last, anchor: .bottom)
                    }
                }
            }
        }
    }

    private func messageRow(_ item: ChatMessage) -> some View {
        let isMine = isSelfMessage(item)

        return HStack {
            if isMine { Spacer(minLength: 34) }

            VStack(alignment: isMine ? .trailing : .leading, spacing: 4) {
                if !isMine {
                    Text(item.user?.displayName ?? "匿名用户")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
                Text(item.content)
                    .font(.subheadline)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(
                        isMine ? AppTheme.brand.opacity(0.95) : Color.white.opacity(0.90),
                        in: RoundedRectangle(cornerRadius: 11, style: .continuous)
                    )
                    .foregroundStyle(isMine ? .white : .primary)

                if let createdAt = item.createdAt {
                    Text(formatTime(createdAt))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            if !isMine { Spacer(minLength: 34) }
        }
    }

    private var composeBar: some View {
        VStack(spacing: 10) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(templates, id: \.self) { template in
                        Button(template) {
                            draft = template
                        }
                        .font(.caption)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 6)
                        .background(Color.white.opacity(0.78), in: Capsule())
                        .buttonStyle(.plain)
                    }
                }
            }

            HStack(spacing: 8) {
                TextField("输入消息", text: $draft, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                Button("发送") {
                    Task { await sendMessage() }
                }
                .buttonStyle(TWPrimaryButtonStyle())
                .frame(width: 88)
            }

            if !message.isEmpty {
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var currentMessages: [ChatMessage] {
        switch scope {
        case .global:
            return globalMessages
        case .direct:
            return dmMessages
        case .campus:
            return campusMessages
        }
    }

    private var selectedCampusGroupName: String {
        if let group = campusGroups.first(where: { $0.id == selectedCampusGroupId }) {
            return group.name
        }
        return "选择校园群"
    }

    private func bootstrapData() async {
        await loadFriendsAndRequests()
        await loadCampusGroups()
        await loadForScope(scope)
    }

    private func loadForScope(_ scope: ChatScope) async {
        switch scope {
        case .global:
            await loadGlobalMessages()
        case .direct:
            if selectedFriendId.isEmpty, let first = friends.first?.id {
                selectedFriendId = first
            }
            await loadDMMessages()
        case .campus:
            if selectedCampusGroupId.isEmpty, let first = campusGroups.first?.id {
                selectedCampusGroupId = first
            }
            await loadCampusMessages()
        }
    }

    private func loadFriendsAndRequests() async {
        guard !session.token.isEmpty else { return }
        loading = true
        defer { loading = false }
        do {
            let result: FriendsPayload = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/friends",
                token: session.token
            )
            friends = result.friends
            requests = (result.requests ?? []).filter { $0.toUserId == session.user?.id && $0.status == "pending" }
            if selectedFriendId.isEmpty, let first = friends.first?.id {
                selectedFriendId = first
            }
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadGlobalMessages() async {
        loading = true
        defer { loading = false }
        do {
            let items: [ChatMessage] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/im/messages?limit=150",
                token: session.token
            )
            globalMessages = items
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadDMMessages() async {
        guard !selectedFriendId.isEmpty else { return }
        loading = true
        defer { loading = false }
        do {
            let items: [ChatMessage] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/im/dm/\(selectedFriendId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? selectedFriendId)/messages",
                token: session.token
            )
            dmMessages = items
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadCampusGroups() async {
        loading = true
        defer { loading = false }
        do {
            let items: [CampusGroup] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/campus/groups",
                token: session.token
            )
            campusGroups = items
            if selectedCampusGroupId.isEmpty, let first = items.first?.id {
                selectedCampusGroupId = first
            }
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadCampusMessages() async {
        guard !selectedCampusGroupId.isEmpty else { return }
        loading = true
        campusNeedJoin = false
        defer { loading = false }
        do {
            let items: [ChatMessage] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/campus/groups/\(selectedCampusGroupId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? selectedCampusGroupId)/messages",
                token: session.token
            )
            campusMessages = items
        } catch APIError.server(let msg) {
            if msg.localizedCaseInsensitiveContains("not a group member") {
                campusNeedJoin = true
                campusMessages = []
                message = "你还没加入这个群，先点“加入当前群”。"
            } else {
                message = msg
            }
        } catch {
            message = error.localizedDescription
        }
    }

    private func sendFriendRequest() async {
        let username = friendUsername.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !username.isEmpty else { return }
        loading = true
        defer { loading = false }
        do {
            let _: FriendRequest = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/friends/request",
                method: .post,
                token: session.token,
                body: FriendRequestBody(toUsername: username)
            )
            friendUsername = ""
            message = "好友请求已发送"
            await loadFriendsAndRequests()
        } catch {
            message = error.localizedDescription
        }
    }

    private func respondRequest(_ req: FriendRequest, accept: Bool) async {
        loading = true
        defer { loading = false }
        do {
            let _: FriendRequest = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/friends/request/\(req.id)/respond",
                method: .post,
                token: session.token,
                body: FriendRespondBody(accept: accept)
            )
            message = accept ? "已同意好友请求" : "已拒绝好友请求"
            await loadFriendsAndRequests()
            if accept {
                await loadDMMessages()
            }
        } catch {
            message = error.localizedDescription
        }
    }

    private func createCampusGroup() async {
        let groupName = newGroupName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !groupName.isEmpty else { return }
        loading = true
        defer { loading = false }
        do {
            let group: CampusGroup = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/campus/groups",
                method: .post,
                token: session.token,
                body: CreateCampusGroupBody(name: groupName, description: newGroupDesc)
            )
            newGroupName = ""
            newGroupDesc = ""
            message = "群组已创建：\(group.name)"
            await loadCampusGroups()
            selectedCampusGroupId = group.id
            await loadCampusMessages()
        } catch {
            message = error.localizedDescription
        }
    }

    private func joinSelectedCampusGroup() async {
        guard !selectedCampusGroupId.isEmpty else { return }
        loading = true
        defer { loading = false }
        do {
            let _: CampusGroup = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/campus/groups/\(selectedCampusGroupId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? selectedCampusGroupId)/join",
                method: .post,
                token: session.token,
                body: EmptyBody()
            )
            campusNeedJoin = false
            message = "已加入群聊"
            await loadCampusMessages()
        } catch {
            message = error.localizedDescription
        }
    }

    private func sendMessage() async {
        let content = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !content.isEmpty else { return }
        loading = true
        defer { loading = false }

        do {
            switch scope {
            case .global:
                let sent: ChatMessage = try await APIClient.request(
                    baseURL: session.apiBaseURL,
                    path: "/api/im/messages",
                    method: .post,
                    token: session.token,
                    body: MessageBody(content: content)
                )
                globalMessages.append(sent)
            case .direct:
                guard !selectedFriendId.isEmpty else {
                    message = "先选择好友"
                    return
                }
                let sent: ChatMessage = try await APIClient.request(
                    baseURL: session.apiBaseURL,
                    path: "/api/im/dm/\(selectedFriendId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? selectedFriendId)/messages",
                    method: .post,
                    token: session.token,
                    body: MessageBody(content: content)
                )
                dmMessages.append(sent)
            case .campus:
                guard !selectedCampusGroupId.isEmpty else {
                    message = "先选择校园群"
                    return
                }
                let sent: ChatMessage = try await APIClient.request(
                    baseURL: session.apiBaseURL,
                    path: "/api/campus/groups/\(selectedCampusGroupId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? selectedCampusGroupId)/messages",
                    method: .post,
                    token: session.token,
                    body: MessageBody(content: content)
                )
                campusMessages.append(sent)
            }
            draft = ""
        } catch {
            message = error.localizedDescription
        }
    }

    private func friendRequestTitle(_ req: FriendRequest) -> String {
        if req.fromUserId == session.user?.id {
            return "你发出的请求"
        }
        if let sender = friends.first(where: { $0.id == req.fromUserId }) {
            return "\(sender.displayName) 请求添加你"
        }
        return "收到好友请求"
    }

    private func initials(_ name: String) -> String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return "U" }
        return String(trimmed.prefix(1)).uppercased()
    }

    private func isSelfMessage(_ message: ChatMessage) -> Bool {
        let myId = session.user?.id ?? ""
        if let fromUserId = message.fromUserId, !fromUserId.isEmpty {
            return fromUserId == myId
        }
        return message.user?.id == myId
    }

    private func formatTime(_ iso: String) -> String {
        let inFmt = ISO8601DateFormatter()
        if let date = inFmt.date(from: iso) {
            let outFmt = DateFormatter()
            outFmt.dateFormat = "MM-dd HH:mm"
            return outFmt.string(from: date)
        }
        return iso
    }
}
