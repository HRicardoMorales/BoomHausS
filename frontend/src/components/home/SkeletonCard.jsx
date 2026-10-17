export default function SkeletonCard() {
  return (
    <div className="hc-card hc-card-skeleton" aria-hidden="true">
      <div className="hc-card-img hc-skel" />
      <div className="hc-card-body" style={{ gap: 10 }}>
        <div className="hc-skel" style={{ height: 16, borderRadius: 8, width: "75%" }} />
        <div className="hc-skel" style={{ height: 28, borderRadius: 8, width: "55%" }} />
        <div className="hc-skel" style={{ height: 40, borderRadius: 12 }} />
      </div>
    </div>
  );
}
