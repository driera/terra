import type { LayerSpecification } from "maplibre-gl";

const layerColors = {
  gray: '#8a7c6e',
  white: '#ffffff'
}

export const defaultLayers: Record<string, LayerSpecification> = {
    contourLine: {
    id: 'contour-line',
    type: 'line',
    source: 'contours',
    'source-layer': 'contour',
    paint: {
      'line-color': layerColors.gray,
      'line-width': ['match', ['get', 'nth_line'], 10, 1.5, 0.5],
      'line-opacity': ['match', ['get', 'nth_line'], 10, 0.8, 0.5],
    },
  },
  contourLabel: {
    id: 'contour-label',
    type: 'symbol',
    source: 'contours',
    'source-layer': 'contour',
    filter: ['==', ['get', 'nth_line'], 10],
    layout: {
      'symbol-placement': 'line',
      'text-field': ['concat', ['to-string', ['get', 'ele']], 'm'],
      'text-size': 10,
    },
    paint: {
      'text-color': layerColors.gray,
      'text-halo-color': layerColors.white,
      'text-halo-width': 1,
    },
  }
} as const;
