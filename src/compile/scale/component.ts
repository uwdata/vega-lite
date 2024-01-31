import type {SignalRef} from 'vega';
import {isArray, isNumber} from 'vega-util';
import {ScaleChannel} from '../../channel.js';
import {Scale, ScaleType} from '../../scale.js';
import {ParameterExtent} from '../../selection.js';
import {some} from '../../util.js';
import {VgNonUnionDomain, VgScale} from '../../vega.schema.js';
import {Explicit, Split} from '../split.js';

/**
 * All VgDomain property except domain.
 * (We exclude domain as we have a special "domains" array that allow us merge them all at once in assemble.)
 */
export type ScaleComponentProps = Omit<VgScale, 'domain' | 'reverse'> & {
  domains: VgNonUnionDomain[];
  selectionExtent?: ParameterExtent;
  reverse?: boolean | SignalRef; // Need override since Vega doesn't official support scale reverse yet (though it does in practice)
};

export type Range = ScaleComponentProps['range'];

export class ScaleComponent extends Split<ScaleComponentProps> {
  public merged = false;

  constructor(name: string, typeWithExplicit: Explicit<ScaleType>) {
    super(
      {}, // no initial explicit property
      {name} // name as initial implicit property
    );
    this.setWithExplicit('type', typeWithExplicit);
  }

  /**
   * Whether the scale definitely includes zero in the domain
   */
  public domainDefinitelyIncludesZero() {
    if (this.get('zero') !== false) {
      return true;
    }
    return some(
      this.get('domains'),
      d => isArray(d) && d.length === 2 && isNumber(d[0]) && d[0] <= 0 && isNumber(d[1]) && d[1] >= 0
    );
  }
}

export type ScaleComponentIndex = Partial<Record<ScaleChannel, ScaleComponent>>;

export type ScaleIndex = Partial<Record<ScaleChannel, Scale<SignalRef>>>;
