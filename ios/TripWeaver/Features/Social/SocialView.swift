import SwiftUI

private struct FriendRequestBody: Encodable {
    let toUsername: String
}

private struct FriendRespondBody: Encodable {
    let accept: Bool
}

struct SocialView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var loading = false
    @State private var message = ""

    @State private var friendUsername = ""

    @State private var friends: [AuthUser] = []
    @State private var friendRequests: [FriendRequest] = []
    @State private var interestGroups: [InterestGroup] = []
    @State private var campusGroups: [CampusGroup] = []
    @State private var joinedEventChats: [DiscoveryRouteEvent] = []

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradientBackground()

                AppPage {
                    headerCard

                    if session.token.isEmpty {
                        loginHintCard
                    } else {
                        addFriendCard
                        if !friendRequests.isEmpty {
                            requestsCard
                        }
                        chatsListCard
                    }
                }
            }
            .navigationTitle("聊天")
            .toolbarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .overlay(alignment: .topTrailing) {
                if loading { ProgressView().padding(10) }
            }
            .task {
                guard !session.token.isEmpty else { return }
                await refreshAll()
            }
        }
    }

    private var headerCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 7) {
                Text("会话列表")
                    .font(.headline)
                Text("像微信一样先看列表，点进去再聊天")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                if !message.isEmpty {
                    Text(message)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var loginHintCard: some View {
        TWCard {
            Text("请先登录，再查看会话列表")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var addFriendCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("添加好友")
                    .font(.headline)

                HStack(spacing: 8) {
                    TextField("输入用户名", text: $friendUsername)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

                    Button("发送") {
                        Task { await sendFriendRequest() }
                    }
                    .buttonStyle(TWSecondaryButtonStyle())
                    .frame(width: 86)
                    .disabled(loading)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var requestsCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("待处理好友请求")
                    .font(.headline)

                ForEach(friendRequests) { req in
                    HStack(spacing: 8) {
                        Text(requestTitle(req))
                            .font(.footnote)
                        Spacer()
                        Button("同意") {
                            Task { await respondRequest(req, accept: true) }
                        }
                        .buttonStyle(.bordered)
                        .font(.caption.weight(.semibold))

                        Button("拒绝") {
                            Task { await respondRequest(req, accept: false) }
                        }
                        .buttonStyle(.bordered)
                        .font(.caption.weight(.semibold))
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 8)
                    .background(Color.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var chatsListCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("所有会话")
                    .font(.headline)

                sectionTitle("活动聊天")
                if joinedEventChats.isEmpty {
                    emptyRow("暂无已加入活动")
                } else {
                    ForEach(joinedEventChats) { event in
                        NavigationLink {
                            ChatThreadView(
                                title: event.title,
                                subtitle: "\(formatDateTime(event.startAt)) · \(event.venueName ?? "待定地点")",
                                kind: .event(eventId: event.id),
                                initiallyJoined: true
                            )
                        } label: {
                            chatRow(
                                title: event.title,
                                subtitle: "\(formatDateTime(event.startAt)) · \(event.venueName ?? "待定地点")",
                                icon: "calendar.badge.clock"
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }

                sectionTitle("好友私聊")
                if friends.isEmpty {
                    emptyRow("暂无好友")
                } else {
                    ForEach(friends) { friend in
                        NavigationLink {
                            ChatThreadView(
                                title: friend.displayName,
                                subtitle: "@\(friend.username)",
                                kind: .direct(userId: friend.id)
                            )
                        } label: {
                            chatRow(title: friend.displayName, subtitle: "@\(friend.username)", icon: "person.crop.circle")
                        }
                        .buttonStyle(.plain)
                    }
                }

                sectionTitle("社群")
                if interestGroups.isEmpty && campusGroups.isEmpty {
                    emptyRow("暂无可加入社群")
                } else {
                    ForEach(interestGroups) { group in
                        NavigationLink {
                            ChatThreadView(
                                title: group.name,
                                subtitle: "\(group.interest ?? "兴趣") · \(group.city ?? "") \(group.country ?? "")",
                                kind: .interest(groupId: group.id),
                                initiallyJoined: isCurrentUserMember(group.members)
                            )
                        } label: {
                            chatRow(
                                title: group.name,
                                subtitle: "\(group.interest ?? "兴趣") · \(group.city ?? "") \(group.country ?? "")",
                                icon: "person.3.fill"
                            )
                        }
                        .buttonStyle(.plain)
                    }

                    ForEach(campusGroups) { group in
                        NavigationLink {
                            ChatThreadView(
                                title: group.name,
                                subtitle: group.campusName ?? "校园群",
                                kind: .campus(groupId: group.id),
                                initiallyJoined: isCurrentUserMember(group.members)
                            )
                        } label: {
                            chatRow(title: group.name, subtitle: group.campusName ?? "校园群", icon: "graduationcap.fill")
                        }
                        .buttonStyle(.plain)
                    }
                }

                sectionTitle("公共讨论")
                NavigationLink {
                    ChatThreadView(
                        title: "公共旅行讨论区",
                        subtitle: "全体可见",
                        kind: .global
                    )
                } label: {
                    chatRow(title: "公共旅行讨论区", subtitle: "大家一起聊路线和活动", icon: "bubble.left.and.bubble.right.fill")
                }
                .buttonStyle(.plain)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func chatRow(title: String, subtitle: String, icon: String) -> some View {
        HStack(spacing: 10) {
            Circle()
                .fill(AppTheme.brand.opacity(0.14))
                .frame(width: 36, height: 36)
                .overlay {
                    Image(systemName: icon)
                        .foregroundStyle(AppTheme.brandDeep)
                }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .background(Color.white.opacity(0.82), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .foregroundStyle(.secondary)
    }

    private func emptyRow(_ text: String) -> some View {
        Text(text)
            .font(.footnote)
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.74), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func refreshAll() async {
        loading = true
        defer { loading = false }
        await loadFriends()
        await loadJoinedEvents()
        await loadInterestGroups()
        await loadCampusGroups()
    }

    private func loadFriends() async {
        do {
            let result: FriendsPayload = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/friends",
                token: session.token
            )
            friends = result.friends
            friendRequests = (result.requests ?? []).filter { $0.toUserId == session.user?.id && $0.status == "pending" }
        } catch {
            message = error.localizedDescription
        }
    }

    private func loadJoinedEvents() async {
        do {
            let result: [DiscoveryRouteEvent] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/local/events/joined?limit=20",
                token: session.token
            )
            joinedEventChats = result
        } catch {
            joinedEventChats = []
        }
    }

    private func loadInterestGroups() async {
        do {
            let result: [InterestGroup] = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/interest/groups",
                token: session.token
            )
            interestGroups = result
        } catch {
            interestGroups = []
        }
    }

    private func loadCampusGroups() async {
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
            await loadFriends()
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
            await loadFriends()
        } catch {
            message = error.localizedDescription
        }
    }

    private func requestTitle(_ req: FriendRequest) -> String {
        if req.fromUserId == session.user?.id {
            return "你发出的请求"
        }
        if let from = friends.first(where: { $0.id == req.fromUserId }) {
            return "\(from.displayName) 请求添加你"
        }
        return "收到好友请求：\(String(req.fromUserId.prefix(8)))..."
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
