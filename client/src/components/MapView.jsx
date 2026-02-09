import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";

export default function MapView({ locations, roads, routePath }) {
  const center = [7.2936, 80.6413];

  const routeLine =
    routePath && routePath.length >= 2
      ? routePath.map((p) => [p.lat, p.lng])
      : null;

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={12} className="w-full h-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Roads (graph edges) */}
        {roads.map((r) => (
          <Polyline
            key={r._id}
            positions={[
              [r.from.lat, r.from.lng],
              [r.to.lat, r.to.lng],
            ]}
          />
        ))}

        {/* Shortest Route (highlight) */}
        {routeLine && (
          <Polyline positions={routeLine} />
        )}

        {/* Locations */}
        {locations.map((loc) => (
          <Marker key={loc._id} position={[loc.lat, loc.lng]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{loc.name}</div>
                <div className="opacity-70">{loc.type}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
