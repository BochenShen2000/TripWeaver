package com.tripweaver.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.lifecycleScope
import com.tripweaver.android.core.SessionStore
import com.tripweaver.android.ui.TripWeaverApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val session = SessionStore(applicationContext)
        session.bootstrap(lifecycleScope)

        setContent {
            TripWeaverApp(session = session)
        }
    }
}
