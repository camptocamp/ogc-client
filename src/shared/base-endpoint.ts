import type { BaseLayerCore, BaseLayerExtended } from './base-layer.js';

export interface BaseEndpoint {
  getLayers(): BaseLayerCore[];
  getLayerById(id: string): BaseLayerCore | null;
}
