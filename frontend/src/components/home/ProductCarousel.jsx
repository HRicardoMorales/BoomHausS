import ProductCard from "./ProductCard.jsx";

/* Fila horizontal con scroll-snap (CSS). Embla llega con el rediseño de la home. */
export default function ProductCarousel({ title, pill, products }) {
  return (
    <>
      <div className="hc-sec-head hc-anim">
        <h2 className="hc-sec-title">{title}</h2>
        {pill && <span className="hc-sec-pill">{pill}</span>}
      </div>
      <div className="hc-carousel-wrap">
        <div className="hc-carousel">
          {products.map((p, i) => (
            <ProductCard key={p._id} product={p} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}
