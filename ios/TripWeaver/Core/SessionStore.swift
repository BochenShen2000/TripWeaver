import Foundation

@MainActor
final class SessionStore: ObservableObject {
    @Published var token: String {
        didSet { UserDefaults.standard.set(token, forKey: Self.tokenKey) }
    }
    @Published var user: AuthUser?
    @Published var apiBaseURL: String {
        didSet { UserDefaults.standard.set(apiBaseURL, forKey: Self.baseURLKey) }
    }
    @Published var message: String = ""

    private static let tokenKey = "auth_token"
    private static let baseURLKey = "ios_api_base_url"

    init() {
        token = UserDefaults.standard.string(forKey: Self.tokenKey) ?? ""
        apiBaseURL = UserDefaults.standard.string(forKey: Self.baseURLKey) ?? "http://127.0.0.1:3000"
    }

    var isLoggedIn: Bool {
        !token.isEmpty && user != nil
    }

    func bootstrap() async {
        guard !token.isEmpty else { return }
        await refreshMe()
    }

    func refreshMe() async {
        guard !token.isEmpty else {
            user = nil
            return
        }
        do {
            let me: MeResponse = try await APIClient.request(
                baseURL: apiBaseURL,
                path: "/api/auth/me",
                token: token
            )
            user = me.user
        } catch {
            user = nil
            token = ""
        }
    }

    func applyAuth(_ auth: AuthResponse) {
        token = auth.token
        user = auth.user
        message = "已登录：\(auth.user.displayName)"
    }

    func logout() {
        token = ""
        user = nil
        message = "已退出登录"
    }
}
