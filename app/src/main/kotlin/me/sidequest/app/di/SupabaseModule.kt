package me.sidequest.app.di

import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import me.sidequest.app.BuildConfig
import javax.inject.Singleton

// [SQ.M-A-2603-0022]
// Credentials injected from local.properties → BuildConfig at build time.
// See app/local.properties (gitignored) for SUPABASE_URL and SUPABASE_ANON_KEY.

@Module
@InstallIn(SingletonComponent::class)
object SupabaseModule {

    @Provides
    @Singleton
    fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
    ) {
        install(Auth) {
            // Deep link scheme registered in AndroidManifest
            scheme = "sidequest"
            host   = "callback"
        }
        install(Postgrest)
    }
}
