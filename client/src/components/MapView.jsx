import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

function FitBounds({ boundsCoords }) {
  const map = useMap();

  useEffect(() => {
    if (!boundsCoords || boundsCoords.length < 2) return;

    const bounds = L.latLngBounds(boundsCoords);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [boundsCoords, map]);

  return null;
}

export default function MapView({
  locations,
  roads,
  routePath,
  realRouteCoords,
  useRealRoute,
}) {
  const center = [7.2936, 80.6413];

  const graphRouteLine =
    routePath && routePath.length >= 2
      ? routePath.map((p) => [p.lat, p.lng])
      : null;

  const realRouteLine =
    realRouteCoords && realRouteCoords.length >= 2 ? realRouteCoords : null;

  const boundsCoords = useRealRoute ? realRouteLine : graphRouteLine;

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden border">
      <MapContainer center={center} zoom={12} className="w-full h-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit bounds when the active route changes */}
        <FitBounds boundsCoords={boundsCoords} />

        {/* Roads (normal graph edges) */}
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

        {/* Active Route (highlight) */}
        {useRealRoute && realRouteLine ? (
          <Polyline
            positions={realRouteLine}
            pathOptions={{ weight: 7, opacity: 0.95 }}
          />
        ) : graphRouteLine ? (
          <Polyline
            positions={graphRouteLine}
            pathOptions={{ weight: 6, opacity: 0.9 }}
          />
        ) : null}

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
