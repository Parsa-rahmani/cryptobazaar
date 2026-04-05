import React, { useMemo } from 'react';
import { Text, Billboard } from '@react-three/drei';

const USD_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * StallLabel — billboarded 3-line label floating in front of / below the stall.
 *
 * Props:
 *   chain    – { name, founder, totalUsdValue }
 *   position – [x, y, z] within the stall group
 */
export default function StallLabel({ chain, position = [0, 0, 0] }) {
  const { name = '', founder = '', totalUsdValue = 0 } = chain || {};

  const formattedValue = useMemo(
    () => USD_FORMAT.format(totalUsdValue),
    [totalUsdValue]
  );

  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      {/* Line 1: Chain name */}
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.2}
        color="white"
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

      {/* Line 2: Founder */}
      <Text
        position={[0, 0.08, 0]}
        fontSize={0.13}
        color="#CCCCCC"
        fontStyle="italic"
        anchorX="center"
        anchorY="middle"
      >
        {founder}
      </Text>

      {/* Line 3: Total USD value */}
      <Text
        position={[0, -0.12, 0]}
        fontSize={0.18}
        color="#F0B90B"
        anchorX="center"
        anchorY="middle"
      >
        {formattedValue}
      </Text>
    </Billboard>
  );
}
