package me.sidequest.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import kotlin.math.roundToInt

// [SQ.M-A-2603-0025]

/**
 * Animated infinite-scroll ticker carousel.
 *
 * Displays [items] as a horizontally scrolling strip that repeats.
 * Items are separated by a bullet (•) divider.
 *
 * @param items     List of text strings to scroll.
 * @param speedDpPerSec  How many dp to move per second (lower = slower). Default 40.
 */
@Composable
fun TickerCarousel(
    items: List<String>,
    modifier: Modifier = Modifier,
    speedDpPerSec: Int = 40,
) {
    if (items.isEmpty()) return

    val density = LocalDensity.current
    var contentWidthPx by remember { mutableIntStateOf(0) }

    // Duration to cross the full content width once
    val durationMs = remember(contentWidthPx, speedDpPerSec) {
        if (contentWidthPx <= 0) 8_000
        else {
            val contentWidthDp = with(density) { contentWidthPx.toDp().value }
            ((contentWidthDp / speedDpPerSec) * 1_000).roundToInt().coerceAtLeast(1_000)
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "ticker")
    val offsetX by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue  = -contentWidthPx.toFloat(),
        animationSpec = infiniteRepeatable(
            animation    = tween(durationMillis = durationMs, easing = LinearEasing),
            repeatMode   = RepeatMode.Restart,
        ),
        label = "tickerOffset",
    )

    Row(
        modifier = modifier
            .fillMaxWidth()
            .clipToBounds()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // Render two copies side-by-side so the seam is invisible as it loops
        repeat(2) { copyIndex ->
            Row(
                modifier = Modifier
                    .offset { IntOffset(x = (offsetX + contentWidthPx * copyIndex).roundToInt(), y = 0) }
                    .onGloballyPositioned { coords ->
                        // Only measure the first copy
                        if (copyIndex == 0) contentWidthPx = coords.size.width
                    },
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                items.forEachIndexed { index, item ->
                    if (index > 0) {
                        Text(
                            text  = "•",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text(
                        text       = item,
                        style      = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Medium,
                        color      = MaterialTheme.colorScheme.onSurface,
                    )
                }
                // Trailing spacer between loop repetitions
                Text(
                    text  = "  •  ",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
