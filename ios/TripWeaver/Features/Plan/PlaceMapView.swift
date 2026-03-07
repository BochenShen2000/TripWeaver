import SwiftUI
import MapKit

struct PlaceMapView: View {
    let route: [RouteStop]

    @State private var position: MapCameraPosition = .automatic

    private var coordinates: [CLLocationCoordinate2D] {
        route.compactMap { $0.coordinate }
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            Map(position: $position) {
                ForEach(Array(route.enumerated()), id: \.element.id) { idx, stop in
                    if let coordinate = stop.coordinate {
                        Marker("\(idx + 1). \(stop.point)", coordinate: coordinate)
                            .tint(stop.verified == true ? AppTheme.brand : .orange)
                    }
                }

                if coordinates.count >= 2 {
                    MapPolyline(coordinates: coordinates)
                        .stroke(AppTheme.brandDeep, lineWidth: 4)
                }
            }
            .mapStyle(.standard(elevation: .realistic))

            Text("Google 路线点位已映射")
                .font(.caption2.weight(.semibold))
                .padding(.horizontal, 8)
                .padding(.vertical, 5)
                .background(Color.white.opacity(0.88), in: Capsule())
                .padding(10)
        }
        .frame(height: 260)
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color.white.opacity(0.75), lineWidth: 1)
        }
        .onAppear {
            fitToRoute()
        }
        .onChange(of: route.map(\.id).joined(separator: "|")) { _, _ in
            fitToRoute()
        }
    }

    private func fitToRoute() {
        guard !coordinates.isEmpty else { return }
        if coordinates.count == 1 {
            let c = coordinates[0]
            position = .region(
                MKCoordinateRegion(
                    center: c,
                    span: MKCoordinateSpan(latitudeDelta: 0.03, longitudeDelta: 0.03)
                )
            )
            return
        }

        let lats = coordinates.map(\.latitude)
        let lngs = coordinates.map(\.longitude)
        guard
            let minLat = lats.min(),
            let maxLat = lats.max(),
            let minLng = lngs.min(),
            let maxLng = lngs.max()
        else {
            return
        }

        let center = CLLocationCoordinate2D(
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2
        )
        let span = MKCoordinateSpan(
            latitudeDelta: max(0.03, (maxLat - minLat) * 1.6),
            longitudeDelta: max(0.03, (maxLng - minLng) * 1.6)
        )
        position = .region(MKCoordinateRegion(center: center, span: span))
    }
}
