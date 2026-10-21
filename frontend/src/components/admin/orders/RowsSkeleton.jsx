import Skeleton, { SkeletonGroup } from '../../ui/Skeleton.jsx';

/* Filas fantasma con la altura de una fila real del listado. */
export default function RowsSkeleton({ label, rows = 5 }) {
  return (
    <SkeletonGroup label={label} className="ao-list">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height="68px" radius="12px" style={{ display: 'block', opacity: 1 - i * 0.14 }} />
      ))}
    </SkeletonGroup>
  );
}
