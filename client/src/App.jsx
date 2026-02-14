import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import { api } from "./api/api";

export default function App() {
  const [locations, setLocations] = useState([]);
  const [roads, setRoads] = useState([]);

  // Route Finder (Graph + ORS)
  const [routeForm, setRouteForm] = useState({ from: "", to: "" });

  // Graph route (Dijkstra)
  const [routePath, setRoutePath] = useState([]);
  const [routeDistance, setRouteDistance] = useState(null);

  // Real route (ORS)
  const [realRouteCoords, setRealRouteCoords] = useState([]); // [[lat,lng],...]
  const [realDistanceKm, setRealDistanceKm] = useState(null);
  const [useRealRoute, setUseRealRoute] = useState(true); // default ON

  const [loadingRoute, setLoadingRoute] = useState(false);

  // Location form
  const [locForm, setLocForm] = useState({
    name: "",
    type: "CUSTOMER",
    lat: "",
    lng: "",
  });

  // Road form
  const [roadForm, setRoadForm] = useState({
    from: "",
    to: "",
    distance: "",
    bidirectional: true,
  });

  // Orders + Dispatch
  const [orders, setOrders] = useState([]);
  const [queue, setQueue] = useState(null);

  const [orderForm, setOrderForm] = useState({
    customerLocation: "",
    itemName1: "",
    itemQty1: 1,
    itemName2: "",
    itemQty2: 1,
    priority: "MEDIUM",
  });

  const [loadingLoc, setLoadingLoc] = useState(false);
  const [loadingRoad, setLoadingRoad] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingEnqueueId, setLoadingEnqueueId] = useState(null);
  const [loadingDispatch, setLoadingDispatch] = useState(false);

  // Undo UI
  const [loadingUndo, setLoadingUndo] = useState(false);
  const [undoMsg, setUndoMsg] = useState("");

  // Step 15: Search + Sort
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSort, setOrderSort] = useState("NEWEST"); // NEWEST | PRIORITY

  const loadLocations = async () => {
    const res = await api.get("/api/locations");
    setLocations(res.data);

    // defaults for road form
    if (res.data.length >= 2 && !roadForm.from && !roadForm.to) {
      setRoadForm((prev) => ({
        ...prev,
        from: res.data[0]._id,
        to: res.data[1]._id,
      }));
    }

    // defaults for route form
    if (res.data.length >= 2 && (!routeForm.from || !routeForm.to)) {
      setRouteForm({ from: res.data[0]._id, to: res.data[1]._id });
    }

    // default for order form customer (first CUSTOMER if exists)
    if (!orderForm.customerLocation) {
      const firstCustomer =
        res.data.find((l) => l.type === "CUSTOMER") || res.data[0];
      if (firstCustomer) {
        setOrderForm((prev) => ({
          ...prev,
          customerLocation: firstCustomer._id,
        }));
      }
    }
  };

  const loadRoads = async () => {
    const res = await api.get("/api/roads");
    setRoads(res.data);
  };

  const loadOrders = async () => {
    const res = await api.get("/api/orders");
    setOrders(res.data);
  };

  const loadQueue = async () => {
    const res = await api.get("/api/dispatch");
    setQueue(res.data);
  };

  useEffect(() => {
    loadLocations();
    loadRoads();
    loadOrders();
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Step 15 algorithms (custom) ----
  const priorityRank = (p) => (p === "HIGH" ? 3 : p === "MEDIUM" ? 2 : 1);

  // Merge Sort (custom — no JS sort)
  const mergeSort = (arr, compare) => {
    if (arr.length <= 1) return arr;

    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid), compare);
    const right = mergeSort(arr.slice(mid), compare);

    let i = 0,
      j = 0;
    const result = [];

    while (i < left.length && j < right.length) {
      if (compare(left[i], right[j]) <= 0) result.push(left[i++]);
      else result.push(right[j++]);
    }

    while (i < left.length) result.push(left[i++]);
    while (j < right.length) result.push(right[j++]);

    return result;
  };

  // Linear search filter
  const filteredOrders = orders.filter((o) => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return true;

    const customer = (o.customerLocation?.name || "").toLowerCase();
    const items = (o.items || []).map((it) => it.name.toLowerCase()).join(" ");
    const status = (o.status || "").toLowerCase();
    const priority = (o.priority || "").toLowerCase();

    return (
      customer.includes(q) ||
      items.includes(q) ||
      status.includes(q) ||
      priority.includes(q)
    );
  });

  const displayedOrders = (() => {
    if (orderSort === "NEWEST") {
      return mergeSort(filteredOrders, (a, b) => {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return db - da; // descending
      });
    }

    if (orderSort === "PRIORITY") {
      return mergeSort(filteredOrders, (a, b) => {
        const pa = priorityRank(a.priority);
        const pb = priorityRank(b.priority);
        if (pb !== pa) return pb - pa;

        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return db - da;
      });
    }

    return filteredOrders;
  })();

  // ---- Actions ----
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

  // Graph route (Dijkstra)
  const calculateRoute = async (e) => {
    e.preventDefault();
    setLoadingRoute(true);

    // clear real route display
    setRealRouteCoords([]);
    setRealDistanceKm(null);

    try {
      const res = await api.get(
        `/api/routes/shortest?from=${routeForm.from}&to=${routeForm.to}`
      );
      setRouteDistance(res.data.distance);
      setRoutePath(res.data.path || []);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Real route (ORS)
  const calculateRealRoute = async (e) => {
    e.preventDefault();
    setLoadingRoute(true);

    // clear graph route display
    setRoutePath([]);
    setRouteDistance(null);

    try {
      const res = await api.get(
        `/api/routes/real?from=${routeForm.from}&to=${routeForm.to}`
      );

      const coords = res.data.geometry?.coordinates || []; // [lon,lat]
      const latLng = coords.map(([lon, lat]) => [lat, lon]);

      setRealRouteCoords(latLng);

      const km = res.data.distance_m != null ? res.data.distance_m / 1000 : null;
      setRealDistanceKm(km);
    } finally {
      setLoadingRoute(false);
    }
  };

  const createOrder = async (e) => {
    e.preventDefault();
    setLoadingOrder(true);
    try {
      const items = [];

      if (orderForm.itemName1.trim()) {
        items.push({
          name: orderForm.itemName1.trim(),
          qty: Number(orderForm.itemQty1),
        });
      }
      if (orderForm.itemName2.trim()) {
        items.push({
          name: orderForm.itemName2.trim(),
          qty: Number(orderForm.itemQty2),
        });
      }

      await api.post("/api/orders", {
        customerLocation: orderForm.customerLocation,
        items,
        priority: orderForm.priority,
      });

      setOrderForm((prev) => ({
        ...prev,
        itemName1: "",
        itemQty1: 1,
        itemName2: "",
        itemQty2: 1,
        priority: "MEDIUM",
      }));

      await loadOrders();
      await loadQueue();
    } finally {
      setLoadingOrder(false);
    }
  };

  const enqueueOrder = async (orderId) => {
    setLoadingEnqueueId(orderId);
    try {
      await api.post(`/api/dispatch/enqueue/${orderId}`);
      await loadOrders();
      await loadQueue();
    } finally {
      setLoadingEnqueueId(null);
    }
  };

  const dispatchNext = async () => {
    setLoadingDispatch(true);
    try {
      await api.post("/api/dispatch/next");
      await loadOrders();
      await loadQueue();
    } finally {
      setLoadingDispatch(false);
    }
  };

  const undoLast = async () => {
    setLoadingUndo(true);
    setUndoMsg("");
    try {
      const res = await api.post("/api/undo");
      setUndoMsg(res.data.message || "Undo done");
      await loadOrders();
      await loadQueue();
    } finally {
      setLoadingUndo(false);
    }
  };

  const queueSize = queue?.orderIds?.length ?? 0;

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
                Total roads:{" "}
                <span className="font-semibold">{roads.length}</span>
              </div>
            </div>

            {/* Route Finder */}
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-4">Route Finder</h2>

              <form
                onSubmit={useRealRoute ? calculateRealRoute : calculateRoute}
                className="space-y-3"
              >
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

                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={useRealRoute}
                    onChange={(e) => setUseRealRoute(e.target.checked)}
                  />
                  Use Real Road Route (ORS)
                </label>

                <button
                  disabled={loadingRoute}
                  className="w-full bg-black text-white rounded-lg py-2 disabled:opacity-60"
                >
                  {loadingRoute ? "Calculating..." : "Find Route"}
                </button>
              </form>

              <div className="mt-4 text-sm text-gray-700">
                Distance:{" "}
                <span className="font-semibold">
                  {useRealRoute
                    ? realDistanceKm == null
                      ? "-"
                      : `${realDistanceKm.toFixed(2)} km (real)`
                    : routeDistance == null
                    ? "-"
                    : `${routeDistance} km (graph)`}
                </span>
              </div>
            </div>

            {/* Create Order */}
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-4">Create Order</h2>

              <form onSubmit={createOrder} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600">Customer Location</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={orderForm.customerLocation}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        customerLocation: e.target.value,
                      })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select customer
                    </option>
                    {locations
                      .filter((l) => l.type === "CUSTOMER")
                      .map((l) => (
                        <option key={l._id} value={l._id}>
                          {l.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Item 1 name"
                    value={orderForm.itemName1}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        itemName1: e.target.value,
                      })
                    }
                  />
                  <input
                    type="number"
                    min={1}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Qty"
                    value={orderForm.itemQty1}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        itemQty1: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Item 2 name (optional)"
                    value={orderForm.itemName2}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        itemName2: e.target.value,
                      })
                    }
                  />
                  <input
                    type="number"
                    min={1}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Qty"
                    value={orderForm.itemQty2}
                    onChange={(e) =>
                      setOrderForm({
                        ...orderForm,
                        itemQty2: e.target.value,
                      })
                    }
                  />
                </div>

                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={orderForm.priority}
                  onChange={(e) =>
                    setOrderForm({ ...orderForm, priority: e.target.value })
                  }
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>

                <button
                  disabled={loadingOrder}
                  className="w-full bg-black text-white rounded-lg py-2 disabled:opacity-60"
                >
                  {loadingOrder ? "Creating..." : "Create Order"}
                </button>
              </form>
            </div>

            {/* Dispatch Queue */}
            <div className="bg-white border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Dispatch Queue (FIFO)</h2>
                <span className="text-sm text-gray-600">Size: {queueSize}</span>
              </div>

              <button
                onClick={dispatchNext}
                disabled={loadingDispatch}
                className="mt-3 w-full bg-black text-white rounded-lg py-2 disabled:opacity-60"
              >
                {loadingDispatch ? "Dispatching..." : "Dispatch Next"}
              </button>

              <button
                onClick={undoLast}
                disabled={loadingUndo}
                className="mt-3 w-full border border-black text-black rounded-lg py-2 disabled:opacity-60"
              >
                {loadingUndo ? "Undoing..." : "Undo Last Action"}
              </button>

              {undoMsg && (
                <div className="mt-2 text-xs text-gray-700">{undoMsg}</div>
              )}

              <div className="mt-4 space-y-2">
                {queueSize === 0 ? (
                  <div className="text-sm text-gray-600">Queue is empty.</div>
                ) : (
                  queue.orderIds.map((o) => (
                    <div key={o._id} className="border rounded-lg p-3 text-sm">
                      <div className="font-semibold">
                        {o.customerLocation?.name || "Customer"}
                      </div>
                      <div className="text-gray-600">
                        Priority: {o.priority} • Status: {o.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Map + Orders list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-4">
                Map View (Locations + Roads + Routes)
              </h2>

              <MapView
                locations={locations}
                roads={roads}
                routePath={routePath}
                realRouteCoords={realRouteCoords}
                useRealRoute={useRealRoute}
              />

              <p className="mt-3 text-xs text-gray-600">
                Roads are drawn as straight lines (graph edges). Route shows either
                real road path (ORS) or graph shortest path (Dijkstra).
              </p>
            </div>

            <div className="bg-white border rounded-xl p-5">
              <h2 className="font-semibold mb-4">Orders</h2>

              {/* Step 15: Search + Sort UI */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Search orders (customer, item, status, priority)..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />

                <select
                  className="w-full md:w-52 border rounded-lg px-3 py-2"
                  value={orderSort}
                  onChange={(e) => setOrderSort(e.target.value)}
                >
                  <option value="NEWEST">Sort: Newest</option>
                  <option value="PRIORITY">Sort: Priority</option>
                </select>
              </div>

              <div className="space-y-2">
                {displayedOrders.length === 0 ? (
                  <div className="text-sm text-gray-600">No matching orders.</div>
                ) : (
                  displayedOrders.map((o) => (
                    <div key={o._id} className="border rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">
                            {o.customerLocation?.name || "Customer"}
                          </div>
                          <div className="text-sm text-gray-600">
                            Priority: {o.priority} • Status: {o.status}
                          </div>
                        </div>

                        <button
                          onClick={() => enqueueOrder(o._id)}
                          disabled={
                            loadingEnqueueId === o._id || o.status !== "PENDING"
                          }
                          className="bg-black text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50"
                        >
                          {loadingEnqueueId === o._id ? "Enqueuing..." : "Enqueue"}
                        </button>
                      </div>

                      <div className="mt-3 text-sm text-gray-700">
                        Items:
                        <ul className="list-disc ml-5">
                          {o.items.map((it) => (
                            <li key={it._id}>
                              {it.name} × {it.qty}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
