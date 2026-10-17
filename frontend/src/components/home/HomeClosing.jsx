// Cierre de la home (videos → beneficios → resultados → garantía →
// newsletter). Vive en su propio chunk: nada de esto se ve en el primer
// pantallazo y junto con `HomeReviews` suma los configs de landing que usa
// `landings/homeProof.js`. Se monta con <LazySection> desde `pages/home.jsx`.
import ProofVideoGrid from "./ProofVideoGrid.jsx";
import HomeBenefits from "./HomeBenefits.jsx";
import HomeTransformations from "./HomeTransformations.jsx";
import HomeGuarantee from "./HomeGuarantee.jsx";
import HomeNewsletter from "./HomeNewsletter.jsx";
import "./home-proof.css";
import "./home-closing.css";

export default function HomeClosing({ waLink }) {
  return (
    <>
      <ProofVideoGrid />
      <HomeBenefits waLink={waLink} />
      <HomeTransformations />
      <HomeGuarantee waLink={waLink} />
      <HomeNewsletter />
    </>
  );
}
