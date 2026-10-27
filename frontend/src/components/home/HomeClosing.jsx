// Cierre de la home (videos → antes/después → cómo comprar → garantía).
// Vive en su propio chunk: nada de esto se ve en el primer pantallazo y,
// junto con `HomeReviews`, suma los configs de landing de
// `landings/homeProof.js`. Se monta con <LazySection> desde `pages/home.jsx`.
import ProofVideoGrid from "./ProofVideoGrid.jsx";
import HomeBenefits from "./HomeBenefits.jsx";
import HomeTransformations from "./HomeTransformations.jsx";
import HomeGuarantee from "./HomeGuarantee.jsx";
// HomeNewsletter queda fuera hasta conectar un proveedor real: hoy
// services/newsletter.js es un mock que dice "¡Listo!" sin guardar el mail.
// Para volver a mostrarlo: importarlo y ponerlo después de <HomeGuarantee />.
import "./home-proof.css";
import "./home-closing.css";

export default function HomeClosing({ waLink }) {
  return (
    <>
      <ProofVideoGrid />
      <HomeTransformations />
      <HomeBenefits waLink={waLink} />
      <HomeGuarantee waLink={waLink} />
    </>
  );
}
