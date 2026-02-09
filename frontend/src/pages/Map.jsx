import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useState, useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import "../App.css";
import L from "leaflet";

export default function Map() {
  const [markers, setMarkers] = useState([]);

  const image =
    "https://suhailvs.pythonanywhere.com/media/cache/32/6e/326e706d79ccc456e08c9925f788ec92.jpg";

  const kkdeBounds = L.latLngBounds(
    [10.585570052121332, 76.43188476562501],
    [10.610584733242463, 76.48750305175783]
  );

  // ✅ Memoized icon factory (performance-safe)
  const avatarIcon = useMemo(
    () => (imageUrl) =>
      L.divIcon({
        className: "avatar-marker",
        html: `<div class="avatar-wrapper"><img src="${imageUrl}" /></div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      }),
    []
  );

  // ✅ Set markers ONCE (or replace with API call)
  useEffect(() => {
    setMarkers([
      {
        lat: 10.59985,
        lng: 76.45969,
        image,
      },
      {
        lat: 10.59995,
        lng: 76.45969,
        image,
      },
    ]);
  }, []);

  function MapMarkers() {
    return (
      <>
        {markers.map((m, i) => (
          <Marker
            key={`${m.lat}-${m.lng}-${i}`}
            position={[m.lat, m.lng]}
            icon={avatarIcon(m.image)}
          />
        ))}
      </>
    );
  }

  return (
    <MapContainer
      bounds={kkdeBounds}
      maxBounds={kkdeBounds}
      maxBoundsViscosity={1.0}
      minZoom={15}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <MapMarkers />
    </MapContainer>
  );
}
