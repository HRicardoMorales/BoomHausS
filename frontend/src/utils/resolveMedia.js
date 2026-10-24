/**
 * Convierte una URL de medio cargada en la config de una landing en algo que
 * se pueda renderizar: iframe (YouTube/Vimeo), <video>, GIF o imagen.
 *
 * Los iframes salen muteados, en loop y sin controles: se usan como "GIF
 * liviano" en tiras de prueba social, no como reproductor.
 *
 * @param {string | undefined | null} url
 * @returns {{ type: 'iframe' | 'video' | 'gif' | 'image', src: string } | null}
 */
export function resolveMedia(url) {
  if (!url) return null;

  const youtubeId =
    url.match(/youtube\.com\/shorts\/([\w-]+)/)?.[1] ??
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)?.[1];
  if (youtubeId) {
    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      loop: "1",
      playlist: youtubeId, // necesario para que YouTube haga loop de un solo video
      controls: "0",
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
    });
    return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}` };
  }

  const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  if (vimeoId) {
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1&byline=0&title=0&dnt=1`,
    };
  }

  if (/\.(mp4|mov|webm|ogg)(\?|#|$)/i.test(url)) return { type: "video", src: url };
  if (/\.gif(\?|#|$)/i.test(url)) return { type: "gif", src: url };
  return { type: "image", src: url };
}

