// frontend/src/pages/home.jsx
// Home / catálogo. La página solo orquesta: datos en `useCatalog`, reglas del
// catálogo en `landings/catalog.js`, identidad de belleza en
// `components/home/beauty.js` y la UI en `components/home/*`.
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../hooks/useCatalog.js";
import { useBestsellerIds } from "../hooks/useBestsellerIds.js";
import { rankBySales } from "../components/home/bestsellers.js";
import { beautyFirst, concernsWithProducts, isBeauty } from "../components/home/beauty.js";
import HomeHero from "../components/home/HomeHero.jsx";
import CountdownBar from "../components/home/CountdownBar.jsx";
import HomeConcerns from "../components/home/HomeConcerns.jsx";
import HomeStatement from "../components/home/HomeStatement.jsx";
import BestsellerCarousel from "../components/home/BestsellerCarousel.jsx";
import LazySection from "../components/home/LazySection.jsx";
import { lazyWithRetry } from "../utils/lazyWithRetry.js";
import CategoryTabs from "../components/home/CategoryTabs.jsx";
import CatalogGrid from "../components/home/CatalogGrid.jsx";
import Reveal from "../components/motion/Reveal.jsx";
import {
  ALL_CATEGORIES,
  categoriesOf,
  categoryLabel,
  productCategory,
} from "../components/home/catalogCategories.js";
import "../components/home/home-hero.css";
import "../components/home/home.css";
import "../components/home/home-sections.css";
import { STORE_NAME } from "../config/brand.js";

/* Bajo el pliegue: chunks aparte (ver LazySection). Opiniones va sola porque
   queda entre la vidriera y el catálogo; el resto es el cierre de la página. */
const HomeReviews = lazyWithRetry(() => import("../components/home/HomeReviews.jsx"));
const HomeClosing = lazyWithRetry(() => import("../components/home/HomeClosing.jsx"));

const FEATURED_MAX = 8;

const whatsapp = import.meta.env.VITE_WHATSAPP_NUMBER || "";
const waLink = whatsapp
  ? `https://wa.me/${String(whatsapp).replace(/[^\d]/g, "")}?text=${encodeURIComponent(
      `Hola, quiero consultar sobre los productos de ${STORE_NAME}.`
    )}`
  : null;

const minPrice = (products) =>
  products.reduce((min, p) => (p.price > 0 && (min === 0 || p.price < min) ? p.price : min), 0);

export default function Home() {
  const { products, loading, fetchError, retryAttempt, retry } = useCatalog();
  const [activeCat, setActiveCat] = useState(ALL_CATEGORIES);
  const concernsRef = useRef(null);
  const catalogRef = useRef(null);

  const beauty = useMemo(() => beautyFirst(products.filter(isBeauty)), [products]);
  const concerns = useMemo(() => concernsWithProducts(products), [products]);
  const categories = useMemo(() => categoriesOf(products), [products]);
  const bestsellerIds = useBestsellerIds();
  // Más vendidos reales si hay datos de ventas suficientes; si no, belleza primero.
  const bestsellers = useMemo(
    () => rankBySales(products, bestsellerIds, { max: FEATURED_MAX }),
    [products, bestsellerIds]
  );
  const showcase = useMemo(() => beautyFirst(products).slice(0, FEATURED_MAX), [products]);
  const filtered = useMemo(
    () => beautyFirst(activeCat === ALL_CATEGORIES
      ? products
      : products.filter((p) => productCategory(p) === activeCat)),
    [products, activeCat]
  );

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="hc-page">
      <HomeHero
        product={beauty[0] || products[0]}
        fromPrice={minPrice(beauty)}
        loading={loading}
        onExplore={() => scrollTo(concernsRef)}
        onShopAll={() => scrollTo(catalogRef)}
      />
      <CountdownBar />

      <HomeConcerns ref={concernsRef} items={concerns} />

      {!loading && (bestsellers || showcase.length >= 2) && (
        <div className="hc-wrap hc-block hc-block--tight-top">
          <BestsellerCarousel
            title={bestsellers ? "Los más vendidos" : "Para empezar"}
            subtitle={bestsellers
              ? "Ordenados por las ventas reales de la tienda."
              : "Una selección para arrancar tu rutina."}
            products={bestsellers || showcase}
          />
        </div>
      )}

      <HomeStatement />

      <LazySection component={HomeReviews} minHeight={560} />

      <div className="hc-wrap hc-block">
        <Reveal className="hc-sec-head" ref={catalogRef}>
          <h2 className="hc-sec-title">Toda la tienda</h2>
          {!loading && !fetchError && (
            <span className="hc-sec-count">
              {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
              {activeCat !== ALL_CATEGORIES ? ` en "${categoryLabel(activeCat)}"` : ""}
            </span>
          )}
        </Reveal>

        {categories.length > 0 && (
          <CategoryTabs categories={categories} active={activeCat} onChange={setActiveCat} />
        )}

        {/* Aviso de reintento: el cold start del backend puede tardar. */}
        {loading && retryAttempt > 0 && (
          <p className="hc-retry" role="status">
            Despertando el servidor, puede tardar unos segundos (intento {retryAttempt + 1} de 4).
          </p>
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

      <LazySection component={HomeClosing} minHeight={1600} waLink={waLink} />

      {!loading && (
        <nav className="hc-wrap hc-bottom-nav" aria-label="Tu compra">
          <Link className="btn btn-ghost" to="/my-orders">Mis pedidos</Link>
          <Link className="btn btn-ghost" to="/cart">Ver carrito</Link>
        </nav>
      )}
      {/* WhatsApp: botón global <WhatsAppButton /> desde App.jsx. */}
    </main>
  );
}
