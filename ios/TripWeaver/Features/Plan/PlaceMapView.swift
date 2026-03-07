import SwiftUI
import MapKit

struct PlaceMapView: View {
    let route: [RouteStop]

    @State private var position: MapCameraPosition = .automatic

    private var coordinates: [CLLocationCoordinate2D] {
        route.compactMap { $0.coordinate }
    }

    var body: some View {
        Map(position: $position) {
            ForEach(Array(route.enumerated()), id: \.element.id) { idx, stop in
                if let coordinate = stop.coordinate {
                    Marker("\(idx + 1). \(stop.point)", coordinate: coordinate)
                        .tint(stop.verified == true ? .blue : .orange)
                }
            }

            if coordinates.count >= 2 {
                MapPolyline(coordinates: coordinates)
                    .stroke(.indigo, lineWidth: 4)
            }
        }
        .frame(height: 260)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
        }
        .onAppear {
            fitToRoute()
        }
        .onChange(of: route.map(\ .id).joined(separator: "|")) { _, _ in
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

        let lats = coordinates.map(\ .latitude)
        let lngs = coordinates.map(\ .longitude)
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
