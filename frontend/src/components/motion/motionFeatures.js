// Features de Framer Motion que se cargan aparte (chunk propio) después del
// primer render: animaciones, variants, exit, hover/tap/focus e inView.
// `domMax` (layout/drag) no hace falta y suma ~25 KB más.
import { domAnimation } from "framer-motion";

export default domAnimation;
