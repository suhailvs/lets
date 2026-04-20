import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { WebView } from "react-native-webview";
import api from "@/constants/api";
import { Palette } from "@/constants/Colors";

function buildLeafletHtml(markers) {
  const safeMarkersJson = JSON.stringify(markers ?? []);
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html, body { height: 100%; margin: 0; }
      #map { height: 100%; width: 100%; }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        overflow: hidden;
        border: 2px solid white;
        box-shadow: 0 4px 16px rgba(0,0,0,0.20);
        background: #9aa0a6;
        display: flex;
        align-items: center;
        justify-content: center;
        font: 700 12px/1 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        color: #fff;
      }
      .avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const markers = ${safeMarkersJson};

      const map = L.map('map', { zoomControl: true, attributionControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const bounds = [];
      markers.forEach((m) => {
        const initials = (m.name || '?').slice(0, 2).toUpperCase();
        const html = m.imageUrl
          ? '<div class="avatar"><img src="' + m.imageUrl + '" alt="' + (m.name || 'User') + '" /></div>'
          : '<div class="avatar">' + initials + '</div>';

        const icon = L.divIcon({
          className: '',
          html,
          iconSize: [44, 44],
          iconAnchor: [22, 44],
        });

        const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
        if (m.name) marker.bindPopup(m.name);
        bounds.push([m.lat, m.lng]);
      });

      if (bounds.length) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      } else {
        map.setView([20, 0], 2);
      }
    </script>
  </body>
</html>`;
}

export default function MapTab() {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/exchange-users-locations/");
        const data = Array.isArray(response.data) ? response.data : [];
        const nextMarkers = data
          .map((u) => ({
            id: u.id,
            name: u.first_name || u.username || "User",
            imageUrl: u.thumbnail || null,
            lat: Number.parseFloat(u.latitude),
            lng: Number.parseFloat(u.longitude),
          }))
          .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
        setMarkers(nextMarkers);
      } catch (err) {
        console.error("Error fetching exchange user locations:", err);
        setError("Unable to load exchange user locations.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const html = useMemo(() => buildLeafletHtml(markers), [markers]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Map</Text>
        <Text style={styles.subtle}>
          {loading ? "Loading members…" : `${markers.length} member${markers.length === 1 ? "" : "s"}`}
        </Text>
      </View>

      <View style={styles.mapWrap}>
        <WebView
          source={{ html }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: Palette.bg,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: Palette.textDark,
  },
  subtle: {
    marginTop: 2,
    fontSize: 12,
    color: Palette.textMid,
    fontWeight: "600",
  },
  mapWrap: {
    flex: 1,
    borderTopWidth: 0,
  },
  error: {
    position: "absolute",
    left: 16,
    top: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: Palette.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    color: Palette.danger,
    fontWeight: "700",
  },
});

