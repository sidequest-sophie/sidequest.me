package me.sidequest.app.data.repository

// [SQ.M-A-2603-0032]

import com.google.firebase.messaging.FirebaseMessaging
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.tasks.await
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FcmTokenRepository @Inject constructor(
    private val supabase: SupabaseClient,
) {

    /**
     * Retrieves the current FCM registration token and uploads it to the user's
     * Supabase profile row so the backend can target push notifications.
     *
     * Safe to call multiple times — Supabase update is idempotent.
     */
    suspend fun registerToken() {
        val userId = supabase.auth.currentUserOrNull()?.id ?: return
        val token  = FirebaseMessaging.getInstance().token.await()

        supabase.postgrest["profiles"].update(
            value  = FcmTokenUpdate(fcmToken = token),
            request = { filter { eq("id", userId) }  },
        )
    }

    /**
     * Clears the FCM token from the profile row on logout so the user stops
     * receiving notifications.
     */
    suspend fun clearToken() {
        val userId = supabase.auth.currentUserOrNull()?.id ?: return
        supabase.postgrest["profiles"].update(
            value  = FcmTokenUpdate(fcmToken = null),
            request = { filter { eq("id", userId) } },
        )
    }

    @Serializable
    private data class FcmTokenUpdate(
        @SerialName("fcm_token") val fcmToken: String?,
    )
}
