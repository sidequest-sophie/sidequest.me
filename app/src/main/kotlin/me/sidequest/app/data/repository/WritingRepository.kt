package me.sidequest.app.data.repository

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import me.sidequest.app.data.model.Writing
import javax.inject.Inject
import javax.inject.Singleton

// [SQ.M-A-2603-0029] [SQ.M-A-2603-0030]

@Singleton
class WritingRepository @Inject constructor(
    private val supabase: SupabaseClient,
) {
    /**
     * Returns a page of writings (summary columns only — no body).
     * @param tag  Optional tag filter; pass null for all writings.
     */
    suspend fun getWritings(
        userId  : String,
        tag     : String? = null,
        page    : Int     = 0,
        pageSize: Int     = PAGE_SIZE,
    ): List<Writing> = runCatching {
        supabase.postgrest["writings"]
            .select(Columns.list("id", "user_id", "title", "slug", "excerpt", "tags", "published_at", "created_at")) {
                filter {
                    eq("user_id", userId)
                    if (tag != null) contains("tags", listOf(tag))
                }
                order("published_at", Order.DESCENDING)
                range(
                    from = (page * pageSize).toLong(),
                    to   = (page * pageSize + pageSize - 1).toLong(),
                )
            }
            .decodeList<Writing>()
    }.getOrDefault(emptyList())

    /** Loads a single writing by ID, including the full HTML body. */
    suspend fun getWritingById(id: String): Writing? = runCatching {
        supabase.postgrest["writings"]
            .select(Columns.ALL) {
                filter { eq("id", id) }
                limit(1)
            }
            .decodeSingleOrNull<Writing>()
    }.getOrNull()

    companion object {
        const val PAGE_SIZE = 20
    }
}
