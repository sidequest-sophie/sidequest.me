package me.sidequest.app.ui.writings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import me.sidequest.app.data.model.Writing
import me.sidequest.app.data.repository.WritingRepository
import javax.inject.Inject

// [SQ.M-A-2603-0029]

sealed interface WritingsState {
    data object Loading : WritingsState
    data class  Content(
        val writings     : List<Writing>,
        val allTags      : List<String>,
        val activeTag    : String?        = null,
        val isLoadingMore: Boolean        = false,
        val hasMore      : Boolean        = true,
    ) : WritingsState
    data class  Error(val message: String) : WritingsState
}

@HiltViewModel
class WritingsViewModel @Inject constructor(
    private val supabase   : SupabaseClient,
    private val repository : WritingRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<WritingsState>(WritingsState.Loading)
    val state: StateFlow<WritingsState> = _state.asStateFlow()

    private var currentPage = 0

    init {
        load(tag = null)
    }

    private fun load(tag: String?) {
        viewModelScope.launch {
            _state.value = WritingsState.Loading
            val userId = supabase.auth.currentUserOrNull()?.id
            if (userId == null) {
                _state.value = WritingsState.Error("Not logged in")
                return@launch
            }
            currentPage = 0
            val writings = repository.getWritings(userId, tag = tag, page = 0)
            val allTags  = writings.flatMap { it.tags ?: emptyList() }.distinct().sorted()
            _state.value = WritingsState.Content(
                writings  = writings,
                allTags   = allTags,
                activeTag = tag,
                hasMore   = writings.size == WritingRepository.PAGE_SIZE,
            )
        }
    }

    fun filterByTag(tag: String?) {
        val s = _state.value as? WritingsState.Content ?: return
        if (s.activeTag == tag) return
        load(tag)
    }

    fun loadMore() {
        val s = _state.value as? WritingsState.Content ?: return
        if (s.isLoadingMore || !s.hasMore) return
        viewModelScope.launch {
            _state.value = s.copy(isLoadingMore = true)
            val userId = supabase.auth.currentUserOrNull()?.id ?: run {
                _state.value = WritingsState.Error("Not logged in")
                return@launch
            }
            val nextPage = currentPage + 1
            val more     = repository.getWritings(userId, tag = s.activeTag, page = nextPage)
            currentPage  = nextPage
            val updatedTags = (s.allTags + more.flatMap { it.tags ?: emptyList() }).distinct().sorted()
            _state.value = s.copy(
                writings      = s.writings + more,
                allTags       = updatedTags,
                isLoadingMore = false,
                hasMore       = more.size == WritingRepository.PAGE_SIZE,
            )
        }
    }

    fun refresh() = load(tag = (_state.value as? WritingsState.Content)?.activeTag)
}
