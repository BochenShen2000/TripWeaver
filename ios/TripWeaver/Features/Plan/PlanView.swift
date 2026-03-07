import SwiftUI

private struct CreateActivityBody: Encodable {
    let id: String
    let title: String
    let budgetEstimate: String?
    let reason: String?
    let route: [RouteStop]
    let routePath: [RoutePathPoint]?
    let validationSummary: ValidationSummary?
    let routeSummary: RouteSummary?
    let bookingLinks: BookingLinks?
}

private struct PlanInputField: View {
    let title: String
    let placeholder: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.footnote)
                .foregroundStyle(.secondary)
            TextField(placeholder, text: $text)
                .keyboardType(keyboard)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .background(Color.white.opacity(0.9), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
        }
    }
}

struct PlanView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var intent = IntentPayload()
    @State private var loading = false
    @State private var plan: Plan?
    @State private var errorMessage = ""
    @State private var activityMessage = ""
    @State private var showAdvanced = false

    var body: some View {
        NavigationStack {
            ZStack {
                AppGradientBackground()

                AppPage {
                    quickEntryCard
                    inputCard
                    actionCard

                    if let plan {
                        planCard(plan)
                    }
                }
            }
            .navigationTitle("路线生成")
            .toolbarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    private var quickEntryCard: some View {
        TWCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("AI 活动发起器")
                    .font(.headline)
                Text("输入你的同伴和兴趣，自动生成可执行路线")
                    .font(.footnote)
                    .foregroundStyle(.secondary)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        quickTag("今晚 city walk") {
                            intent.timeSlot = "今天晚上"
                            intent.interest = "city walk"
                        }
                        quickTag("周末咖啡+展") {
                            intent.timeSlot = "周末半天"
                            intent.interest = "咖啡+看展"
                        }
                        quickTag("桌游局") {
                            intent.timeSlot = "今天晚上"
                            intent.interest = "桌游"
                        }
                        quickTag("公园野餐") {
                            intent.timeSlot = "周末半天"
                            intent.interest = "野餐"
                        }
                        quickTag("露营日") {
                            intent.timeSlot = "周末全天"
                            intent.interest = "露营"
                        }
                        quickTag("朋友聚餐") {
                            intent.timeSlot = "今天晚上"
                            intent.interest = "聚餐"
                        }
                        quickTag("情侣约会") {
                            intent.companion = "情侣"
                            intent.people = "2"
                            intent.interest = "夜景+餐厅"
                        }
                    }
                }
            }
        }
    }

    private var inputCard: some View {
        TWCard {
            VStack(spacing: 10) {
                PlanInputField(title: "同伴关系", placeholder: "朋友/同学/情侣", text: $intent.companion)
                PlanInputField(title: "人数", placeholder: "2", text: $intent.people, keyboard: .numberPad)
                PlanInputField(title: "预算", placeholder: "低预算/中预算/高预算", text: $intent.budget)
                PlanInputField(title: "时间段", placeholder: "今天晚上/周末半天", text: $intent.timeSlot)
                PlanInputField(title: "兴趣", placeholder: "美食/看展/city walk/桌游/露营/野餐/聚餐", text: $intent.interest)
                PlanInputField(title: "区域", placeholder: "Tokyo, Japan", text: $intent.area)

                DisclosureGroup(isExpanded: $showAdvanced) {
                    VStack(spacing: 10) {
                        PlanInputField(title: "城市", placeholder: "Tokyo", text: $intent.city)
                        PlanInputField(title: "国家", placeholder: "Japan", text: $intent.country)
                        PlanInputField(title: "开始日期", placeholder: "YYYY-MM-DD", text: $intent.startDate)
                        PlanInputField(title: "结束日期", placeholder: "YYYY-MM-DD", text: $intent.endDate)
                        PlanInputField(title: "出发国家", placeholder: "Singapore", text: $intent.fromCountry)
                    }
                    .padding(.top, 8)
                } label: {
                    Text("高级参数")
                        .font(.subheadline.weight(.medium))
                }
            }
        }
    }

    private var actionCard: some View {
        TWCard {
            VStack(spacing: 8) {
                Button {
                    Task { await generatePlan() }
                } label: {
                    HStack {
                        if loading { ProgressView().tint(.white).controlSize(.small) }
                        Text(loading ? "生成中..." : "AI 生成路线")
                    }
                }
                .buttonStyle(TWPrimaryButtonStyle())
                .disabled(loading)

                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                if !activityMessage.isEmpty {
                    Text(activityMessage)
                        .font(.footnote)
                        .foregroundStyle(.green)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
    }

    private func quickTag(_ label: String, apply: @escaping () -> Void) -> some View {
        Button(label) {
            apply()
        }
        .font(.caption.weight(.semibold))
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.white.opacity(0.85), in: Capsule())
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func planCard(_ plan: Plan) -> some View {
        TWCard {
            VStack(alignment: .leading, spacing: 12) {
                Text(plan.title)
                    .font(.title3.bold())

                if let budget = plan.budgetEstimate {
                    Text("预算：\(budget)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                if let summary = plan.routeSummary {
                    Text("总路径：约 \(summary.distanceKm ?? 0, specifier: "%.1f") km / \(summary.durationMin ?? 0) 分钟")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                PlaceMapView(route: plan.route)

                VStack(spacing: 8) {
                    ForEach(Array(plan.route.enumerated()), id: \.element.id) { idx, stop in
                        VStack(alignment: .leading, spacing: 4) {
                            Text("\(idx + 1). \((stop.date ?? "")) \((stop.time ?? "")) \(stop.point)")
                                .font(.subheadline.weight(.semibold))
                            if let intro = stop.intro {
                                Text(intro)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(3)
                            }
                            if let reason = stop.recommendReason, !reason.isEmpty {
                                Text(reason)
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.brandDeep)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 9)
                        .background(Color.white.opacity(0.78), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                    }
                }

                if let reason = plan.reason, !reason.isEmpty {
                    Text(reason)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Button("一键发起活动") {
                    Task { await createActivity(from: plan) }
                }
                .buttonStyle(TWSecondaryButtonStyle())
            }
        }
    }

    private func generatePlan() async {
        loading = true
        errorMessage = ""
        activityMessage = ""
        defer { loading = false }

        do {
            let result: Plan = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/generate-plan",
                method: .post,
                token: session.token,
                body: intent
            )
            plan = result
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func createActivity(from plan: Plan) async {
        do {
            let body = CreateActivityBody(
                id: plan.id,
                title: plan.title,
                budgetEstimate: plan.budgetEstimate,
                reason: plan.reason,
                route: plan.route,
                routePath: plan.routePath,
                validationSummary: plan.validationSummary,
                routeSummary: plan.routeSummary,
                bookingLinks: plan.bookingLinks
            )
            let result: GenerateActivityResponse = try await APIClient.request(
                baseURL: session.apiBaseURL,
                path: "/api/create-activity",
                method: .post,
                token: session.token,
                body: body
            )
            let when = formatShortTime(result.startAt)
            let whereText = result.venueName ?? "待定地点"
            activityMessage = "活动已发起：\(result.code ?? "-") · \(when) @ \(whereText)"
        } catch {
            activityMessage = "发起失败：\(error.localizedDescription)"
        }
    }

    private func formatShortTime(_ iso: String?) -> String {
        guard let iso, !iso.isEmpty else { return "时间待定" }
        let inFmt = ISO8601DateFormatter()
        guard let date = inFmt.date(from: iso) else { return iso }
        let outFmt = DateFormatter()
        outFmt.dateFormat = "MM-dd HH:mm"
        return outFmt.string(from: date)
    }
}
