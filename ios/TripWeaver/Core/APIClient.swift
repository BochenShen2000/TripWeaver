import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case server(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "API 地址无效"
        case .invalidResponse:
            return "服务响应异常"
        case .server(let message):
            return message
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
        guard let url = URL(string: baseURL.trimmingCharacters(in: .whitespacesAndNewlines) + path) else {
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

        let (data, response) = try await URLSession.shared.data(for: req)
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
}
