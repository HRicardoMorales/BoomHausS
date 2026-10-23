import Skeleton from "../ui/Skeleton.jsx";

export default function SkeletonCard() {
  return (
    <div className="hc-card hc-card-skeleton" aria-hidden="true">
      <Skeleton className="hc-card-img" height="auto" radius="0" />
      <div className="hc-card-body" style={{ gap: 10 }}>
        <Skeleton height={16} width="75%" />
        <Skeleton height={28} width="55%" />
        <Skeleton height={40} radius={12} />
      </div>
    </div>
  );
}
