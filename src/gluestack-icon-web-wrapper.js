import React, { forwardRef } from 'react';
import * as RawIconModule from '../node_modules/@gluestack-ui/icon/lib/index.web.jsx';

/**
 * Web wrapper for @gluestack-ui/icon that filters out React Native Web specific props
 * such as `dataSet`, `states`, or `sx` from reaching DOM SVG elements on Web.
 */
function cleanProps(props) {
  if (!props) return props;
  const { dataSet, states, sx, componentConfig, componentconfig, ...rest } = props;
  if (!dataSet || typeof dataSet !== 'object') {
    return rest;
  }
  const dataProps = {};
  Object.entries(dataSet).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'componentConfig' || key === 'componentconfig') return;
    dataProps[`data-${key}`] = value;
  });
  return { ...dataProps, ...rest };
}

export const createIcon = RawIconModule.createIcon;

export const Svg = forwardRef((props, ref) => {
  const RawSvg = RawIconModule.Svg;
  return <RawSvg ref={ref} {...cleanProps(props)} />;
});
Svg.displayName = 'Svg';

export const PrimitiveIcon = forwardRef((props, ref) => {
  const RawPrimitiveIcon = RawIconModule.PrimitiveIcon;
  return <RawPrimitiveIcon ref={ref} {...cleanProps(props)} />;
});
PrimitiveIcon.displayName = 'PrimitiveIcon';

export const UIIcon = RawIconModule.UIIcon;
