package me.sidequest.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import me.sidequest.app.ui.screens.EditProfileScreen
import me.sidequest.app.ui.screens.FeedScreen
import me.sidequest.app.ui.screens.LightboxScreen
import me.sidequest.app.ui.screens.LoginScreen
import me.sidequest.app.ui.screens.PhotowallScreen
import me.sidequest.app.ui.screens.ProfileScreen
import me.sidequest.app.ui.screens.WritingDetailScreen
import me.sidequest.app.ui.screens.WritingsScreen

// [SQ.M-A-2603-0021] [SQ.M-A-2603-0024] [SQ.M-A-2603-0027] [SQ.M-A-2603-0029] [SQ.M-A-2603-0030]

@Composable
fun SideQuestNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Login.route,
        modifier = modifier,
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Profile.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                onEditProfile = { navController.navigate(Screen.EditProfile.route) },
            )
        }

        composable(Screen.EditProfile.route) {
            EditProfileScreen(
                onSaved = { navController.popBackStack() },
                onBack  = { navController.popBackStack() },
            )
        }

        composable(Screen.Photowall.route) {
            PhotowallScreen(
                onPhotoClick = { index ->
                    navController.navigate(Screen.Lightbox.routeFor(index))
                },
            )
        }

        composable(
            route    = Screen.Lightbox.route,
            arguments = listOf(androidx.navigation.navArgument("index") {
                type = androidx.navigation.NavType.IntType
            }),
        ) { backStack ->
            val startIndex = backStack.arguments?.getInt("index") ?: 0
            LightboxScreen(
                startIndex = startIndex,
                onBack     = { navController.popBackStack() },
            )
        }

        composable(Screen.Writings.route) {
            WritingsScreen(
                onWritingClick = { id ->
                    navController.navigate(Screen.WritingDetail.routeFor(id))
                },
            )
        }

        composable(
            route     = Screen.WritingDetail.route,
            arguments = listOf(androidx.navigation.navArgument("id") {
                type = androidx.navigation.NavType.StringType
            }),
        ) {
            WritingDetailScreen(
                onBack = { navController.popBackStack() },
            )
        }

        composable(Screen.Feed.route) {
            FeedScreen()
        }
    }
}

sealed class Screen(val route: String) {
    data object Login       : Screen("login")
    data object Profile     : Screen("profile")
    data object EditProfile : Screen("edit_profile")
    data object Photowall   : Screen("photowall")
    data object Lightbox    : Screen("lightbox/{index}") {
        fun routeFor(index: Int) = "lightbox/$index"
    }
    data object Writings      : Screen("writings")
    data object WritingDetail : Screen("writing/{id}") {
        fun routeFor(id: String) = "writing/$id"
    }
    data object Feed          : Screen("feed")
}
