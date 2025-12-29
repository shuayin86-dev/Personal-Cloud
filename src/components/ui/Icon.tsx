import React from 'react';

type Props = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  size?: number;
  className?: string;
  color?: string;
};

export const Icon: React.FC<Props> = ({ icon: IconComp, size = 16, className = '', color }) => {
  const style = color ? { color } : undefined;
  return <IconComp width={size} height={size} className={className} style={style} />;
};

export default Icon;
