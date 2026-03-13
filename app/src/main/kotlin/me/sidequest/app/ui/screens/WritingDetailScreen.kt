package me.sidequest.app.ui.screens

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import me.sidequest.app.ui.writingdetail.WritingDetailState
import me.sidequest.app.ui.writingdetail.WritingDetailViewModel

// [SQ.M-A-2603-0030]

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WritingDetailScreen(
    onBack   : () -> Unit = {},
    viewModel: WritingDetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    if (state is WritingDetailState.Content) {
                        Text(
                            text     = (state as WritingDetailState.Content).writing.title,
                            maxLines = 1,
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { innerPadding ->
        when (val s = state) {
            is WritingDetailState.Loading -> {
                Box(
                    modifier         = Modifier.fillMaxSize().padding(innerPadding),
                    contentAlignment = Alignment.Center,
                ) { CircularProgressIndicator() }
            }

            is WritingDetailState.Error -> {
                Box(
                    modifier         = Modifier.fillMaxSize().padding(innerPadding),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        text     = s.message,
                        color    = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(horizontal = 24.dp),
                    )
                }
            }

            is WritingDetailState.Content -> {
                val writing = s.writing
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                ) {
                    // ── Meta header ───────────────────────────────────────
                    Column(
                        modifier            = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Text(
                            text  = writing.publishedAt.take(10),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )

                        if (!writing.tags.isNullOrEmpty()) {
                            Row(
                                modifier              = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                            ) {
                                writing.tags.forEach { tag ->
                                    AssistChip(
                                        onClick  = {},
                                        label    = {
                                            Text(tag, style = MaterialTheme.typography.labelSmall)
                                        },
                                        colors   = AssistChipDefaults.assistChipColors(
                                            containerColor = MaterialTheme.colorScheme.secondaryContainer,
                                            labelColor     = MaterialTheme.colorScheme.onSecondaryContainer,
                                        ),
                                        modifier = Modifier.height(24.dp),
                                    )
                                }
                            }
                        }
                    }

                    // ── HTML body via WebView ─────────────────────────────
                    HtmlBody(
                        html     = writing.body ?: "<p><em>No content available.</em></p>",
                        modifier = Modifier.fillMaxSize(),
                    )
                }
            }
        }
    }
}

/**
 * Renders an HTML string using a [WebView].
 * JavaScript is disabled — content is display-only.
 * The base URL is set to sidequest.me so relative assets resolve correctly.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun HtmlBody(
    html    : String,
    modifier: Modifier = Modifier,
) {
    val styledHtml = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    padding: 0 16px 32px 16px;
                    color: #1a1a1a;
                    background: #ffffff;
                    word-break: break-word;
                }
                img { max-width: 100%; height: auto; border-radius: 8px; }
                pre { overflow-x: auto; background: #f5f5f5; padding: 12px; border-radius: 6px; }
                code { font-family: monospace; font-size: 14px; }
                blockquote {
                    border-left: 4px solid #ccc;
                    margin: 0;
                    padding-left: 16px;
                    color: #555;
                }
                a { color: #7c3aed; }
            </style>
        </head>
        <body>$html</body>
        </html>
    """.trimIndent()

    AndroidView(
        modifier = modifier,
        factory  = { context ->
            WebView(context).apply {
                webViewClient         = WebViewClient()
                settings.javaScriptEnabled = false
                settings.domStorageEnabled = false
                settings.loadWithOverviewMode = true
                settings.useWideViewPort      = true
            }
        },
        update = { webView ->
            webView.loadDataWithBaseURL(
                "https://sidequest.me",
                styledHtml,
                "text/html",
                "UTF-8",
                null,
            )
        },
    )
}
