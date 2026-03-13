package me.sidequest.app.data.repository

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import me.sidequest.app.data.model.Profile
import javax.inject.Inject
import javax.inject.Singleton

// [SQ.M-A-2603-0023]

@Singleton
class ProfileRepository @Inject constructor(
    private val supabase: SupabaseClient,
) {
    /** Fetch a single profile by user UUID. Returns null if not found. */
    suspend fun getProfileById(userId: String): Profile? =
        runCatching {
            supabase.postgrest["profiles"]
                .select(Columns.ALL) {
                    filter { eq("id", userId) }
                }
                .decodeSingle<Profile>()
        }.getOrNull()
}
