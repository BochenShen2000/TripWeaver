import SwiftUI

enum AppTheme {
    static let brand = Color(red: 0.05, green: 0.42, blue: 0.87)
    static let brandDeep = Color(red: 0.04, green: 0.31, blue: 0.69)
    static let mint = Color(red: 0.13, green: 0.70, blue: 0.56)
    static let bgTop = Color(red: 0.93, green: 0.96, blue: 1.0)
    static let bgBottom = Color(red: 0.94, green: 0.99, blue: 0.97)
}

enum AppLayout {
    static let horizontalPadding: CGFloat = 14
    static let maxContentWidth: CGFloat = 620
}

struct AppGradientBackground: View {
    var body: some View {
        LinearGradient(
            colors: [AppTheme.bgTop, AppTheme.bgBottom],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .overlay(alignment: .topTrailing) {
            Circle()
                .fill(AppTheme.brand.opacity(0.12))
                .frame(width: 220, height: 220)
                .blur(radius: 6)
                .offset(x: 80, y: -70)
        }
        .overlay(alignment: .bottomLeading) {
            Circle()
                .fill(AppTheme.mint.opacity(0.10))
                .frame(width: 200, height: 200)
                .blur(radius: 8)
                .offset(x: -90, y: 70)
        }
        .ignoresSafeArea()
    }
}

struct AppPage<Content: View>: View {
    private let alignment: HorizontalAlignment
    private let spacing: CGFloat
    private let content: Content

    init(
        alignment: HorizontalAlignment = .center,
        spacing: CGFloat = 12,
        @ViewBuilder content: () -> Content
    ) {
        self.alignment = alignment
        self.spacing = spacing
        self.content = content()
    }

    var body: some View {
        ScrollView {
            VStack(alignment: alignment, spacing: spacing) {
                content
            }
            .padding(.horizontal, AppLayout.horizontalPadding)
            .padding(.vertical, 12)
            .frame(maxWidth: AppLayout.maxContentWidth)
            .frame(maxWidth: .infinity)
        }
        .scrollDismissesKeyboard(.interactively)
        .contentMargins(.bottom, 8, for: .scrollContent)
        .safeAreaPadding(.bottom, 4)
    }
}

struct TWCard<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(14)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(Color.white.opacity(0.7), lineWidth: 1)
            )
    }
}

struct TWPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(
                LinearGradient(
                    colors: [AppTheme.brand, AppTheme.brandDeep],
                    startPoint: .leading,
                    endPoint: .trailing
                ),
                in: RoundedRectangle(cornerRadius: 13, style: .continuous)
            )
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .opacity(configuration.isPressed ? 0.92 : 1)
            .animation(.easeOut(duration: 0.14), value: configuration.isPressed)
    }
}

struct TWSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(AppTheme.brandDeep)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 11)
            .background(Color.white.opacity(configuration.isPressed ? 0.85 : 0.95), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(AppTheme.brand.opacity(0.24), lineWidth: 1)
            )
    }
}
