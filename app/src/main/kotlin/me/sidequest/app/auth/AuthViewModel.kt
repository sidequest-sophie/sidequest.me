package me.sidequest.app.auth

// [SQ.M-A-2603-0022] [SQ.M-A-2603-0032]

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.builtin.OTP
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.auth.status.RefreshFailure
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import me.sidequest.app.data.repository.FcmTokenRepository
import javax.inject.Inject

sealed interface AuthState {
    data object Loading         : AuthState
    data object Unauthenticated : AuthState
    data class  Authenticated(val userId: String) : AuthState
    data class  Error(val message: String) : AuthState
}

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val supabase         : SupabaseClient,
    private val fcmTokenRepository: FcmTokenRepository,
) : ViewModel() {

    /** Mirrors the Supabase SDK session status as AuthState. */
    val authState: StateFlow<AuthState> = supabase.auth.sessionStatus
        .map { status ->
            when (status) {
                is SessionStatus.Authenticated -> {
                    // Register/refresh the FCM token whenever a valid session is established
                    viewModelScope.launch {
                        runCatching { fcmTokenRepository.registerToken() }
                    }
                    AuthState.Authenticated(status.session.user?.id ?: "")
                }
                is SessionStatus.NotAuthenticated -> {
                    // Clear the FCM token from the profile on sign-out
                    viewModelScope.launch {
                        runCatching { fcmTokenRepository.clearToken() }
                    }
                    AuthState.Unauthenticated
                }
                SessionStatus.Initializing ->
                    AuthState.Loading
                is SessionStatus.RefreshFailure ->
                    AuthState.Error("Network error — check your connection")
            }
        }
        .stateIn(
            scope         = viewModelScope,
            started       = SharingStarted.WhileSubscribed(5_000),
            initialValue  = AuthState.Loading,
        )

    /** Opens Google OAuth in a browser; app receives token via deep link. */
    fun signInWithGoogle() {
        viewModelScope.launch {
            runCatching { supabase.auth.signInWith(Google) }
        }
    }

    /**
     * Sends a Magic Link to [email].
     * Returns true if the email was sent, false on error.
     */
    suspend fun sendMagicLink(email: String): Boolean {
        return runCatching {
            supabase.auth.signInWith(OTP) {
                this.email = email
                createUser = true   // auto-create account on first sign-in
            }
        }.isSuccess
    }

    fun signOut() {
        viewModelScope.launch {
            runCatching { supabase.auth.signOut() }
        }
    }
}
