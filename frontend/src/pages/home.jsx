// frontend/src/pages/home.jsx
// Home / catálogo. La página solo orquesta: datos en `useCatalog`, reglas del
// catálogo en `landings/catalog.js` y la UI en `components/home/*`.
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog.js";
import { discountPct } from "../utils/pricing.js";
import HomeHero from "../components/home/HomeHero.jsx";
import CountdownBar from "../components/home/CountdownBar.jsx";
import SeenInStrip from "../components/home/SeenInStrip.jsx";
import BestsellerCarousel from "../components/home/BestsellerCarousel.jsx";
import HomeReviews from "../components/home/HomeReviews.jsx";
import ProofVideoGrid from "../components/home/ProofVideoGrid.jsx";
import HomeBenefits from "../components/home/HomeBenefits.jsx";
import HomeTransformations from "../components/home/HomeTransformations.jsx";
import HomeGuarantee from "../components/home/HomeGuarantee.jsx";
import HomeNewsletter from "../components/home/HomeNewsletter.jsx";
import CategoryTabs from "../components/home/CategoryTabs.jsx";
import CatalogGrid from "../components/home/CatalogGrid.jsx";
import { useHomeReveal } from "../components/home/useHomeReveal.js";
import {
  ALL_CATEGORIES,
  categoriesOf,
  categoryLabel,
  productCategory,
} from "../components/home/catalogCategories.js";
import "../components/home/home.css";
import "../components/home/home-hero.css";
import "../components/home/home-proof.css";
import "../components/home/home-closing.css";

const FEATURED_MAX = 8;
const FEATURED_MIN_DISCOUNT = 5;

const storeName = import.meta.env.VITE_STORE_NAME || "Encontratodo";
const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || "";
const waLink = whatsapp
  ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, "")}?text=${encodeURIComponent(
      `Hola! 👋 Quiero consultar sobre los productos de ${storeName}.`
    )}`
  : null;

/* Destacados: los de mayor descuento si hay al menos 3, si no los primeros. */
function pickFeatured(products) {
  const discounted = products
    .filter((p) => discountPct(p.price, p.compareAtPrice) >= FEATURED_MIN_DISCOUNT)
    .sort((a, b) => discountPct(b.price, b.compareAtPrice) - discountPct(a.price, a.compareAtPrice));
  return (discounted.length >= 3 ? discounted : products).slice(0, FEATURED_MAX);
}

const maxDiscountOf = (products) =>
  products.reduce((best, p) => Math.max(best, discountPct(p.price, p.compareAtPrice)), 0);

export default function Home() {
  const { products, loading, fetchError, retryAttempt, retry } = useCatalog();
  const [activeCat, setActiveCat] = useState(ALL_CATEGORIES);
  const catalogRef = useRef(null);

  const categories = useMemo(() => categoriesOf(products), [products]);
  const featured = useMemo(() => pickFeatured(products), [products]);
  const maxDiscount = useMemo(() => maxDiscountOf(products), [products]);
  const filtered = useMemo(
    () => (activeCat === ALL_CATEGORIES
      ? products
      : products.filter((p) => productCategory(p) === activeCat)),
    [products, activeCat]
  );

  useHomeReveal(!loading, activeCat);

  const scrollToCatalog = () =>
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="section hc-page">
      <HomeHero
        storeName={storeName}
        maxDiscount={maxDiscount}
        products={featured}
        loading={loading}
        onExplore={scrollToCatalog}
      />
      <SeenInStrip />
      <CountdownBar />

      <div className="hc-wrap">
        {!loading && featured.length >= 2 && (
          <BestsellerCarousel
            eyebrow="Selección de la semana"
            title="Las ofertas que más rinden"
            products={featured}
          />
        )}
      </div>

      <HomeReviews />

      <div className="hc-wrap">
        <div className="hc-sec-head hc-anim" ref={catalogRef}>
          <h2 className="hc-sec-title">Catálogo</h2>
          {!loading && !fetchError && (
            <span className="hc-sec-count">
              {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
              {activeCat !== ALL_CATEGORIES ? ` en "${categoryLabel(activeCat)}"` : ""}
            </span>
          )}
        </div>

        {categories.length > 0 && (
          <CategoryTabs categories={categories} active={activeCat} onChange={setActiveCat} />
        )}

        {/* Aviso de reintento: el cold start del backend puede tardar. */}
        {loading && retryAttempt > 0 && (
          <div className="hc-retry" role="status">
            ⏳ Contactando con el servidor… (intento {retryAttempt + 1} de 4)
          </div>
        )}

        <CatalogGrid
          products={filtered}
          loading={loading}
          fetchError={fetchError}
          activeCat={activeCat}
          onRetry={retry}
          onShowAll={() => setActiveCat(ALL_CATEGORIES)}
          waLink={waLink}
        />

      </div>

      <ProofVideoGrid />
      <HomeBenefits waLink={waLink} />
      <HomeTransformations />
      <HomeGuarantee waLink={waLink} />
      <HomeNewsletter />

      {!loading && (
        <div className="hc-wrap hc-bottom-nav">
          <Link className="btn btn-ghost" to="/my-orders">Mis pedidos</Link>
          <Link className="btn btn-ghost" to="/cart">Ver carrito</Link>
        </div>
      )}
      {/* WhatsApp: botón global <WhatsAppButton /> desde App.jsx. */}
    </main>
  );
}
