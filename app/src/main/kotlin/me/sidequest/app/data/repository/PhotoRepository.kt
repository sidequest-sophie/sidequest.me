package me.sidequest.app.data.repository

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import me.sidequest.app.data.model.Photo
import javax.inject.Inject
import javax.inject.Singleton

// [SQ.M-A-2603-0027]

@Singleton
class PhotoRepository @Inject constructor(
    private val supabase: SupabaseClient,
) {
    /**
     * Returns a page of photos for [userId], ordered newest-first.
     * @param page  0-indexed page number.
     * @param pageSize  Number of photos per page.
     */
    suspend fun getPhotos(
        userId   : String,
        page     : Int,
        pageSize : Int = PAGE_SIZE,
    ): List<Photo> = runCatching {
        supabase.postgrest["photos"]
            .select(Columns.ALL) {
                filter { eq("user_id", userId) }
                order("created_at", Order.DESCENDING)
                range(
                    from = (page * pageSize).toLong(),
                    to   = (page * pageSize + pageSize - 1).toLong(),
                )
            }
            .decodeList<Photo>()
    }.getOrDefault(emptyList())

    companion object {
        const val PAGE_SIZE = 30
    }
}
