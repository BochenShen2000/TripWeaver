# TripWeaver Android

Jetpack Compose Android client aligned with current iOS product flow.

## Included modules
- `plan`: AI route generation + route map + launch activity
- `explore`: discovery feed + real places + groups + map
- `social`: friends/chats/groups + thread + interest activity publish
- `account`: login/register/email code/OAuth mock/campus verify

## Setup
1. Open `android/` with Android Studio.
2. Create `android/local.properties` and add:
   ```
   MAPS_API_KEY=YOUR_ANDROID_MAPS_KEY
   ```
3. Sync Gradle and run on device/emulator.

## Backend
Default API base URL is `http://127.0.0.1:3000` and can be changed in Account tab.
