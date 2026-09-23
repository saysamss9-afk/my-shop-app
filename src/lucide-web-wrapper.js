import * as LucideIcons from 'lucide-react-raw';
import React, { forwardRef } from 'react';

/**
 * Wraps a Lucide Icon component for React Web to filter out React Native Web specific props
 * such as `dataSet`, `states`, or `sx` that cause React DOM unknown property warnings on SVG elements.
 */
const wrapIcon = (IconComponent) => {
  if (!IconComponent) return IconComponent;

  const WrappedIcon = forwardRef((props, ref) => {
    const { dataSet, states, sx, ...restProps } = props;

    // Convert dataSet object keys into valid data-* DOM attributes
    const dataProps = {};
    if (dataSet && typeof dataSet === 'object') {
      Object.keys(dataSet).forEach((key) => {
        dataProps[`data-${key}`] = dataSet[key];
      });
    }

    return <IconComponent ref={ref} {...dataProps} {...restProps} />;
  });

  WrappedIcon.displayName = IconComponent.displayName || IconComponent.name || 'LucideIcon';
  return WrappedIcon;
};

const iconCache = new Map();

const LucideProxy = new Proxy(LucideIcons, {
  get(target, prop, receiver) {
    const original = Reflect.get(target, prop, receiver);

    if (typeof original === 'function' || (typeof original === 'object' && original !== null && original.$$typeof)) {
      if (prop === 'createLucideIcon') {
        return (iconName, iconNode) => {
          const created = original(iconName, iconNode);
          return wrapIcon(created);
        };
      }
      if (!iconCache.has(prop)) {
        iconCache.set(prop, wrapIcon(original));
      }
      return iconCache.get(prop);
    }

    return original;
  },
});

export default LucideProxy;
module.exports = LucideProxy;
