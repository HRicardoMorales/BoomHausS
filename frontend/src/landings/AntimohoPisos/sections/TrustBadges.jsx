import { TRUST_BADGES } from '../data';

export default function TrustBadges() {
  return (
    <div className="amp-trust-badges">
      {TRUST_BADGES.map((b, i) => (
        <div key={i} className="amp-trust-badge">
          <b.icon />
          <span>{b.text}</span>
        </div>
      ))}
    </div>
  );
}
