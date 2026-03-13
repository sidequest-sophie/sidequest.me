package me.sidequest.app

// [SQ.M-A-2603-0021] [SQ.M-A-2603-0022] [SQ.M-A-2603-0032]

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.handleDeeplinks
import me.sidequest.app.push.SideQuestFirebaseMessagingService.Companion.ACTION_NOTIFICATION_TAP
import me.sidequest.app.push.SideQuestFirebaseMessagingService.Companion.EXTRA_NOTIFICATION_TARGET_ID
import me.sidequest.app.push.SideQuestFirebaseMessagingService.Companion.EXTRA_NOTIFICATION_TYPE
import me.sidequest.app.ui.navigation.Screen
import me.sidequest.app.ui.navigation.SideQuestBottomBar
import me.sidequest.app.ui.navigation.SideQuestNavHost
import me.sidequest.app.ui.navigation.routesWithoutNav
import me.sidequest.app.ui.theme.SideQuestTheme
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var supabase: SupabaseClient

    // ─── Notification permission (Android 13+) ────────────────────────────────

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* granted/denied — UI is unaffected either way */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Handle a deep link that cold-launched the activity (e.g. magic-link email tap)
        supabase.handleDeeplinks(intent)

        // Request POST_NOTIFICATIONS on Android 13+ on first launch
        requestNotificationPermissionIfNeeded()

        setContent {
            SideQuestTheme {
                val navController = rememberNavController()
                val currentEntry  by navController.currentBackStackEntryAsState()
                val currentRoute  = currentEntry?.destination?.route
                val showBottomBar = currentRoute !in routesWithoutNav

                // Navigate to the target screen if this launch was triggered by a
                // notification tap. Only fires once per intent (saveable state).
                var handled by rememberSaveable { mutableStateOf(false) }
                LaunchedEffect(intent) {
                    if (!handled && intent?.action == ACTION_NOTIFICATION_TAP) {
                        handled = true
                        handleNotificationDeepLink(navController, intent)
                    }
                }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        if (showBottomBar) {
                            SideQuestBottomBar(navController = navController)
                        }
                    }
                ) { innerPadding ->
                    SideQuestNavHost(
                        navController = navController,
                        modifier = Modifier.padding(innerPadding),
                    )
                }
            }
        }
    }

    /** Handle deep links arriving while the activity is already running. */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        supabase.handleDeeplinks(intent)
        // Notification tap while app is foregrounded / in back-stack:
        // update the intent so the LaunchedEffect can react on recomposition.
        this.intent = intent
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (ContextCompat.checkSelfPermission(
                this, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        ) return
        notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
    }
}

/**
 * Parses the extras written by [SideQuestFirebaseMessagingService] and navigates
 * the NavController to the matching screen.
 *
 * Supported types:
 *   "writing"  → WritingDetail(id)
 *   "photo"    → Lightbox(index)
 *   "profile"  → Profile
 */
fun handleNotificationDeepLink(navController: NavController, intent: Intent) {
    val type     = intent.getStringExtra(EXTRA_NOTIFICATION_TYPE)     ?: return
    val targetId = intent.getStringExtra(EXTRA_NOTIFICATION_TARGET_ID) ?: ""

    when (type) {
        "writing" -> {
            if (targetId.isNotBlank()) {
                navController.navigate(Screen.WritingDetail.routeFor(targetId))
            }
        }
        "photo" -> {
            val index = targetId.toIntOrNull() ?: 0
            navController.navigate(Screen.Lightbox.routeFor(index))
        }
        "profile" -> {
            navController.navigate(Screen.Profile.route) {
                launchSingleTop = true
            }
        }
    }
}
