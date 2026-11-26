import Konva from 'konva';
import katex from 'katex';
import { ref } from 'vue';

const images = new Map<string, HTMLImageElement>();
const loaded = ref(0);

export function sceneMath(layer: Konva.Container, tex: string, x: number, y: number, size = 19) {
  loaded.value;
  const key = size + ':' + tex;
  let image = images.get(key);
  if (!image) {
    const markup = katex.renderToString(tex, { output: 'mathml', throwOnError: false });
    const width = Math.max(120, tex.length * size);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + size * 3 +
      '"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;color:#283b37;font-size:' +
      size + 'px">' + markup + '</div></foreignObject></svg>';
    image = new Image();
    image.onload = () => loaded.value++;
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    if (images.size >= 256) images.delete(images.keys().next().value!);
    images.set(key, image);
  }
  if (image.complete && image.naturalWidth) layer.add(new Konva.Image({ image, x: x - image.width / 2, y }));
}
