import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case server(String)
    case secureConnectionRequired

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "API 地址无效"
        case .invalidResponse:
            return "服务响应异常"
        case .server(let message):
            return message
        case .secureConnectionRequired:
            return "iOS 安全策略阻止了不安全连接，请使用 HTTPS 后端地址（本地调试可用 http://127.0.0.1:3000）"
        }
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
}

struct APIClient {
    static func request<T: Decodable, B: Encodable>(
        baseURL: String,
        path: String,
        method: HTTPMethod = .get,
        token: String? = nil,
        body: B? = nil
    ) async throws -> T {
        let normalizedBaseURL = normalizedBaseURL(from: baseURL)
        guard let url = URL(string: normalizedBaseURL + path) else {
            throw APIError.invalidURL
        }

        var req = URLRequest(url: url)
        req.httpMethod = method.rawValue
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token, !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body {
            req.httpBody = try JSONEncoder().encode(body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: req)
        } catch let urlError as URLError {
            if urlError.code == .appTransportSecurityRequiresSecureConnection {
                throw APIError.secureConnectionRequired
            }
            throw APIError.server(urlError.localizedDescription)
        } catch {
            throw APIError.server(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        if (200..<300).contains(http.statusCode) {
            return try JSONDecoder().decode(T.self, from: data)
        }

        if let err = try? JSONDecoder().decode(APIErrorResponse.self, from: data) {
            throw APIError.server(err.error)
        }

        throw APIError.server("请求失败 (\(http.statusCode))")
    }

    static func request<T: Decodable>(
        baseURL: String,
        path: String,
        token: String? = nil
    ) async throws -> T {
        try await request(
            baseURL: baseURL,
            path: path,
            method: .get,
            token: token,
            body: Optional<String>.none
        )
    }

    private static func normalizedBaseURL(from raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return trimmed }

        let hadScheme = trimmed.lowercased().hasPrefix("http://") || trimmed.lowercased().hasPrefix("https://")
        let candidate = hadScheme ? trimmed : "https://\(trimmed)"
        guard var components = URLComponents(string: candidate), let host = components.host else {
            return trimTrailingSlash(from: candidate)
        }

        if components.scheme?.lowercased() == "http" && !isLocalHost(host) {
            components.scheme = "https"
        }

        if !hadScheme && isLocalHost(host) {
            components.scheme = "http"
        }

        let normalized = components.string ?? candidate
        return trimTrailingSlash(from: normalized)
    }

    private static func trimTrailingSlash(from value: String) -> String {
        guard value.count > 1 else { return value }
        return value.hasSuffix("/") ? String(value.dropLast()) : value
    }

    private static func isLocalHost(_ host: String) -> Bool {
        let lower = host.lowercased()
        if lower == "localhost" || lower == "::1" || lower.hasSuffix(".local") {
            return true
        }
        if lower.hasPrefix("127.") || lower.hasPrefix("10.") || lower.hasPrefix("192.168.") {
            return true
        }
        if lower.hasPrefix("172.") {
            let parts = lower.split(separator: ".")
            if parts.count >= 2, let second = Int(parts[1]), (16...31).contains(second) {
                return true
            }
        }
        return false
    }
}
