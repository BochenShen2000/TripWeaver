import SwiftUI

@main
struct TripWeaveriOSApp: App {
    @StateObject private var session = SessionStore()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environmentObject(session)
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
                    Label("路线", systemImage: "map")
                }

            ExploreView()
                .tabItem {
                    Label("发现", systemImage: "sparkles")
                }

            AuthView()
                .tabItem {
                    Label("账号", systemImage: "person.crop.circle")
                }
        }
    }
}
