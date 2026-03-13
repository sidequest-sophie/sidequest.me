package me.sidequest.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// [SQ.M-A-2603-0029]

/**
 * Mirrors the `writings` Supabase table.
 * The [body] column contains HTML rendered by the web editor.
 * Tags are stored as a text array.
 */
@Serializable
data class Writing(
    val id         : String,
    @SerialName("user_id")    val userId    : String,
    val title      : String,
    val slug       : String,
    val excerpt    : String?      = null,
    /** Full HTML body — only loaded on the detail screen. */
    val body       : String?      = null,
    val tags       : List<String>? = null,
    @SerialName("published_at") val publishedAt: String,
    @SerialName("created_at")   val createdAt  : String,
)
