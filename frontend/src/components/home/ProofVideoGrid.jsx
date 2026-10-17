import { useRef } from "react";
import { Link } from "react-router-dom";
import useNearViewport from "../../hooks/useNearViewport.js";
import InViewVideo from "../media/InViewVideo.jsx";
import { collectProofVideos } from "../../landings/homeProof.js";
import { cloudinaryPoster, cloudinaryVideo } from "../../utils/videoCdn.js";
import Reveal from "../motion/Reveal.jsx";

/*
 * Grilla de videos de uso (los `proofVideos` de las landings, solo Cloudinary).
 * Cada tile pide el mp4 transcodificado al ancho de la tile y un poster del
 * primer frame; el video baja recién al verse (InViewVideo). Mobile: tira
 * deslizable tipo stories; desktop: tira de 6 con alturas escalonadas.
 * Chrome baja el `poster` apenas existe el <video> (ignora preload="none"),
 * así que se asigna recién cuando la sección está a 800 px del viewport.
 */
const VIDEOS = collectProofVideos();
const TILE_WIDTH = 480; // ~240 px CSS × DPR 2

export default function ProofVideoGrid({ videos = VIDEOS }) {
  const sectionRef = useRef(null);
  const near = useNearViewport(sectionRef, { margin: 800 });
  if (videos.length < 3) return null;

  return (
    <section className="hp-videos" aria-labelledby="hp-videos-title" ref={sectionRef}>
      <div className="hp-inner">
        <Reveal as="header" className="hp-head hp-head--split">
          <div>
            <p className="hp-eyebrow hp-eyebrow--ink">En uso, sin filtro</p>
            <h2 className="hp-title hp-title--ink" id="hp-videos-title">
              Así se ven <em>fuera del anuncio.</em>
            </h2>
          </div>
          <p className="hp-lede hp-lede--ink">
            Videos cortos de los productos funcionando. Tocá uno para ir a su página.
          </p>
        </Reveal>

        <ul className="hp-video-strip">
          {videos.map((v, i) => (
            <li key={v.id} className="hp-video" style={{ "--i": i }}>
              <Link to={v.href} className="hp-video-link">
                <InViewVideo
                  className="hp-video-media"
                  src={cloudinaryVideo(v.src, { width: TILE_WIDTH })}
                  poster={near ? cloudinaryPoster(v.src, { width: TILE_WIDTH }) : null}
                  label={`Video: ${v.product}`}
                />
                <span className="hp-video-shade" aria-hidden="true" />
                <span className="hp-video-index" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="hp-video-caption">
                  {v.label && <span className="hp-video-label">{v.label}</span>}
                  <span className="hp-video-product">{v.product}</span>
                  <span className="hp-video-cta" aria-hidden="true">Ver producto →</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
