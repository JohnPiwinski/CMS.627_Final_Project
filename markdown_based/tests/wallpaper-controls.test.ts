import { describe, expect, it } from 'vitest';
import { wallpapers, motion } from '../src/lib/wallpaper';
import { corners, registeredWallpaper, verifiedMove, wallpaperFeatures } from '../src/lib/wallpaper-explorer';

const pattern = (id: string) => registeredWallpaper(wallpapers.find(p => p.id === id)!);

describe('wallpaper symmetry controls', () => {
  it('registers the full linear group of each original decorated cell', () => {
    for (const spec of wallpapers) expect(registeredWallpaper(spec).reps.length,spec.id).toBe(spec.reps.length);
  });
  for (const [id,order] of [['p4',4],['p6',6]] as const) {
    it('offers the verified rotation order for ' + id, () => {
      const spec = pattern(id);
      expect(spec.reps).toHaveLength(order);
      const turns = wallpaperFeatures(spec,corners).filter(x => x.kind === 'turn');
      const center = turns.find(x => x.order === order);
      expect(center).toBeDefined();
      expect(verifiedMove(spec,motion('rotate',center!.point,2*Math.PI/order,0))).toBe(true);
      expect(verifiedMove(spec,motion('rotate',center!.point,Math.PI/order,0))).toBe(false);
    });
  }
  it('offers glides and no mirror for pg', () => {
    const spec = pattern('pg');
    const features = wallpaperFeatures(spec,corners);
    expect(features.some(x => x.kind === 'mirror')).toBe(false);
    const glide = features.find(x => x.kind === 'glide' && Math.abs(Math.abs(x.amount)-.5)<1e-7);
    expect(glide).toBeDefined();
    expect(verifiedMove(spec,motion('glide',glide!.point,glide!.angle,glide!.amount))).toBe(true);
  });
  it('keeps features available after panning across the plane', () => {
    const region = corners.map(p => ({ x:p.x+200,y:p.y-130 }));
    const visible = wallpaperFeatures(pattern('p4'),region).filter(x => x.kind === 'turn' &&
      x.point.x >= 200 && x.point.x <= 201 && x.point.y >= -130 && x.point.y <= -129);
    expect(visible.some(x => x.order === 4)).toBe(true);
  });
});
