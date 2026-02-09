import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import { api } from "./api/api";

export default function App() {
  const [locations, setLocations] = useState([]);
  const [roads, setRoads] = useState([]);

  // Route Finder states (MUST be inside App)
  const [routeForm, setRouteForm] = useState({ from: "", to: "" });
  const [routePath, setRoutePath] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const [locForm, setLocForm] = useState({
    name: "",
    type: "CUSTOMER",
    lat: "",
    lng: "",
  });

  const [roadForm, setRoadForm] = useState({
    from: "",
    to: "",
    distance: "",
    bidirectional: true,
  });

  const [loadingLoc, setLoadingLoc] = useState(false);
  const [loadingRoad, setLoadingRoad] = useState(false);

  const loadLocations = async () => {
    const res = await api.get("/api/locations");
    setLocations(res.data);

    // Set default road from/to if empty
    if (res.data.length >= 2 && !roadForm.from && !roadForm.to) {
      setRoadForm((prev) => ({
        ...prev,
        from: res.data[0]._id,
        to: res.data[1]._id,
      }));
    }

    // Set default route from/to if empty
    if (res.data.length >= 2 && (!routeForm.from || !routeForm.to)) {
      setRouteForm({ from: res.data[0]._id, to: res.data[1]._id });
    }
  };

  const loadRoads = async () => {
    const res = await api.get("/api/roads");
    setRoads(res.data);
  };

  useEffect(() => {
    loadLocations();
    loadRoads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addLocation = async (e) => {
    e.preventDefault();
    setLoadingLoc(true);
    try {
      await api.post("/api/locations", {
        name: locForm.name,
        type: locForm.type,
        lat: Number(locForm.lat),
        lng: Number(locForm.lng),
      });
      setLocForm({ name: "", type: "CUSTOMER", lat: "", lng: "" });
      await loadLocations();
    } finally {
      setLoadingLoc(false);
    }
  };

  const addRoad = async (e) => {
    e.preventDefault();
    setLoadingRoad(true);
    try {
      await api.post("/api/roads", {
        from: roadForm.from,
        to: roadForm.to,
        distance: Number(roadForm.distance),
        bidirectional: roadForm.bidirectional,
      });
      setRoadForm((prev) => ({ ...prev, distance: "" }));
      await loadRoads();
    } finally {
      setLoadingRoad(false);
    }
  };

  const calculateRoute = async (e) => {
    e.preventDefault();
    setLoadingRoute(true);
    try {
      const res = await api.get(
        `/api/routes/shortest?from=${routeForm.from}&to=${routeForm.to}`
      );

      // API returns { distance, path } or { distance:null, path:[], message }
      setRouteDistance(res.data.distance);
      setRoutePath(res.data.path || []);
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">RouteXpress</h1>
          <span className="text-sm text-gray-600">
            Delivery Route Planner + Order Manager
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Add Location */}
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-4">Add Location</h2>

              <form onSubmit={addLocation} className="space-y-3">
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Location name"
                  value={locForm.name}
                  onChange={(e) =>
                    setLocForm({ ...locForm, name: e.target.value })
                  }
                  required
                />

                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={locForm.type}
                  onChange={(e) =>
                    setLocForm({ ...locForm, type: e.target.value })
                  }
                >
                  <option value="SHOP">SHOP</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="WAREHOUSE">WAREHOUSE</option>
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Latitude"
                    value={locForm.lat}
                    onChange={(e) =>
                      setLocForm({ ...locForm, lat: e.target.value })
                    }
                    required
                  />
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Longitude"
                    value={locForm.lng}
                    onChange={(e) =>
                      setLocForm({ ...locForm, lng: e.target.value })
                    }
                    required
                  />
                </div>

                <button
                  disabled={loadingLoc}
                  className="w-full bg-black text-white rounded-lg py-2 disabled:opacity-60"
                >
                  {loadingLoc ? "Adding..." : "Add Location"}
                </button>
              </form>

              <div className="mt-4 text-sm text-gray-600">
                Total locations:{" "}
                <span className="font-semibold">{locations.length}</span>
              </div>
            </div>

            {/* Add Road */}
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-4">Add Road (Graph Edge)</h2>

              <form onSubmit={addRoad} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">From</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={roadForm.from}
                    onChange={(e) =>
                      setRoadForm({ ...roadForm, from: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select location
                    </option>
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name} ({l.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-600">To</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={roadForm.to}
                    onChange={(e) =>
                      setRoadForm({ ...roadForm, to: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select location
                    </option>
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name} ({l.type})
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Distance (km)"
                  value={roadForm.distance}
                  onChange={(e) =>
                    setRoadForm({ ...roadForm, distance: e.target.value })
                  }
                  required
                />

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={roadForm.bidirectional}
                    onChange={(e) =>
                      setRoadForm({
                        ...roadForm,
                        bidirectional: e.target.checked,
                      })
                    }
                  />
                  Bidirectional
                </label>

                <button
                  disabled={loadingRoad}
                  className="w-full bg-black text-white rounded-lg py-2 disabled:opacity-60"
                >
                  {loadingRoad ? "Adding..." : "Add Road"}
                </button>
              </form>

              <div className="mt-4 text-sm text-gray-600">
                Total roads: <span className="font-semibold">{roads.length}</span>
              </div>
            </div>

            {/* Route Finder */}
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-4">Route Finder (Shortest Path)</h2>

              <form onSubmit={calculateRoute} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">From</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={routeForm.from}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, from: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select location
                    </option>
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name} ({l.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-600">To</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={routeForm.to}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, to: e.target.value })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select location
                    </option>
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.name} ({l.type})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  disabled={loadingRoute}
                  className="w-full bg-black text-white rounded-lg py-2 disabled:opacity-60"
                >
                  {loadingRoute ? "Calculating..." : "Find Shortest Route"}
                </button>
              </form>

              <div className="mt-4 text-sm text-gray-700">
                Distance:{" "}
                <span className="font-semibold">
                  {routeDistance === null
                    ? "-"
                    : routeDistance === null
                    ? "-"
                    : `${routeDistance} km`}
                </span>
              </div>

              <div className="mt-2 text-xs text-gray-600">
                The shortest route will be drawn on the map.
              </div>
            </div>
          </div>

          {/* Right: Map */}
          <div className="lg:col-span-2 bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-4">
              Map View (Locations + Roads + Shortest Route)
            </h2>
            <MapView
              locations={locations}
              roads={roads}
              routePath={routePath}
            />
            <p className="mt-3 text-xs text-gray-600">
              Roads are drawn as lines between connected locations. The shortest
              path is drawn after you click “Find Shortest Route”.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
