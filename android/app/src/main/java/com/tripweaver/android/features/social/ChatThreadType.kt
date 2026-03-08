package com.tripweaver.android.features.social

enum class ChatThreadType(val route: String) {
    GLOBAL("global"),
    DIRECT("direct"),
    CAMPUS("campus"),
    INTEREST("interest"),
    EVENT("event");

    companion object {
        fun fromRoute(raw: String): ChatThreadType {
            return entries.firstOrNull { it.route == raw } ?: GLOBAL
        }
    }
}
