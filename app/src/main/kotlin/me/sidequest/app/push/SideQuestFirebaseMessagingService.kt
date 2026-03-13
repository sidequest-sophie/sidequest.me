package me.sidequest.app.push

// [SQ.M-A-2603-0032]

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import me.sidequest.app.MainActivity
import me.sidequest.app.R
import me.sidequest.app.data.repository.FcmTokenRepository
import javax.inject.Inject

/**
 * Receives FCM messages and token refreshes.
 *
 * Notification payload shape expected from Supabase Edge Function:
 *   {
 *     "title":   "New writing posted",
 *     "body":    "Sophie posted a new entry",
 *     "type":    "writing" | "photo" | "profile",
 *     "targetId": "<id>"          // writingId / photoIndex / userId
 *   }
 *
 * Tapping the notification opens MainActivity and passes the deep-link
 * intent extras so the NavHost can navigate directly to the correct screen.
 */
@AndroidEntryPoint
class SideQuestFirebaseMessagingService : FirebaseMessagingService() {

    @Inject lateinit var fcmTokenRepository: FcmTokenRepository

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    // ─── Token refresh ────────────────────────────────────────────────────────

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        serviceScope.launch {
            runCatching { fcmTokenRepository.registerToken() }
        }
    }

    // ─── Message received ─────────────────────────────────────────────────────

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)

        val data     = message.data
        val notifData = message.notification

        val title    = data["title"]    ?: notifData?.title    ?: "SideQuest"
        val body     = data["body"]     ?: notifData?.body     ?: ""
        val type     = data["type"]     ?: ""
        val targetId = data["targetId"] ?: ""

        showNotification(title, body, type, targetId)
    }

    // ─── Show notification ────────────────────────────────────────────────────

    private fun showNotification(
        title   : String,
        body    : String,
        type    : String,
        targetId: String,
    ) {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        ensureChannel(nm)

        val tapIntent = Intent(this, MainActivity::class.java).apply {
            action = ACTION_NOTIFICATION_TAP
            flags  = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_NOTIFICATION_TYPE, type)
            putExtra(EXTRA_NOTIFICATION_TARGET_ID, targetId)
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        nm.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun ensureChannel(nm: NotificationManager) {
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "SideQuest Updates",
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply { description = "Updates from your SideQuest" }
        nm.createNotificationChannel(channel)
    }

    companion object {
        const val CHANNEL_ID                  = "sidequest_updates"
        const val ACTION_NOTIFICATION_TAP     = "me.sidequest.app.NOTIFICATION_TAP"
        const val EXTRA_NOTIFICATION_TYPE     = "notification_type"
        const val EXTRA_NOTIFICATION_TARGET_ID = "notification_target_id"
    }
}
