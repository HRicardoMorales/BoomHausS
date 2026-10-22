import { useEffect, useState } from "react";
import api from "../services/api";

/* Ids ordenados por ventas (GET /products/bestsellers). Si falla o todavía no
   llegó, queda en [] y la home muestra el carrusel de ofertas como antes. */
export function useBestsellerIds() {
  const [ids, setIds] = useState([]);
  useEffect(() => {
    let alive = true;
    api
      .get("/products/bestsellers")
      .then((res) => {
        if (alive && Array.isArray(res.data?.data)) setIds(res.data.data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return ids;
}
