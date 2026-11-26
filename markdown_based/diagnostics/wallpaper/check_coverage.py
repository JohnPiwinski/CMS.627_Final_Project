"""Independent planar geometry checks on the actual painter's vertex stream."""
import json
import math
import sys
from itertools import combinations
from shapely.affinity import translate
from shapely.geometry import Polygon
from shapely.ops import unary_union

data = json.load(sys.stdin)
for name, cell in data["extractedCells"].items():
    u, v = cell["basis"]
    outline = Polygon(cell["layers"][0]["rings"][0])
    area = abs(u[0] * v[1] - u[1] * v[0])
    epsilon = area * 1e-9
    assert outline.is_valid and abs(outline.area - area) < epsilon, name
    copies = [translate(outline, i*u[0]+j*v[0], i*u[1]+j*v[1])
              for i in range(-1,3) for j in range(-1,3)]
    assert all(a.intersection(b).area < epsilon for a, b in combinations(copies, 2)), name
    x, y = outline.centroid.coords[0]
    period = Polygon([(x,y),(x+u[0],y+u[1]),(x+u[0]+v[0],y+u[1]+v[1]),(x+v[0],y+v[1])])
    assert period.difference(unary_union(copies)).area < epsilon, name
print(f'{len(data["extractedCells"])} source-cell outlines cover a full period with disjoint interiors')

for name, stages in data["report"].items():
    reference_ratio = None
    for stage in stages:
        layers = [Polygon(layer["rings"][0]) for layer in stage["render"]]
        green, blue = layers[::2], layers[1::2]
        scale, count = stage["scale"], stage["count"]
        u, v = [[n * scale for n in vector] for vector in stage["basis"]]
        area = abs(u[0] * v[1] - u[1] * v[0])
        epsilon = area * 1e-9
        patch = unary_union(green)
        assert all(p.is_valid and abs(p.area - area) < epsilon for p in green), name
        assert all(a.intersection(b).area < epsilon for a, b in combinations(green, 2)), name
        assert all(p.is_valid and p.difference(cell).area < epsilon for p, cell in zip(blue, green)), name
        assert all(a.intersection(b).area < epsilon for i, a in enumerate(blue)
                   for j, b in enumerate(green) if j > i), name
        assert abs(patch.area - count**2 * area) < epsilon * count**2, name
        assert sum(len(p.interiors) for p in getattr(patch, 'geoms', [patch])) == 0, name

        # One period of a 2x2 or 5x5 interior must be covered once. For the
        # isolated cell, use periodic neighbors to check that same period.
        x, y = green[0].centroid.coords[0]
        period = Polygon([(x,y),(x+u[0],y+u[1]),(x+u[0]+v[0],y+u[1]+v[1]),(x+v[0],y+v[1])])
        neighbors = green if count > 1 else [
            translate(green[0], i*u[0]+j*v[0], i*u[1]+j*v[1])
            for i in range(-1,3) for j in range(-1,3)
        ]
        assert period.difference(unary_union(neighbors)).area < epsilon, name
        ratio = sum(p.area for p in blue) / (patch.area - sum(p.area for p in blue))
        if reference_ratio is None:
            reference_ratio = ratio
        assert math.isclose(ratio, reference_ratio, rel_tol=1e-9), name
        print(f'{name} {count}×{count}: vertex stream, coverage, overlap and color ratio pass ({ratio:.9f} blue/green)')
