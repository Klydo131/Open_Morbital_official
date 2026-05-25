// SPDX-License-Identifier: AGPL-3.0-or-later
import { Rocket } from 'lucide-react';

type Props = { feature: string };

export function ComingSoonRoute({ feature }: Props) {
  return (
    <div className="sonata-route">
      <div className="sonata-coming-soon" style={{ height: '100%' }}>
        <Rocket size={40} className="sonata-coming-soon__icon" />
        <div className="sonata-coming-soon__title">{feature}</div>
        <p className="sonata-coming-soon__sub">
          This feature is coming in a future version of Open Morbital.
        </p>
      </div>
    </div>
  );
}
