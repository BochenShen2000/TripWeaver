package com.tripweaver.android.core

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.tripweaver.android.model.AuthResponse
import com.tripweaver.android.model.AuthUser
import com.tripweaver.android.model.MeResponse
import com.tripweaver.android.model.Plan
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class SessionStore(context: Context) {
    private val appContext = context.applicationContext
    private val prefs = appContext.getSharedPreferences("tripweaver_session", Context.MODE_PRIVATE)

    var token by mutableStateOf(prefs.getString(KEY_TOKEN, "").orEmpty())
        private set
    var user by mutableStateOf<AuthUser?>(null)
    var apiBaseUrl by mutableStateOf(prefs.getString(KEY_BASE_URL, "http://127.0.0.1:3000").orEmpty())
        private set
    var message by mutableStateOf("")
    var pendingManualPlan by mutableStateOf<Plan?>(null)

    val isLoggedIn: Boolean
        get() = token.isNotBlank() && user != null

    fun setApiBaseUrl(value: String) {
        apiBaseUrl = value
        prefs.edit().putString(KEY_BASE_URL, value).apply()
    }

    fun applyAuth(auth: AuthResponse) {
        token = auth.token
        user = auth.user
        prefs.edit().putString(KEY_TOKEN, auth.token).apply()
        message = "已登录：${auth.user.displayName}"
    }

    fun logout() {
        token = ""
        user = null
        pendingManualPlan = null
        prefs.edit().remove(KEY_TOKEN).apply()
        message = "已退出登录"
    }

    fun setPendingManualPlan(plan: Plan?) {
        pendingManualPlan = plan
    }

    fun bootstrap(scope: CoroutineScope) {
        if (token.isBlank()) return
        scope.launch {
            runCatching {
                withContext(Dispatchers.IO) {
                    ApiClient.get<MeResponse>(
                        baseUrl = apiBaseUrl,
                        path = "/api/auth/me",
                        token = token,
                    )
                }
            }.onSuccess {
                user = it.user
            }.onFailure {
                logout()
            }
        }
    }

    companion object {
        private const val KEY_TOKEN = "token"
        private const val KEY_BASE_URL = "base_url"
    }
}
