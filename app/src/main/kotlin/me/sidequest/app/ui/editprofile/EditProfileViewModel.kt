package me.sidequest.app.ui.editprofile

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import me.sidequest.app.data.model.Profile
import me.sidequest.app.data.repository.ProfileRepository
import javax.inject.Inject

// [SQ.M-A-2603-0024]

sealed interface EditProfileState {
    data object Loading   : EditProfileState
    data object Saving    : EditProfileState
    data object Saved     : EditProfileState
    data class  Ready(
        val displayName : String,
        val bio         : String,
        val avatarUrl   : String,
        /** Local URI selected from the photo picker — not yet uploaded. */
        val pendingAvatar: Uri? = null,
    ) : EditProfileState
    data class Error(val message: String) : EditProfileState
}

@Serializable
private data class ProfileUpdate(
    @SerialName("display_name") val displayName: String?,
    val bio: String?,
    @SerialName("avatar_url")   val avatarUrl: String?,
)

@HiltViewModel
class EditProfileViewModel @Inject constructor(
    private val supabase   : SupabaseClient,
    private val repository : ProfileRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<EditProfileState>(EditProfileState.Loading)
    val state: StateFlow<EditProfileState> = _state.asStateFlow()

    init {
        loadProfile()
    }

    private fun loadProfile() {
        viewModelScope.launch {
            _state.value = EditProfileState.Loading
            val userId = supabase.auth.currentUserOrNull()?.id
            if (userId == null) {
                _state.value = EditProfileState.Error("Not logged in")
                return@launch
            }
            val profile = repository.getProfileById(userId)
            _state.value = if (profile != null) {
                EditProfileState.Ready(
                    displayName  = profile.displayName ?: "",
                    bio          = profile.bio         ?: "",
                    avatarUrl    = profile.avatarUrl   ?: "",
                )
            } else {
                EditProfileState.Error("Profile not found")
            }
        }
    }

    fun onDisplayNameChange(value: String) {
        val s = _state.value
        if (s is EditProfileState.Ready) _state.value = s.copy(displayName = value)
    }

    fun onBioChange(value: String) {
        val s = _state.value
        if (s is EditProfileState.Ready) _state.value = s.copy(bio = value)
    }

    /** Called when the user picks an image from the system photo picker. */
    fun onAvatarPicked(uri: Uri) {
        val s = _state.value
        if (s is EditProfileState.Ready) _state.value = s.copy(pendingAvatar = uri)
    }

    /**
     * Saves text fields immediately. Avatar upload to Supabase Storage is a
     * TODO — requires a signed upload URL (via Edge Function per architecture decision).
     */
    fun save() {
        val s = _state.value as? EditProfileState.Ready ?: return
        viewModelScope.launch {
            _state.value = EditProfileState.Saving
            val userId = supabase.auth.currentUserOrNull()?.id
            if (userId == null) {
                _state.value = EditProfileState.Error("Not logged in")
                return@launch
            }

            // TODO [SQ.M-A-2603-0024]: upload s.pendingAvatar via Edge Function, get back URL
            val avatarUrl = if (s.pendingAvatar != null) {
                // placeholder: keep existing URL until upload is implemented
                s.avatarUrl
            } else {
                s.avatarUrl
            }

            runCatching {
                supabase.postgrest["profiles"].update(
                    ProfileUpdate(
                        displayName = s.displayName.trim().ifBlank { null },
                        bio         = s.bio.trim().ifBlank { null },
                        avatarUrl   = avatarUrl.ifBlank { null },
                    )
                ) {
                    filter { eq("id", userId) }
                }
            }.onSuccess {
                _state.value = EditProfileState.Saved
            }.onFailure { e ->
                _state.value = EditProfileState.Error(e.message ?: "Save failed")
            }
        }
    }
}
