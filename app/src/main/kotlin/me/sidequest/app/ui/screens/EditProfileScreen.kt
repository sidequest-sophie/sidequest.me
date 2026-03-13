package me.sidequest.app.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import me.sidequest.app.ui.editprofile.EditProfileState
import me.sidequest.app.ui.editprofile.EditProfileViewModel

// [SQ.M-A-2603-0024]

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditProfileScreen(
    onSaved : () -> Unit = {},
    onBack  : () -> Unit = {},
    viewModel: EditProfileViewModel = hiltViewModel(),
) {
    val state   by viewModel.state.collectAsState()
    val snackbar = remember { SnackbarHostState() }

    // Navigate back once save completes
    LaunchedEffect(state) {
        if (state is EditProfileState.Saved) onSaved()
        if (state is EditProfileState.Error) {
            snackbar.showSnackbar((state as EditProfileState.Error).message)
        }
    }

    // Photo picker launcher (Android 13+ PickVisualMedia)
    val photoPicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
    ) { uri: Uri? ->
        if (uri != null) viewModel.onAvatarPicked(uri)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Edit profile") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
    ) { innerPadding ->
        when (val s = state) {
            is EditProfileState.Loading, EditProfileState.Saving -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator()
                }
            }

            is EditProfileState.Error -> {
                // Error is surfaced via snackbar; show nothing extra in body
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding),
                )
            }

            EditProfileState.Saved -> {
                // LaunchedEffect handles navigation; blank while popping
                Box(modifier = Modifier.fillMaxSize())
            }

            is EditProfileState.Ready -> {
                EditProfileForm(
                    state    = s,
                    isSaving = false,
                    onDisplayNameChange = viewModel::onDisplayNameChange,
                    onBioChange         = viewModel::onBioChange,
                    onPickAvatar = {
                        photoPicker.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                        )
                    },
                    onSave   = viewModel::save,
                    modifier = Modifier.padding(innerPadding),
                )
            }
        }
    }
}

@Composable
private fun EditProfileForm(
    state              : EditProfileState.Ready,
    isSaving           : Boolean,
    onDisplayNameChange: (String) -> Unit,
    onBioChange        : (String) -> Unit,
    onPickAvatar       : () -> Unit,
    onSave             : () -> Unit,
    modifier           : Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // ── Avatar picker ─────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .size(96.dp)
                .clip(CircleShape)
                .clickable(onClick = onPickAvatar),
            contentAlignment = Alignment.BottomEnd,
        ) {
            val displayUri = state.pendingAvatar?.toString() ?: state.avatarUrl
            if (!displayUri.isNullOrBlank()) {
                AsyncImage(
                    model = displayUri,
                    contentDescription = "Avatar",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape),
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        imageVector = Icons.Filled.Person,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(48.dp),
                    )
                }
            }

            // Camera overlay badge
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Filled.AddAPhoto,
                    contentDescription = "Change avatar",
                    tint = MaterialTheme.colorScheme.onPrimaryContainer,
                    modifier = Modifier.size(16.dp),
                )
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // ── Display name ──────────────────────────────────────────────────
        OutlinedTextField(
            value         = state.displayName,
            onValueChange = onDisplayNameChange,
            label         = { Text("Display name") },
            singleLine    = true,
            modifier      = Modifier.fillMaxWidth(),
        )

        // ── Bio ───────────────────────────────────────────────────────────
        OutlinedTextField(
            value         = state.bio,
            onValueChange = onBioChange,
            label         = { Text("Bio") },
            minLines      = 3,
            maxLines      = 6,
            modifier      = Modifier.fillMaxWidth(),
        )

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick  = onSave,
            enabled  = !isSaving,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Save")
        }
    }
}
