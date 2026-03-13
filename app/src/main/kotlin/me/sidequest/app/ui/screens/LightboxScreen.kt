package me.sidequest.app.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableOffsetOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import me.sidequest.app.data.model.Photo
import me.sidequest.app.ui.lightbox.LightboxState
import me.sidequest.app.ui.lightbox.LightboxViewModel
import kotlin.math.max

// [SQ.M-A-2603-0028]

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun LightboxScreen(
    startIndex : Int = 0,
    onBack     : () -> Unit = {},
    viewModel  : LightboxViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
    ) {
        when (val s = state) {
            is LightboxState.Loading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color    = Color.White,
                )
            }

            is LightboxState.Error -> {
                Text(
                    text     = s.message,
                    color    = Color.White,
                    modifier = Modifier.align(Alignment.Center),
                )
            }

            is LightboxState.Ready -> {
                val clampedStart = startIndex.coerceIn(0, (s.photos.size - 1).coerceAtLeast(0))
                val pagerState   = rememberPagerState(
                    initialPage = clampedStart,
                    pageCount   = { s.photos.size },
                )

                HorizontalPager(
                    state    = pagerState,
                    modifier = Modifier.fillMaxSize(),
                ) { page ->
                    ZoomablePhoto(photo = s.photos[page])
                }

                // Page counter
                Text(
                    text  = "${pagerState.currentPage + 1} / ${s.photos.size}",
                    color = Color.White,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .navigationBarsPadding()
                        .padding(bottom = 16.dp),
                )
            }
        }

        // Back button overlaid on top-left
        IconButton(
            onClick  = onBack,
            modifier = Modifier
                .align(Alignment.TopStart)
                .systemBarsPadding()
                .padding(8.dp),
        ) {
            Icon(
                imageVector        = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint               = Color.White,
                modifier           = Modifier.size(24.dp),
            )
        }
    }
}

@Composable
private fun ZoomablePhoto(
    photo    : Photo,
    modifier : Modifier = Modifier,
) {
    var scale  by remember { mutableFloatStateOf(1f) }
    var offset by remember { mutableOffsetOf(0f, 0f) }

    AsyncImage(
        model              = photo.imageUrl,
        contentDescription = photo.caption,
        contentScale       = ContentScale.Fit,
        modifier           = modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale  = max(1f, scale * zoom)
                    offset = if (scale == 1f) Offset.Zero else offset + pan
                }
            }
            .graphicsLayer(
                scaleX          = scale,
                scaleY          = scale,
                translationX    = offset.x,
                translationY    = offset.y,
            ),
    )
}
