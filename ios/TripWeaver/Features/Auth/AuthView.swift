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

private struct RequestCodeResponse: Decodable {
    let identifierHint: String
    let debugCode: String
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

    var body: some View {
        NavigationStack {
            Form {
                Section("后端地址") {
                    TextField("http://127.0.0.1:3000", text: $session.apiBaseURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .keyboardType(.URL)
                    Text("上线后改成你的公网域名，例如 https://api.yourdomain.com")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("账号状态") {
                    if let user = session.user {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(user.displayName).font(.headline)
                            Text("@\(user.username)")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        Button("退出登录", role: .destructive) {
                            session.logout()
                        }
                    } else {
                        Text("未登录")
                            .foregroundStyle(.secondary)
                    }

                    if !session.message.isEmpty {
                        Text(session.message)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("登录方式") {
                    Picker("模式", selection: $mode) {
                        ForEach(AuthMode.allCases) { m in
                            Text(m.rawValue).tag(m)
                        }
                    }
                    .pickerStyle(.segmented)

                    switch mode {
                    case .login:
                        TextField("用户名/邮箱", text: $loginIdentifier)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled(true)
                        SecureField("密码", text: $loginPassword)
                        Button(loading ? "登录中..." : "密码登录") {
                            Task { await login() }
                        }
                        .disabled(loading)
                    case .register:
                        TextField("昵称", text: $regDisplayName)
                        TextField("用户名", text: $regUsername)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled(true)
                        TextField("邮箱（可选）", text: $regEmail)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled(true)
                        SecureField("密码", text: $regPassword)
                        Button(loading ? "注册中..." : "创建账号") {
                            Task { await register() }
                        }
                        .disabled(loading)
                    case .code:
                        TextField("邮箱或手机号", text: $codeIdentifier)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled(true)
                        TextField("验证码", text: $codeValue)
                        TextField("首次登录昵称（可选）", text: $codeDisplayName)
                        Button("获取验证码") {
                            Task { await requestCode() }
                        }
                        .disabled(loading)
                        Button(loading ? "登录中..." : "验证码登录") {
                            Task { await codeLogin() }
                        }
                        .disabled(loading)
                    }
                }

                Section("第三方快捷登录（Demo）") {
                    oauthRow(title: "Google", provider: "google")
                    oauthRow(title: "Apple", provider: "apple")
                    oauthRow(title: "WeChat", provider: "wechat")
                    oauthRow(title: "GitHub", provider: "github")
                }
            }
            .navigationTitle("账号")
            .task {
                if session.user == nil, !session.token.isEmpty {
                    await session.refreshMe()
                }
            }
        }
    }

    @ViewBuilder
    private func oauthRow(title: String, provider: String) -> some View {
        Button(title) {
            Task { await oauthLogin(provider: provider) }
        }
        .disabled(loading)
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
