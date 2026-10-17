// frontend/src/utils/videoCdn.js
//
// Videos de Cloudinary livianos para mobile. Los mp4 de las landings se suben
// en la resolución original (1080p, varios Mbps); para una tile de ~200 px eso
// es desperdicio. Cloudinary transcodifica on-the-fly:
//
//   cloudinaryVideo(url, { width: 480 })  → .../video/upload/q_auto,vc_auto,c_limit,w_480/v123/foo.mp4
//   cloudinaryPoster(url, { width: 480 }) → .../video/upload/so_0,q_auto,f_auto,c_limit,w_480/v123/foo.jpg
//
// El poster es el primer frame como imagen: la tile muestra algo antes de que
// el video empiece a bajar (y es lo único que se ve con reduced motion).
// URLs de otros hosts se devuelven tal cual (poster: null).

const CLOUDINARY_VIDEO_RE = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.*)$/i;

export function isCloudinaryVideo(url) {
  return typeof url === "string" && CLOUDINARY_VIDEO_RE.test(url);
}

export function cloudinaryVideo(url, { width = 480 } = {}) {
  const m = typeof url === "string" && url.match(CLOUDINARY_VIDEO_RE);
  if (!m) return url;
  return `${m[1]}q_auto,vc_auto,c_limit,w_${width}/${m[2]}`;
}

export function cloudinaryPoster(url, { width = 480 } = {}) {
  const m = typeof url === "string" && url.match(CLOUDINARY_VIDEO_RE);
  if (!m) return null;
  const path = m[2].replace(/\.(mp4|mov|webm|ogg)(?=$|[?#])/i, ".jpg");
  return `${m[1]}so_0,q_auto,f_auto,c_limit,w_${width}/${path}`;
}
