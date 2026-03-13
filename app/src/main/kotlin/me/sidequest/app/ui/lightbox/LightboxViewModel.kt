package me.sidequest.app.ui.lightbox

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import me.sidequest.app.data.model.Photo
import me.sidequest.app.data.repository.PhotoRepository
import javax.inject.Inject

// [SQ.M-A-2603-0028]

sealed interface LightboxState {
    data object Loading : LightboxState
    data class  Ready(val photos: List<Photo>) : LightboxState
    data class  Error(val message: String) : LightboxState
}

@HiltViewModel
class LightboxViewModel @Inject constructor(
    private val supabase   : SupabaseClient,
    private val repository : PhotoRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<LightboxState>(LightboxState.Loading)
    val state: StateFlow<LightboxState> = _state.asStateFlow()

    init {
        load()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = LightboxState.Loading
            val userId = supabase.auth.currentUserOrNull()?.id
            if (userId == null) {
                _state.value = LightboxState.Error("Not logged in")
                return@launch
            }
            // Load first page; user can scroll for more from within the grid
            val photos = repository.getPhotos(userId, page = 0, pageSize = PhotoRepository.PAGE_SIZE)
            _state.value = if (photos.isNotEmpty()) {
                LightboxState.Ready(photos)
            } else {
                LightboxState.Error("No photos found")
            }
        }
    }
}
