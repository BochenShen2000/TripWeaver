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

struct PlanView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var intent = IntentPayload()
    @State private var loading = false
    @State private var plan: Plan?
    @State private var errorMessage = ""
    @State private var activityMessage = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    intentForm

                    Button {
                        Task { await generatePlan() }
                    } label: {
                        HStack {
                            if loading { ProgressView().controlSize(.small) }
                            Text(loading ? "生成中..." : "AI 生成路线")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(loading)

                    if !errorMessage.isEmpty {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if let plan {
                        planCard(plan)
                    }
                }
                .padding()
            }
            .navigationTitle("路线生成")
        }
    }

    private var intentForm: some View {
        VStack(spacing: 12) {
            Group {
                TextField("同伴（朋友/同学/情侣）", text: $intent.companion)
                TextField("人数", text: $intent.people)
                    .keyboardType(.numberPad)
                TextField("预算（低预算/中预算/高预算）", text: $intent.budget)
                TextField("时间段（今天晚上/周末半天/周末全天）", text: $intent.timeSlot)
                TextField("兴趣（美食/看展/city walk）", text: $intent.interest)
                TextField("区域（例如 Tokyo, Japan）", text: $intent.area)
                TextField("城市（可选）", text: $intent.city)
                TextField("国家（可选）", text: $intent.country)
                TextField("开始日期 YYYY-MM-DD（可选）", text: $intent.startDate)
                TextField("结束日期 YYYY-MM-DD（可选）", text: $intent.endDate)
            }
            .textFieldStyle(.roundedBorder)
        }
    }

    @ViewBuilder
    private func planCard(_ plan: Plan) -> some View {
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

            VStack(alignment: .leading, spacing: 8) {
                ForEach(Array(plan.route.enumerated()), id: \.element.id) { idx, stop in
                    VStack(alignment: .leading, spacing: 3) {
                        Text("\(idx + 1). \((stop.date ?? "")) \((stop.time ?? "")) \(stop.point)")
                            .font(.subheadline.weight(.semibold))
                        Text(stop.intro ?? "")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                        if let reason = stop.recommendReason, !reason.isEmpty {
                            Text(reason)
                                .font(.caption)
                                .foregroundStyle(.indigo)
                        }
                    }
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
            .buttonStyle(.bordered)

            if !activityMessage.isEmpty {
                Text(activityMessage)
                    .font(.footnote)
                    .foregroundStyle(.green)
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 18))
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
            activityMessage = "活动已发起：\(result.code ?? "-")"
        } catch {
            activityMessage = "发起失败：\(error.localizedDescription)"
        }
    }
}
