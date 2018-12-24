import {Encoding} from '../encoding';
import {RepeatRef} from '../fielddef';
import {Projection} from '../projection';
import {Resolve} from '../resolve';
import {BaseSpec, LayoutSizeMixins} from './base';
import {CompositeUnitSpec, GenericUnitSpec, NormalizedUnitSpec} from './unit';

export {normalizeTopLevelSpec as normalize} from '../normalize';
export {BaseSpec, DataMixins, LayoutSizeMixins} from './base';
export {TopLevel} from './toplevel';
export {CompositeUnitSpec, FacetedCompositeUnitSpec, GenericUnitSpec, isUnitSpec, NormalizedUnitSpec} from './unit';

export interface GenericLayerSpec<U extends GenericUnitSpec<any, any>> extends BaseSpec, LayoutSizeMixins {
  /**
   * Layer or single view specifications to be layered.
   *
   * __Note__: Specifications inside `layer` cannot use `row` and `column` channels as layering facet specifications is not allowed. Instead, use the [facet operator](https://vega.github.io/vega-lite/docs/facet.html) and place a layer inside a facet.
   */
  layer: (GenericLayerSpec<U> | U)[];

  /**
   * Scale, axis, and legend resolutions for layers.
   */
  resolve?: Resolve;
}

/**
 * Layer Spec with encoding and projection
 */
export interface ExtendedLayerSpec extends GenericLayerSpec<CompositeUnitSpec> {
  /**
   * A shared key-value mapping between encoding channels and definition of fields in the underlying layers.
   */
  encoding?: Encoding<string | RepeatRef>;

  /**
   * An object defining properties of the geographic projection shared by underlying layers.
   */
  projection?: Projection;
}

export type NormalizedLayerSpec = GenericLayerSpec<NormalizedUnitSpec>;

export function isLayerSpec(spec: BaseSpec): spec is GenericLayerSpec<any> {
  return spec['layer'] !== undefined;
}
