import SwiftUI

@main
struct TripWeaveriOSApp: App {
    @StateObject private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(session)
                .tint(AppTheme.brand)
                .task {
                    await session.bootstrap()
                }
        }
    }
}

struct RootTabView: View {
    var body: some View {
        TabView {
            PlanView()
                .tabItem {
                    Label("路线", systemImage: "map.fill")
                }

            ExploreView()
                .tabItem {
                    Label("发现", systemImage: "sparkles")
                }

            SocialView()
                .tabItem {
                    Label("聊天", systemImage: "message.fill")
                }

            AuthView()
                .tabItem {
                    Label("账号", systemImage: "person.crop.circle")
                }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarBackground(.ultraThinMaterial, for: .tabBar)
    }
}
