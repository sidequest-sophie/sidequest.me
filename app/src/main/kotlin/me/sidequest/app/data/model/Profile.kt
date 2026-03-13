package me.sidequest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// [SQ.M-A-2603-0023]

/**
 * Mirrors the `profiles` Supabase table.
 * Nullable fields reflect columns that may not yet be set by a user.
 */
@Serializable
data class Profile(
    val id: String,
    val username: String,
    @SerialName("display_name")   val displayName: String?   = null,
    val bio: String?                                          = null,
    @SerialName("avatar_url")     val avatarUrl: String?     = null,
    @SerialName("ticker_items")   val tickerItems: List<String>? = null,
    @SerialName("ticker_enabled") val tickerEnabled: Boolean? = true,
)
