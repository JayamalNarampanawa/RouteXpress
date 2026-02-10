import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

function FitBounds({ routePath }) {
  const map = useMap();

  useEffect(() => {
    if (!routePath || routePath.length < 2) return;

    const latLngs = routePath.map((p) => [p.lat, p.lng]);
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [routePath, map]);

  return null;
}

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

        {/* Auto-fit bounds when route changes */}
        <FitBounds routePath={routePath} />

        {/* Roads (normal) */}
        {roads.map((r) => (
          <Polyline
            key={r._id}
            positions={[
              [r.from.lat, r.from.lng],
              [r.to.lat, r.to.lng],
            ]}
            pathOptions={{ weight: 3, opacity: 0.6 }}
          />
        ))}

        {/* Shortest Route (highlight) */}
        {routeLine && (
          <Polyline
            positions={routeLine}
            pathOptions={{ weight: 6, opacity: 0.9 }}
          />
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
