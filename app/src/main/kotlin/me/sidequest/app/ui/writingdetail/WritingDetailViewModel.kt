package me.sidequest.app.ui.writingdetail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import me.sidequest.app.data.model.Writing
import me.sidequest.app.data.repository.WritingRepository
import javax.inject.Inject

// [SQ.M-A-2603-0030]

sealed interface WritingDetailState {
    data object Loading                    : WritingDetailState
    data class  Content(val writing: Writing) : WritingDetailState
    data class  Error(val message: String) : WritingDetailState
}

@HiltViewModel
class WritingDetailViewModel @Inject constructor(
    private val repository: WritingRepository,
    savedStateHandle      : SavedStateHandle,
) : ViewModel() {

    private val writingId: String = checkNotNull(savedStateHandle["id"])

    private val _state = MutableStateFlow<WritingDetailState>(WritingDetailState.Loading)
    val state: StateFlow<WritingDetailState> = _state.asStateFlow()

    init {
        load()
    }

    private fun load() {
        viewModelScope.launch {
            _state.value = WritingDetailState.Loading
            val writing = repository.getWritingById(writingId)
            _state.value = if (writing != null) {
                WritingDetailState.Content(writing)
            } else {
                WritingDetailState.Error("Writing not found")
            }
        }
    }
}
