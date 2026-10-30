import SafeImg from '../../../components/SafeImg';

/* S9/S8 — Imagen de ingredientes y banner Kinoki */
export default function ImageBanners() {
  return (
    <>
      <section className="pdx-ingredients-section">
        <SafeImg
          src="https://nesimu.com/cdn/shop/files/imgi_253_Transformacion_Visible_Nocturna_-_Ad_1_1.webp?v=1770704798&width=1500"
          alt="Ingredientes naturales de los Parches Detox"
          className="pdx-ingredients-img"
          sizes="(min-width: 1100px) 1100px, 100vw"
        />
      </section>

      {/* ══ S8 — BANNER KINOKI ══ */}
      <div className="pdx-kinoki-banner">
        <SafeImg
          src="https://cdn.shopify.com/s/files/1/0698/1468/1858/files/KINOKI002_1.webp?v=1728713376"
          alt="Parches Kinoki — beneficios"
          sizes="min(648px, calc(100vw - 32px))"
          widths={[360, 648, 960, 1296]}
        />
      </div>
    </>
  );
}
