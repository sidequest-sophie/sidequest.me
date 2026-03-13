package me.sidequest.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import me.sidequest.app.data.model.Writing
import me.sidequest.app.ui.writings.WritingsState
import me.sidequest.app.ui.writings.WritingsViewModel

// [SQ.M-A-2603-0029]

private const val WRITINGS_LOAD_MORE_THRESHOLD = 5

@Composable
fun WritingsScreen(
    onWritingClick: (writingId: String) -> Unit = {},
    viewModel     : WritingsViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    when (val s = state) {
        is WritingsState.Loading -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }

        is WritingsState.Error -> {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text     = s.message,
                    color    = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(horizontal = 24.dp),
                )
            }
        }

        is WritingsState.Content -> {
            WritingsList(
                state          = s,
                onWritingClick = onWritingClick,
                onTagClick     = viewModel::filterByTag,
                onLoadMore     = viewModel::loadMore,
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WritingsList(
    state         : WritingsState.Content,
    onWritingClick: (writingId: String) -> Unit,
    onTagClick    : (String?) -> Unit,
    onLoadMore    : () -> Unit,
) {
    val listState = rememberLazyListState()

    val shouldLoadMore by remember {
        derivedStateOf {
            val layoutInfo  = listState.layoutInfo
            val totalItems  = layoutInfo.totalItemsCount
            val lastVisible = layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            totalItems > 0 && lastVisible >= totalItems - WRITINGS_LOAD_MORE_THRESHOLD
        }
    }
    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) onLoadMore()
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // ── Tag filter strip ──────────────────────────────────────────────
        if (state.allTags.isNotEmpty()) {
            LazyRow(
                contentPadding        = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                item {
                    FilterChip(
                        selected = state.activeTag == null,
                        onClick  = { onTagClick(null) },
                        label    = { Text("All") },
                    )
                }
                items(state.allTags, key = { it }) { tag ->
                    FilterChip(
                        selected = state.activeTag == tag,
                        onClick  = { onTagClick(tag) },
                        label    = { Text(tag) },
                    )
                }
            }
            HorizontalDivider()
        }

        // ── List ──────────────────────────────────────────────────────────
        LazyColumn(
            state          = listState,
            contentPadding = PaddingValues(vertical = 8.dp),
            modifier       = Modifier.fillMaxSize(),
        ) {
            itemsIndexed(state.writings, key = { _, w -> w.id }) { _, writing ->
                WritingCard(
                    writing = writing,
                    onClick = { onWritingClick(writing.id) },
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
            }

            // Loading more indicator
            if (state.isLoadingMore) {
                item {
                    Box(
                        modifier         = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center,
                    ) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WritingCard(
    writing : Writing,
    onClick : () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        onClick  = onClick,
        modifier = modifier.fillMaxWidth(),
    ) {
        Column(
            modifier            = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(
                text  = writing.title,
                style = MaterialTheme.typography.titleMedium,
            )

            if (!writing.excerpt.isNullOrBlank()) {
                Text(
                    text     = writing.excerpt,
                    style    = MaterialTheme.typography.bodyMedium,
                    color    = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            Text(
                text  = writing.publishedAt.take(10),   // YYYY-MM-DD
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            if (!writing.tags.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(2.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    writing.tags.forEach { tag ->
                        AssistChip(
                            onClick = {},
                            label   = {
                                Text(tag, style = MaterialTheme.typography.labelSmall)
                            },
                            colors  = AssistChipDefaults.assistChipColors(
                                containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                labelColor     = MaterialTheme.colorScheme.onSecondaryContainer,
                            ),
                            modifier = Modifier.height(24.dp),
                        )
                    }
                }
            }
        }
    }
}
