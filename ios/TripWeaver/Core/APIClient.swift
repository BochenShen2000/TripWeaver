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
            return "iOS 安全策略阻止了当前连接；请优先使用 HTTPS，或在 Xcode 中确认 ATS 放宽配置已生效后再使用 HTTP。"
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

        if let err = try? JSONDecoder().decode(APIErrorResponse.self, from: data),
           let message = err.message {
            throw APIError.server(message)
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

        if !hadScheme {
            if isLocalHost(host) {
                components.scheme = "http"
            } else if isIPAddress(host) {
                components.scheme = "http"
            } else {
                components.scheme = "https"
            }
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

    private static func isIPAddress(_ host: String) -> Bool {
        let v4 = host.split(separator: ".")
        if v4.count == 4 {
            return v4.allSatisfy { part in
                guard let value = Int(part), part.allSatisfy({ $0.isNumber }) else { return false }
                return (0...255).contains(value)
            }
        }
        return false
    }
}
