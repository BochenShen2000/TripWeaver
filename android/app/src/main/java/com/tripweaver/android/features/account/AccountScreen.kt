package com.tripweaver.android.features.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.tripweaver.android.core.ApiClient
import com.tripweaver.android.core.SessionStore
import com.tripweaver.android.model.AuthResponse
import com.tripweaver.android.model.CampusVerifyResponse
import com.tripweaver.android.model.RequestCodeResponse
import com.tripweaver.android.ui.TwCard
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

private enum class AuthMode(val label: String) {
    LOGIN("登录"),
    REGISTER("注册"),
    CODE("邮箱验证码"),
}

@Serializable
private data class LoginBody(val identifier: String, val password: String)

@Serializable
private data class RegisterBody(
    val displayName: String,
    val username: String,
    val email: String,
    val password: String,
)

@Serializable
private data class RequestCodeBody(val email: String)

@Serializable
private data class CodeLoginBody(
    val email: String,
    val code: String,
    val displayName: String,
)

@Serializable
private data class OAuthMockBody(
    val provider: String,
    val oauthUserId: String,
    val displayName: String,
)

@Serializable
private data class CampusVerifyBody(
    val campusEmail: String,
    val campusName: String,
    val studentId: String,
)

@Composable
@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
fun AccountScreen(session: SessionStore) {
    val scope = rememberCoroutineScope()

    var mode by remember { mutableStateOf(AuthMode.LOGIN) }
    var loading by remember { mutableStateOf(false) }

    var loginIdentifier by remember { mutableStateOf("") }
    var loginPassword by remember { mutableStateOf("") }

    var regDisplayName by remember { mutableStateOf("") }
    var regUsername by remember { mutableStateOf("") }
    var regEmail by remember { mutableStateOf("") }
    var regPassword by remember { mutableStateOf("") }

    var codeIdentifier by remember { mutableStateOf("") }
    var codeValue by remember { mutableStateOf("") }
    var codeDisplayName by remember { mutableStateOf("") }

    var campusName by remember { mutableStateOf(session.user?.campusName.orEmpty()) }
    var campusEmail by remember { mutableStateOf(session.user?.campusEmail.orEmpty()) }
    var studentId by remember { mutableStateOf("") }

    fun applyAuth(auth: AuthResponse) {
        session.applyAuth(auth)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("TripWeaver")
                    Text("支持密码、邮箱验证码、第三方快捷登录")
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("后端地址")
                    OutlinedTextField(
                        value = session.apiBaseUrl,
                        onValueChange = { session.setApiBaseUrl(it) },
                        label = { Text("https://api.yourdomain.com") },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Text("优先使用 HTTPS；若是内网 HTTP，请填 http://IP:端口")
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("当前状态")
                    if (session.user != null) {
                        Text(session.user?.displayName.orEmpty())
                        Text("@${session.user?.username.orEmpty()}")
                        Text(if (session.user?.campusVerified == true) "校园认证已通过" else "未校园认证")
                        Button(onClick = { session.logout() }) { Text("退出登录") }
                    } else {
                        Text("未登录")
                    }
                    if (session.message.isNotBlank()) Text(session.message)
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("大学生认证")
                    if (session.user == null) {
                        Text("请先登录")
                    } else {
                        OutlinedTextField(value = campusName, onValueChange = { campusName = it }, label = { Text("学校名称") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = campusEmail, onValueChange = { campusEmail = it }, label = { Text("校园邮箱") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = studentId, onValueChange = { studentId = it }, label = { Text("学号(可选)") }, modifier = Modifier.fillMaxWidth())
                        Button(onClick = {
                            scope.launch {
                                loading = true
                                try {
                                    val resp = ApiClient.post<CampusVerifyResponse, CampusVerifyBody>(
                                        baseUrl = session.apiBaseUrl,
                                        path = "/api/campus/verify",
                                        token = session.token,
                                        body = CampusVerifyBody(campusEmail = campusEmail, campusName = campusName, studentId = studentId),
                                    )
                                    session.user = resp.user
                                    session.message = "校园认证成功：${resp.campusName ?: resp.user.campusName ?: "-"}"
                                } catch (e: Exception) {
                                    session.message = "校园认证失败：${e.message ?: "unknown"}"
                                } finally {
                                    loading = false
                                }
                            }
                        }, enabled = !loading) {
                            Text(if (loading) "认证中..." else "提交校园认证")
                        }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                        AuthMode.entries.forEachIndexed { idx, m ->
                            SegmentedButton(
                                selected = mode == m,
                                onClick = { mode = m },
                                shape = androidx.compose.material3.SegmentedButtonDefaults.itemShape(idx, AuthMode.entries.size),
                            ) {
                                Text(m.label)
                            }
                        }
                    }

                    when (mode) {
                        AuthMode.LOGIN -> {
                            OutlinedTextField(value = loginIdentifier, onValueChange = { loginIdentifier = it }, label = { Text("用户名/邮箱") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(value = loginPassword, onValueChange = { loginPassword = it }, label = { Text("密码") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
                            Button(onClick = {
                                scope.launch {
                                    loading = true
                                    try {
                                        val auth = ApiClient.post<AuthResponse, LoginBody>(
                                            baseUrl = session.apiBaseUrl,
                                            path = "/api/auth/login",
                                            body = LoginBody(identifier = loginIdentifier, password = loginPassword),
                                        )
                                        applyAuth(auth)
                                    } catch (e: Exception) {
                                        session.message = "登录失败：${e.message ?: "unknown"}"
                                    } finally {
                                        loading = false
                                    }
                                }
                            }, enabled = !loading) {
                                Text(if (loading) "登录中..." else "密码登录")
                            }
                        }

                        AuthMode.REGISTER -> {
                            OutlinedTextField(value = regDisplayName, onValueChange = { regDisplayName = it }, label = { Text("昵称") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(value = regUsername, onValueChange = { regUsername = it }, label = { Text("用户名") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(value = regEmail, onValueChange = { regEmail = it }, label = { Text("邮箱(可选)") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(value = regPassword, onValueChange = { regPassword = it }, label = { Text("密码") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
                            Button(onClick = {
                                scope.launch {
                                    loading = true
                                    try {
                                        val auth = ApiClient.post<AuthResponse, RegisterBody>(
                                            baseUrl = session.apiBaseUrl,
                                            path = "/api/auth/register",
                                            body = RegisterBody(
                                                displayName = regDisplayName,
                                                username = regUsername,
                                                email = regEmail,
                                                password = regPassword,
                                            ),
                                        )
                                        applyAuth(auth)
                                    } catch (e: Exception) {
                                        session.message = "注册失败：${e.message ?: "unknown"}"
                                    } finally {
                                        loading = false
                                    }
                                }
                            }, enabled = !loading) {
                                Text(if (loading) "注册中..." else "创建账号")
                            }
                        }

                        AuthMode.CODE -> {
                            OutlinedTextField(value = codeIdentifier, onValueChange = { codeIdentifier = it }, label = { Text("邮箱地址") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(value = codeValue, onValueChange = { codeValue = it }, label = { Text("验证码") }, modifier = Modifier.fillMaxWidth())
                            OutlinedTextField(value = codeDisplayName, onValueChange = { codeDisplayName = it }, label = { Text("首次登录昵称(可选)") }, modifier = Modifier.fillMaxWidth())
                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Button(onClick = {
                                    scope.launch {
                                        loading = true
                                        try {
                                            val resp = ApiClient.post<RequestCodeResponse, RequestCodeBody>(
                                                baseUrl = session.apiBaseUrl,
                                                path = "/api/auth/email/request-code",
                                                body = RequestCodeBody(codeIdentifier),
                                            )
                                            session.message = "验证码已发送到 ${resp.identifierHint}${resp.debugCode?.let { "（调试码：$it）" } ?: ""}"
                                        } catch (e: Exception) {
                                            session.message = "验证码发送失败：${e.message ?: "unknown"}"
                                        } finally {
                                            loading = false
                                        }
                                    }
                                }, enabled = !loading) { Text("获取验证码") }

                                Button(onClick = {
                                    scope.launch {
                                        loading = true
                                        try {
                                            val auth = ApiClient.post<AuthResponse, CodeLoginBody>(
                                                baseUrl = session.apiBaseUrl,
                                                path = "/api/auth/email/code-login",
                                                body = CodeLoginBody(codeIdentifier, codeValue, codeDisplayName),
                                            )
                                            applyAuth(auth)
                                        } catch (e: Exception) {
                                            session.message = "验证码登录失败：${e.message ?: "unknown"}"
                                        } finally {
                                            loading = false
                                        }
                                    }
                                }, enabled = !loading) { Text(if (loading) "登录中..." else "邮箱验证码登录/注册") }
                            }
                        }
                    }
                }
            }
        }

        item {
            TwCard {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("第三方快捷登录（Demo）")
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("google", "apple", "wechat", "github").forEach { provider ->
                            TextButton(onClick = {
                                scope.launch {
                                    loading = true
                                    try {
                                        val oauthUserId = "${provider}_${System.currentTimeMillis()}"
                                        val auth = ApiClient.post<AuthResponse, OAuthMockBody>(
                                            baseUrl = session.apiBaseUrl,
                                            path = "/api/auth/oauth/mock",
                                            body = OAuthMockBody(
                                                provider = provider,
                                                oauthUserId = oauthUserId,
                                                displayName = provider.replaceFirstChar { it.uppercase() } + " 用户",
                                            ),
                                        )
                                        applyAuth(auth)
                                    } catch (e: Exception) {
                                        session.message = "$provider 登录失败：${e.message ?: "unknown"}"
                                    } finally {
                                        loading = false
                                    }
                                }
                            }) {
                                Text(provider.replaceFirstChar { it.uppercase() })
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}
