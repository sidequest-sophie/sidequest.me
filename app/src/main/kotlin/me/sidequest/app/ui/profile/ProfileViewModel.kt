package me.sidequest.app.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import me.sidequest.app.data.model.Profile
import me.sidequest.app.data.repository.ProfileRepository
import javax.inject.Inject

// [SQ.M-A-2603-0023]

sealed interface ProfileState {
    data object Loading : ProfileState
    data class  Success(val profile: Profile, val isOwner: Boolean) : ProfileState
    data class  Error(val message: String) : ProfileState
}

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val supabase: SupabaseClient,
    private val repository: ProfileRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<ProfileState>(ProfileState.Loading)
    val state: StateFlow<ProfileState> = _state.asStateFlow()

    init {
        loadOwnProfile()
    }

    /**
     * Loads the current authenticated user's own profile.
     * Called on Profile tab — always owner view.
     */
    fun loadOwnProfile() {
        viewModelScope.launch {
            _state.value = ProfileState.Loading
            val userId = supabase.auth.currentUserOrNull()?.id
            if (userId == null) {
                _state.value = ProfileState.Error("Not logged in")
                return@launch
            }
            val profile = repository.getProfileById(userId)
            _state.value = if (profile != null) {
                ProfileState.Success(profile = profile, isOwner = true)
            } else {
                ProfileState.Error("Profile not found")
            }
        }
    }
}
