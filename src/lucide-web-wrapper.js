import * as LucideIcons from 'lucide-react-raw';
import React, { forwardRef } from 'react';

/**
 * Removes Gluestack style metadata before setting props on DOM SVG elements.
 * The generated `dataSet.componentConfig` value is not a valid DOM attribute and
 * triggers the React warning seen in Web builds.
 */
export function sanitizeProps(props = {}) {
  const { dataSet, states, sx, componentConfig, componentconfig, ...restProps } = props;

  const dataProps = {};
  if (dataSet && typeof dataSet === 'object') {
    Object.entries(dataSet).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'componentConfig' || key === 'componentconfig') return;
      dataProps[`data-${key}`] = value;
    });
  }

  return { ...dataProps, ...restProps };
}

const wrapIcon = (IconComponent) => {
  if (!IconComponent) return IconComponent;

  const WrappedIcon = forwardRef((props, ref) => {
    const sanitizedProps = sanitizeProps(props);
    return <IconComponent ref={ref} {...sanitizedProps} />;
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
module.exports.sanitizeProps = sanitizeProps;
