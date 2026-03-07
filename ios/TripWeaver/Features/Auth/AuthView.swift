import SwiftUI

private enum AuthMode: String, CaseIterable, Identifiable {
    case login = "登录"
    case register = "注册"
    case code = "验证码"

    var id: String { rawValue }
}

private struct LoginBody: Encodable {
    let identifier: String
    let password: String
}

private struct RegisterBody: Encodable {
    let displayName: String
    let username: String
    let email: String
    let password: String
}

private struct RequestCodeBody: Encodable {
    let identifier: String
}

private struct CodeLoginBody: Encodable {
    let identifier: String
    let code: String
    let displayName: String
}

private struct OAuthMockBody: Encodable {
    let provider: String
    let oauthUserId: String
    let displayName: String
}

private struct CampusVerifyBody: Encodable {
    let campusEmail: String
    let campusName: String
    let studentId: String
}

private struct CampusVerifyResponse: Decodable {
    let user: AuthUser
    let campusVerified: Bool?
    let campusName: String?
}

private struct RequestCodeResponse: Decodable {
    let identifierHint: String
    let debugCode: String
}

private struct AuthInputField: View {
    let placeholder: String
    @Binding var text: String
    var secure: Bool = false
    var keyboard: UIKeyboardType = .default
    var noAutoCorrect: Bool = false

