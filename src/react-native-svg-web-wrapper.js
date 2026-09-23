import * as RNSVG from 'react-native-svg-raw';
import React, { forwardRef } from 'react';

/**
 * Web wrapper for react-native-svg that filters out React Native Web specific props
 * like `dataSet`, `states`, or `sx` from reaching DOM SVG elements.
 */
function cleanProps(props) {
  if (!props) return props;
  const { dataSet, states, sx, ...rest } = props;
  if (!dataSet || typeof dataSet !== 'object') {
    return rest;
  }
  const dataProps = {};
  Object.keys(dataSet).forEach((key) => {
    dataProps[`data-${key}`] = dataSet[key];
  });
  return { ...dataProps, ...rest };
}

function wrapComponent(Component) {
  if (!Component) return Component;
  const Wrapped = forwardRef((props, ref) => {
    return <Component ref={ref} {...cleanProps(props)} />;
  });
  Wrapped.displayName = Component.displayName || Component.name || 'SvgComponent';
  return Wrapped;
}

const cache = new Map();

const RNSVGProxy = new Proxy(RNSVG, {
  get(target, prop, receiver) {
    const original = Reflect.get(target, prop, receiver);
    if (typeof original === 'function' || (typeof original === 'object' && original !== null && original.$$typeof)) {
      if (!cache.has(prop)) {
        cache.set(prop, wrapComponent(original));
      }
      return cache.get(prop);
    }
    return original;
  },
});

export default wrapComponent(RNSVG.default || RNSVG.Svg);
export const Svg = wrapComponent(RNSVG.Svg);
export const Path = wrapComponent(RNSVG.Path);
export const Circle = wrapComponent(RNSVG.Circle);
export const Ellipse = wrapComponent(RNSVG.Ellipse);
export const G = wrapComponent(RNSVG.G);
export const Text = wrapComponent(RNSVG.Text);
export const TSpan = wrapComponent(RNSVG.TSpan);
export const TextPath = wrapComponent(RNSVG.TextPath);
export const Rect = wrapComponent(RNSVG.Rect);
export const Line = wrapComponent(RNSVG.Line);
export const Polygon = wrapComponent(RNSVG.Polygon);
export const Polyline = wrapComponent(RNSVG.Polyline);
export const Use = wrapComponent(RNSVG.Use);
export const Image = wrapComponent(RNSVG.Image);
export const Symbol = wrapComponent(RNSVG.Symbol);
export const Defs = wrapComponent(RNSVG.Defs);
export const LinearGradient = wrapComponent(RNSVG.LinearGradient);
export const RadialGradient = wrapComponent(RNSVG.RadialGradient);
export const Stop = wrapComponent(RNSVG.Stop);
export const ClipPath = wrapComponent(RNSVG.ClipPath);
export const Pattern = wrapComponent(RNSVG.Pattern);
export const Mask = wrapComponent(RNSVG.Mask);
export const Marker = wrapComponent(RNSVG.Marker);
export const ForeignObject = wrapComponent(RNSVG.ForeignObject);
