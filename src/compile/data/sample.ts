import {SampleTransform as VgSampleTransform} from 'vega';
import {SampleTransform} from '../../transform';
import {duplicate, hash} from '../../util';
import {DataFlowNode} from './dataflow';

/**
 * A class for the sample transform nodes
 */
export class SampleTransformNode extends DataFlowNode {
  public clone() {
    return new SampleTransformNode(this.parent, duplicate(this.transform));
  }

  constructor(parent: DataFlowNode, private transform: SampleTransform) {
    super(parent);
  }

  public hash() {
    return hash(this.transform);
  }
  public assemble(): VgSampleTransform {
    return {
      type: 'sample',
      size: this.transform.sample
    };
  }
}