    var body: some View {
        Group {
            if secure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
                    .keyboardType(keyboard)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(noAutoCorrect)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 11)
        .background(Color.white.opacity(0.92), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}

struct AuthView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var mode: AuthMode = .login
    @State private var loading = false

    @State private var loginIdentifier = ""
    @State private var loginPassword = ""

    @State private var regDisplayName = ""
    @State private var regUsername = ""
    @State private var regEmail = ""
    @State private var regPassword = ""

    @State private var codeIdentifier = ""
    @State private var codeValue = ""
    @State private var codeDisplayName = ""
    @State private var campusName = ""
    @State private var campusEmail = ""
    @State private var studentId = ""

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradientBackground()

                AppPage {
                    titleCard
                    serverCard
                    accountCard
                    campusVerifyCard
                    authCard
                    oauthCard
                }
            }
            .navigationTitle("账号中心")
            .toolbarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .task {
                if session.user == nil, !session.token.isEmpty {
                    await session.refreshMe()
                }
                syncCampusFields()
            }
        }
    }

    private var titleCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("TripWeaver")
                    .font(.title2.weight(.bold))
                Text("支持密码、验证码、第三方快捷登录")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var serverCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("后端地址")
                    .font(.headline)
                AuthInputField(
                    placeholder: "https://api.yourdomain.com",
                    text: $session.apiBaseURL,
                    keyboard: .URL,
                    noAutoCorrect: true
                )
                Text("开发时可用 http://127.0.0.1:3000")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var accountCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("当前状态")
                    .font(.headline)
                if let user = session.user {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(user.displayName)
                            .font(.subheadline.weight(.semibold))
                        Text("@\(user.username)")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                        campusStatusTag(user)
                    }
                    Button("退出登录") {
                        session.logout()
                        campusName = ""
                        campusEmail = ""
                        studentId = ""
                    }
                    .buttonStyle(TWSecondaryButtonStyle())
                } else {
                    Text("未登录")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                if !session.message.isEmpty {
                    Text(session.message)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var campusVerifyCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("大学生认证")
                    .font(.headline)

                if let user = session.user {
                    if user.campusVerified == true {
                        Text("已认证：\(user.campusName ?? "Campus")")
                            .font(.footnote)
                            .foregroundStyle(.green)
                    } else {
                        Text("认证后可加入校园群、解锁校园功能")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }

                    AuthInputField(placeholder: "学校名称（例如 NTU）", text: $campusName)
                    AuthInputField(
                        placeholder: "校园邮箱（.edu / .ac）",
                        text: $campusEmail,
                        keyboard: .emailAddress,
                        noAutoCorrect: true
                    )
                    AuthInputField(placeholder: "学号（可选）", text: $studentId, noAutoCorrect: true)

                    Button(loading ? "认证中..." : "提交校园认证") {
                        Task { await verifyCampus() }
                    }
                    .buttonStyle(TWPrimaryButtonStyle())
                    .disabled(loading)
                } else {
                    Text("请先登录再完成大学生认证")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func campusStatusTag(_ user: AuthUser) -> some View {
        if user.campusVerified == true {
            Text("校园认证已通过")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.green)
        } else {
            Text("未校园认证")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.orange)
        }
    }

    private var authCard: some View {
        TWCard {
            VStack(spacing: 10) {
                Picker("模式", selection: $mode) {
                    ForEach(AuthMode.allCases) { m in
                        Text(m.rawValue).tag(m)
                    }
                }
                .pickerStyle(.segmented)

                switch mode {
                case .login:
                    AuthInputField(placeholder: "用户名/邮箱", text: $loginIdentifier, noAutoCorrect: true)
                    AuthInputField(placeholder: "密码", text: $loginPassword, secure: true)
                    Button(loading ? "登录中..." : "密码登录") {
                        Task { await login() }
                    }
                    .buttonStyle(TWPrimaryButtonStyle())
                    .disabled(loading)

                case .register:
                    AuthInputField(placeholder: "昵称", text: $regDisplayName)
                    AuthInputField(placeholder: "用户名", text: $regUsername, noAutoCorrect: true)
                    AuthInputField(placeholder: "邮箱（可选）", text: $regEmail, noAutoCorrect: true)
                    AuthInputField(placeholder: "密码", text: $regPassword, secure: true)
                    Button(loading ? "注册中..." : "创建账号") {
                        Task { await register() }
                    }
                    .buttonStyle(TWPrimaryButtonStyle())
                    .disabled(loading)

                case .code:
                    AuthInputField(placeholder: "邮箱或手机号", text: $codeIdentifier, noAutoCorrect: true)
                    AuthInputField(placeholder: "验证码", text: $codeValue)
                    AuthInputField(placeholder: "首次登录昵称（可选）", text: $codeDisplayName)

                    HStack(spacing: 8) {
                        Button("获取验证码") {
                            Task { await requestCode() }
                        }
                        .buttonStyle(TWSecondaryButtonStyle())
                        .disabled(loading)

                        Button(loading ? "登录中..." : "验证码登录") {
                            Task { await codeLogin() }
                        }
                        .buttonStyle(TWPrimaryButtonStyle())
                        .disabled(loading)
                    }
                }
            }
        }
    }

    private var oauthCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("第三方快捷登录（Demo）")
                    .font(.headline)
                HStack(spacing: 8) {
                    oauthButton(title: "Google", provider: "google")
                    oauthButton(title: "Apple", provider: "apple")
                }
                HStack(spacing: 8) {
                    oauthButton(title: "WeChat", provider: "wechat")
                    oauthButton(title: "GitHub", provider: "github")
                }
            }
        }
    }

    @ViewBuilder
    private func oauthButton(title: String, provider: String) -> some View {
        Button(title) {
            Task { await oauthLogin(provider: provider) }
        }
        .buttonStyle(TWSecondaryButtonStyle())
        .disabled(loading)
    }

    private func syncCampusFields() {
        guard let user = session.user else { return }
        campusName = user.campusName ?? ""
        campusEmail = user.campusEmail ?? ""
    }

    private func verifyCampus() async {
        guard !session.token.isEmpty else {
            session.message = "请先登录"
            return
        }
        loading = true
        defer { loading = false }

        do {
            let payload = CampusVerifyBody(
                campusEmail: campusEmail.trimmingCharacters(in: .whitespacesAndNewlines),
                campusName: campusName.trimmingCharacters(in: .whitespacesAndNewlines),
                studentId: studentId.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            let result: CampusVerifyResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/campus/verify",
                method: .post,
                token: session.token,
                body: payload
            )
            session.user = result.user
            syncCampusFields()
            session.message = "校园认证成功：\(result.campusName ?? result.user.campusName ?? "-")"
        } catch {
            session.message = "校园认证失败：\(error.localizedDescription)"
        }
    }

    private func login() async {
        loading = true
        defer { loading = false }
        do {
            let auth: AuthResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/auth/login",
                method: .post,
                body: LoginBody(identifier: loginIdentifier, password: loginPassword)
            )
            session.applyAuth(auth)
            syncCampusFields()
        } catch {
            session.message = "登录失败：\(error.localizedDescription)"
        }
    }

    private func register() async {
        loading = true
        defer { loading = false }
        do {
            let auth: AuthResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/auth/register",
                method: .post,
                body: RegisterBody(
                    displayName: regDisplayName,
                    username: regUsername,
                    email: regEmail,
                    password: regPassword
                )
            )
            session.applyAuth(auth)
            syncCampusFields()
        } catch {
            session.message = "注册失败：\(error.localizedDescription)"
        }
    }

    private func requestCode() async {
        loading = true
        defer { loading = false }
        do {
            let result: RequestCodeResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/auth/request-code",
                method: .post,
                body: RequestCodeBody(identifier: codeIdentifier)
            )
            codeValue = result.debugCode
            session.message = "验证码已发送到 \(result.identifierHint)（Demo: \(result.debugCode)）"
        } catch {
            session.message = "验证码发送失败：\(error.localizedDescription)"
        }
    }

    private func codeLogin() async {
        loading = true
        defer { loading = false }
        do {
            let auth: AuthResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/auth/code-login",
                method: .post,
                body: CodeLoginBody(
                    identifier: codeIdentifier,
                    code: codeValue,
                    displayName: codeDisplayName
                )
            )
            session.applyAuth(auth)
            syncCampusFields()
        } catch {
            session.message = "验证码登录失败：\(error.localizedDescription)"
        }
    }

    private func oauthLogin(provider: String) async {
        loading = true
        defer { loading = false }
        do {
            let label = String(provider.prefix(1)).uppercased() + String(provider.dropFirst())
            let auth: AuthResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/auth/oauth/mock",
                method: .post,
                body: OAuthMockBody(
                    provider: provider,
                    oauthUserId: getMockOauthUserId(provider: provider),
                    displayName: "\(label) 用户"
                )
            )
            session.applyAuth(auth)
            syncCampusFields()
        } catch {
            session.message = "\(provider) 登录失败：\(error.localizedDescription)"
        }
    }

    private func getMockOauthUserId(provider: String) -> String {
        let key = "oauth_mock_user_\(provider)"
        if let existing = UserDefaults.standard.string(forKey: key), !existing.isEmpty {
            return existing
        }
        let value = "\(provider)_\(Date().timeIntervalSince1970)_\(Int.random(in: 10000...99999))"
        UserDefaults.standard.set(value, forKey: key)
        return value
    }
}
