"""Build compact local meshes from openly licensed USGS elevation/slab data.

Inputs:
  - USGS DS904 10m_DEM.zip (download URL documented in README)
  - public/models/tectonics/cam-slab2-depth.grd (USGS Slab2)

The output is deliberately a small JSON mesh for the browser, not a fabricated
geologic surface. Coordinates and heights are reduced for interactive display.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import h5py
import numpy as np
import rasterio


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "models"


def compact_volcano_dem(source_zip: Path) -> None:
    uri = f"/vsizip/{source_zip.as_posix()}/10m_DEM/msh2009dem10/w001001.adf"
    with rasterio.open(uri) as raster:
        # A 20 km square around the summit preserves the volcanic edifice,
        # crater rim, adjacent ridges and the upper Toutle drainage.
        center_x, center_y = 562047.3, 5115635.6
        radius_m = 10_000
        col0 = int((center_x - radius_m - raster.bounds.left) / raster.res[0])
        col1 = int((center_x + radius_m - raster.bounds.left) / raster.res[0])
        row0 = int((raster.bounds.top - (center_y + radius_m)) / raster.res[1])
        row1 = int((raster.bounds.top - (center_y - radius_m)) / raster.res[1])
        window = rasterio.windows.Window(col0, row0, col1 - col0, row1 - row0)
        source = raster.read(1, window=window, masked=True).filled(np.nan).astype(np.float32)

    rows, cols = 161, 161
    row_idx = np.linspace(0, source.shape[0] - 1, rows).round().astype(int)
    col_idx = np.linspace(0, source.shape[1] - 1, cols).round().astype(int)
    sampled = source[np.ix_(row_idx, col_idx)]
    sampled[sampled < -10_000] = np.nan
    # No-data areas at the raster perimeter are filled from nearest measured
    # elevations so the mesh remains closed and mobile-friendly.
    valid = np.isfinite(sampled)
    if not valid.all():
        for _ in range(max(rows, cols)):
            valid = np.isfinite(sampled)
            total = np.zeros_like(sampled)
            count = np.zeros_like(sampled, dtype=np.int8)
            for shifted in (np.roll(sampled, 1, 0), np.roll(sampled, -1, 0), np.roll(sampled, 1, 1), np.roll(sampled, -1, 1)):
                available = np.isfinite(shifted)
                total[~valid & available] += shifted[~valid & available]
                count[~valid & available] += 1
            fill = ~valid & (count > 0)
            sampled[fill] = total[fill] / count[fill]
            if np.isfinite(sampled).all():
                break
        sampled[~np.isfinite(sampled)] = float(np.nanmin(sampled))
    minimum = float(np.percentile(sampled, 1))
    maximum = float(np.percentile(sampled, 99.8))
    sampled = np.clip(sampled, minimum, maximum)
    heights = (sampled - minimum) / (maximum - minimum)
    vertices = []
    for j in range(rows):
        for i in range(cols):
            x = -7.0 + 14.0 * i / (cols - 1)
            z = -7.0 + 14.0 * j / (rows - 1)
            y = -2.65 + float(heights[j, i]) * 3.65
            vertices.extend((round(x, 4), round(y, 4), round(z, 4)))
    indices = []
    for j in range(rows - 1):
        for i in range(cols - 1):
            a = j * cols + i
            b = a + cols
            indices.extend((a, b, a + 1, a + 1, b, b + 1))
    output = {
        "source": "USGS Mount St. Helens 10 m bare-earth DEM, survey 2009",
        "dimensions": [cols, rows],
        "elevationMeters": [round(minimum, 1), round(maximum, 1)],
        "verticalExaggeration": "relief normalized for readable scene scale",
        "positions": vertices,
        "indices": indices,
    }
    destination = PUBLIC / "volcano" / "mount-st-helens-dem.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(output, separators=(",", ":")), encoding="utf-8")
    print(f"volcano DEM: {destination.stat().st_size:,} bytes; {rows * cols:,} vertices")


def compact_cocos_slab(source: Path) -> None:
    with h5py.File(source, "r") as dataset:
        longitude = np.asarray(dataset["x"], dtype=np.float64)
        latitude = np.asarray(dataset["y"], dtype=np.float64)
        depth = np.asarray(dataset["z"], dtype=np.float32)

    lon_mask = (longitude >= 260.0) & (longitude <= 269.0)
    lat_mask = (latitude >= 9.0) & (latitude <= 17.0)
    x_index = np.flatnonzero(lon_mask)
    y_index = np.flatnonzero(lat_mask)
    # Decimate a little while retaining the measured slab curvature.
    x_index = x_index[::2]
    y_index = y_index[::2]
    lon = longitude[x_index]
    lat = latitude[y_index]
    values = depth[np.ix_(y_index, x_index)]
    rows, cols = values.shape
    vertices = []
    valid = np.isfinite(values) & (values < 0)
    for j, lat_value in enumerate(lat):
        for i, lon_value in enumerate(lon):
            # Convert USGS 0..360 longitudes to an approximately metric local
            # patch. Depth remains the modeled slab depth (km), visually scaled.
            x = (lon_value - 264.5) * 107.0 * np.cos(np.deg2rad(13.0)) / 145.0
            z = (lat_value - 13.0) * 111.0 / 145.0
            d = float(values[j, i]) if valid[j, i] else 0.0
            y = max(-3.6, d * 0.009)
            vertices.extend((round(float(x), 4), round(y, 4), round(float(z), 4)))

    indices = []
    for j in range(rows - 1):
        for i in range(cols - 1):
            a = j * cols + i
            corners = (valid[j, i], valid[j, i + 1], valid[j + 1, i], valid[j + 1, i + 1])
            if all(corners):
                b = a + cols
                indices.extend((a, b, a + 1, a + 1, b, b + 1))
    output = {
        "source": "USGS Slab2 Central America (Cocos slab), 02.24.18 depth grid",
        "dimensions": [cols, rows],
        "depthRangeKm": [round(float(np.nanmin(values)), 1), round(float(np.nanmax(values)), 1)],
        "positions": vertices,
        "validVertices": int(valid.sum()),
        "indices": indices,
    }
    destination = PUBLIC / "tectonics" / "cocos-slab2-mesh.json"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(output, separators=(",", ":")), encoding="utf-8")
    print(f"Cocos Slab2: {destination.stat().st_size:,} bytes; {valid.sum():,} valid vertices; {len(indices) // 3:,} triangles")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python build-open-geology-assets.py <path-to-USGS-10m_DEM.zip>")
    compact_volcano_dem(Path(sys.argv[1]).resolve())
    compact_cocos_slab(PUBLIC / "tectonics" / "cam-slab2-depth.grd")


if __name__ == "__main__":
    main()
