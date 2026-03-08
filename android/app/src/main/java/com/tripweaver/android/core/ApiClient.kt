package com.tripweaver.android.core

import com.tripweaver.android.model.ApiErrorResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.net.URI
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

class ApiException(message: String) : Exception(message)

object ApiClient {
    private val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        isLenient = true
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    suspend inline fun <reified T> get(
        baseUrl: String,
        path: String,
        token: String? = null,
    ): T = request(baseUrl, path, "GET", token, bodyJson = null)

    suspend inline fun <reified T, reified B> post(
        baseUrl: String,
        path: String,
        body: B,
        token: String? = null,
    ): T = request(baseUrl, path, "POST", token, json.encodeToString(body))

    suspend inline fun <reified T> request(
        baseUrl: String,
        path: String,
        method: String,
        token: String?,
        bodyJson: String?,
    ): T = withContext(Dispatchers.IO) {
        val normalized = normalizeBaseUrl(baseUrl)
        val url = normalized + path

        val builder = Request.Builder().url(url)
            .addHeader("Content-Type", "application/json")
        if (!token.isNullOrBlank()) {
            builder.addHeader("Authorization", "Bearer $token")
        }
        if (method == "POST") {
            val body = (bodyJson ?: "{}").toRequestBody("application/json; charset=utf-8".toMediaType())
            builder.post(body)
        } else {
            builder.get()
        }

        client.newCall(builder.build()).execute().use { resp ->
            val body = resp.body?.string().orEmpty()
            if (resp.isSuccessful) {
                return@withContext json.decodeFromString<T>(body)
            }
            val err = runCatching { json.decodeFromString<ApiErrorResponse>(body) }.getOrNull()
            val message = err?.error?.takeIf { it.isNotBlank() }
                ?: err?.detail?.takeIf { it.isNotBlank() }
                ?: "请求失败 (${resp.code})"
            throw ApiException(message)
        }
    }

    fun normalizeBaseUrl(raw: String): String {
        val trimmed = raw.trim()
        if (trimmed.isEmpty()) return ""
        val hadScheme = trimmed.startsWith("http://", true) || trimmed.startsWith("https://", true)
        val candidate = if (hadScheme) trimmed else "https://$trimmed"
        val uri = runCatching { URI(candidate) }.getOrNull() ?: return trimSlash(candidate)
        val host = uri.host ?: return trimSlash(candidate)
        val scheme = if (hadScheme) {
            uri.scheme ?: "https"
        } else if (isLocalHost(host) || isIp(host)) {
            "http"
        } else {
            "https"
        }
        val rebuilt = URI(
            scheme,
            uri.userInfo,
            host,
            uri.port,
            uri.path,
            uri.query,
            uri.fragment,
        ).toString()
        return trimSlash(rebuilt)
    }

    fun query(params: Map<String, String?>): String {
        return params.entries
            .filter { !it.value.isNullOrBlank() }
            .joinToString("&") { (k, v) ->
                "${URLEncoder.encode(k, Charsets.UTF_8.name())}=${URLEncoder.encode(v.orEmpty(), Charsets.UTF_8.name())}"
            }
    }

    private fun trimSlash(v: String): String = if (v.length > 1 && v.endsWith('/')) v.dropLast(1) else v

    private fun isLocalHost(host: String): Boolean {
        val h = host.lowercase()
        if (h == "localhost" || h == "::1" || h.endsWith(".local")) return true
        if (h.startsWith("127.") || h.startsWith("10.") || h.startsWith("192.168.")) return true
        if (h.startsWith("172.")) {
            val parts = h.split('.')
            if (parts.size >= 2) {
                val second = parts[1].toIntOrNull()
                if (second != null && second in 16..31) return true
            }
        }
        return false
    }

    private fun isIp(host: String): Boolean {
        val parts = host.split('.')
        if (parts.size != 4) return false
        return parts.all { it.all(Char::isDigit) && (it.toIntOrNull() ?: -1) in 0..255 }
    }
}
