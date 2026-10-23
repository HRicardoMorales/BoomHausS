// src/pages/CheckoutSheet.jsx
// Carrito rápido (bottom sheet). El checkout real vive en /checkout: "Finalizar
// compra" guarda el cupón aplicado en sessionStorage y navega ahí.
// Antes este archivo tenía además los pasos 1–4 (datos, pago MP/tarjeta/contra
// entrega, confirmación), pero eran inalcanzables: el paso 0 siempre navegaba a
// /checkout. Se quitaron sin cambio de comportamiento.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useCart } from '../hooks/useCart';
import api from "../services/api";
import { useCountdown } from "../hooks/useCountdown";
import { STORE_NAME } from "../config/brand";
import { money, calcItemTotal } from "../components/checkout/checkoutFormat";
import { CheckoutNav } from "../components/checkout/CheckoutNav";
import { CartStep } from "../components/checkout/CartStep";
import "../components/checkout/CheckoutSheet.css";

export function CheckoutSheet({ onClose, primaryColor = "#1b4d3e", primaryHover = "#153d31", accentColor = "#1D9E75", fontFamily = null, accentBg = "#fff0f5", accentBorder = "#FFC6C6", accentText = "#a0003e" }) {
  const navigate = useNavigate();
  const { items, totalPrice, calcItemTotal: ctxCalc } = useCart();
  const calc = ctxCalc || calcItemTotal;

  const cartTime = useCountdown("pd_cd_v2", 335);
  const socialProofCount = useMemo(() => 18 + Math.floor(Math.random() * 12), []);

  // ── Cupón de descuento ──
  const [couponOpen, setCouponOpen]       = useState(false);
  const [couponInput, setCouponInput]     = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError]     = useState("");
  // appliedCoupon: null | { code, type, value }
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const sheetRef = useRef(null);

  // Full price (without promos) for savings calc
  // For bundle items use compareAtPrice when available (the "tachado" price)
  const fullPrice = items.reduce((s, i) => {
    if (i.bundleTotal && i.compareAtPrice) return s + Number(i.compareAtPrice);
    return s + (Number(i.price) || 0) * (Number(i.quantity) || 0);
  }, 0);
  const savings = Math.max(0, fullPrice - totalPrice);

  // El envío se elige en /checkout; en el carrito rápido siempre es 0
  // (la opción por defecto, "sucursal", es gratis).
  const shippingCost = 0;

  // Descuento del cupón — siempre en sincronía con totalPrice actual
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") return Math.round(totalPrice * appliedCoupon.value / 100);
    return Math.min(appliedCoupon.value, totalPrice);
  }, [appliedCoupon, totalPrice]);

  const finalTotal = Math.max(0, totalPrice - discountAmount + shippingCost);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => sheetRef.current?.classList.add("cs-sheet--open"));
  }, []);

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponApplying(true);
    setCouponError("");
    try {
      const res = await api.post("/coupons/validate", { code, cartTotal: totalPrice });
      if (res.data?.ok) {
        setAppliedCoupon(res.data.data);
        setCouponError("");
      } else {
        setCouponError(res.data?.message || "Código inválido.");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError(err?.response?.data?.message || "Código inválido o expirado.");
      setAppliedCoupon(null);
    } finally {
      setCouponApplying(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="cs-overlay" onClick={handleOverlayClick} style={{ '--primary': primaryColor, '--primary-hover': primaryHover, '--cs-done': accentColor, '--text': '#0b1220', '--border': '#ebebeb', '--border2': '#d0d0d0', '--bg': '#f8f8f8', '--cs-accent-bg': accentBg, '--cs-accent-border': accentBorder, '--cs-accent-text': accentText }}>
      <div className="cs-sheet" ref={sheetRef} style={fontFamily ? { fontFamily } : undefined}>

        <CheckoutNav
          step={0}
          storeName={STORE_NAME}
          onExit={onClose}
          onBack={onClose}
          onClose={onClose}
        />

        <div className="cs-body">
          <CartStep
            items={items}
            calc={calc}
            accent={{ color: accentColor, bg: accentBg, border: accentBorder, text: accentText }}
            totals={{ shippingCost, savings, discountAmount, totalPrice, finalTotal }}
            coupon={{
              applied: appliedCoupon,
              open: couponOpen,
              onToggle: () => setCouponOpen(o => !o),
              input: couponInput,
              onInputChange: (v) => { setCouponInput(v); setCouponError(""); },
              applying: couponApplying,
              error: couponError,
              onApply: applyCoupon,
              onRemove: removeCoupon,
            }}
            cartTime={cartTime}
            socialProofCount={socialProofCount}
          />
        </div>

        <div className="cs-footer">
          <button className="cs-cta" disabled={items.length === 0} onClick={() => {
            if (appliedCoupon) {
              try { sessionStorage.setItem("pendingCoupon", JSON.stringify(appliedCoupon)); } catch { /* best-effort: se ignora */ }
            } else {
              try { sessionStorage.removeItem("pendingCoupon"); } catch { /* best-effort: se ignora */ }
            }
            onClose();
            navigate("/checkout", { state: { skipCart: true } });
          }}>
            Finalizar compra · {money(finalTotal)}
          </button>
          <div style={{ textAlign:"center", fontSize:11, color:"#aaa", fontWeight:600, marginTop:6 }}>
            🔒 Continuar como invitado · Sin necesidad de crear cuenta
          </div>
        </div>
      </div>
    </div>
  );
}
