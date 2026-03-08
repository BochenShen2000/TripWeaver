package com.tripweaver.android.ui

import android.net.Uri
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.TravelExplore
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.tripweaver.android.core.SessionStore
import com.tripweaver.android.features.account.AccountScreen
import com.tripweaver.android.features.explore.ExploreScreen
import com.tripweaver.android.features.plan.PlanScreen
import com.tripweaver.android.features.social.ChatThreadScreen
import com.tripweaver.android.features.social.ChatThreadType
import com.tripweaver.android.features.social.SocialScreen

private data class TabItem(val route: String, val label: String, val icon: @Composable () -> Unit)

@Composable
fun TripWeaverApp(session: SessionStore) {
    val navController = rememberNavController()
    val tabs = listOf(
        TabItem("plan", "路线") { Icon(Icons.Default.Map, contentDescription = null) },
        TabItem("explore", "发现") { Icon(Icons.Default.TravelExplore, contentDescription = null) },
        TabItem("social", "聊天") { Icon(Icons.Default.Message, contentDescription = null) },
        TabItem("account", "账号") { Icon(Icons.Default.Person, contentDescription = null) },
    )

    val backStack by navController.currentBackStackEntryAsState()
    val current = backStack?.destination?.route.orEmpty()
    val showBottom = tabs.any { current.startsWith(it.route) }

    TwAppSurface {
        Scaffold(
            bottomBar = {
                if (showBottom) {
                    NavigationBar {
                        tabs.forEach { tab ->
                            val selected = current.startsWith(tab.route)
                            NavigationBarItem(
                                selected = selected,
                                onClick = {
                                    navController.navigate(tab.route) {
                                        popUpTo(navController.graph.findStartDestination().id) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                },
                                icon = tab.icon,
                                label = { Text(tab.label) },
                            )
                        }
                    }
                }
            },
        ) { padding ->
            NavHost(
                navController = navController,
                startDestination = "plan",
                modifier = Modifier.padding(padding),
            ) {
                composable("plan") {
                    PlanScreen(session = session)
                }
                composable("explore") {
                    ExploreScreen(
                        session = session,
                        onOpenChat = { type, id, title, subtitle, joined ->
                            openChatThread(navController, type, id, title, subtitle, joined)
                        },
                    )
                }
                composable("social") {
                    SocialScreen(
                        session = session,
                        onOpenChat = { type, id, title, subtitle, joined ->
                            openChatThread(navController, type, id, title, subtitle, joined)
                        },
                    )
                }
                composable("account") {
                    AccountScreen(session = session)
                }
                composable(
                    route = "chat/{type}/{id}/{title}/{subtitle}/{joined}",
                    arguments = listOf(
                        navArgument("type") { type = NavType.StringType },
                        navArgument("id") { type = NavType.StringType },
                        navArgument("title") { type = NavType.StringType },
                        navArgument("subtitle") { type = NavType.StringType },
                        navArgument("joined") { type = NavType.BoolType },
                    ),
                ) { entry ->
                    val args = entry.toChatArgs()
                    ChatThreadScreen(
                        session = session,
                        type = args.type,
                        id = args.id,
                        title = args.title,
                        subtitle = args.subtitle,
                        initiallyJoined = args.joined,
                    )
                }
            }
        }
    }
}

private data class ChatArgs(
    val type: ChatThreadType,
    val id: String,
    val title: String,
    val subtitle: String,
    val joined: Boolean,
)

private fun NavBackStackEntry.toChatArgs(): ChatArgs {
    val rawType = arguments?.getString("type").orEmpty()
    val type = ChatThreadType.fromRoute(rawType)
    return ChatArgs(
        type = type,
        id = Uri.decode(arguments?.getString("id").orEmpty()),
        title = Uri.decode(arguments?.getString("title").orEmpty()),
        subtitle = Uri.decode(arguments?.getString("subtitle").orEmpty()),
        joined = arguments?.getBoolean("joined") ?: true,
    )
}

private fun openChatThread(
    navController: NavHostController,
    type: ChatThreadType,
    id: String,
    title: String,
    subtitle: String,
    joined: Boolean,
) {
    val route = listOf(
        "chat",
        type.route,
        Uri.encode(id),
        Uri.encode(title),
        Uri.encode(subtitle),
        joined.toString(),
    ).joinToString("/")
    navController.navigate(route)
}
