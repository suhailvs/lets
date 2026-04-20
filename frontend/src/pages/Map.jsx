import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useState, useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import "../App.css";
import L from "leaflet";
import API from "../utils/api";

export default function Map() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Memoized icon factory (performance-safe)
  const avatarIcon = useMemo(
    () => ({ imageUrl, label }) =>
      L.divIcon({
        className: "avatar-marker",
        html: imageUrl
          ? `<div class="avatar-wrapper"><img src="${imageUrl}" alt="${label || "User"}" /></div>`
          : `<div class="avatar-wrapper d-flex align-items-center justify-content-center bg-secondary text-white fw-bold">${(label || "?").slice(0, 2).toUpperCase()}</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      }),
    []
  );

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await API.get("/exchange-users-locations/");
        const data = Array.isArray(response.data) ? response.data : [];
        const nextMarkers = data
          .map((u) => ({
            id: u.id,
            name: u.first_name || u.username || "User",
            image: u.thumbnail || null,
            lat: Number.parseFloat(u.latitude),
            lng: Number.parseFloat(u.longitude),
          }))
          .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
        setMarkers(nextMarkers);
      } catch (err) {
        console.error("Error fetching user locations:", err);
        setError("Unable to load exchange user locations.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  function FitToMarkers({ markers }) {
    const map = useMap();
    useEffect(() => {
      if (!markers.length) return;
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }, [map, markers]);
    return null;
  }

  function MapMarkers() {
    return (
      <>
        {markers.map((m, i) => (
          <Marker
            key={`${m.lat}-${m.lng}-${i}`}
            position={[m.lat, m.lng]}
            icon={avatarIcon({ imageUrl: m.image, label: m.name })}
          >
            <Popup>{m.name}</Popup>
          </Marker>
        ))}
      </>
    );
  }

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <FitToMarkers markers={markers} />
      <MapMarkers />
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 1000,
            background: "rgba(255,255,255,0.95)",
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #e5e5e5",
          }}
        >
          Loading locations...
        </div>
      )}
      {!!error && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 1000,
            background: "rgba(255,255,255,0.95)",
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #e5e5e5",
            color: "#b42318",
          }}
        >
          {error}
        </div>
      )}
    </MapContainer>
  );
}
