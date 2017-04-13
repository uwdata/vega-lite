import {COLUMN, ROW} from '../../channel';
import {VgData, VgTransform} from '../../vega.schema';
import {FacetModel} from '../facet';
import {DataFlowNode, OutputNode} from './dataflow';

/**
 * A node that helps us track what fields we are faceting by.
 */
export class FacetNode extends DataFlowNode {
  private readonly columnField: string;
  private readonly columnName: string;

  private readonly rowField: string;
  private readonly rowName: string;

  /**
   * @param model The facet model
   * @param name The name that this facet source will have.
   * @param data The source data for this facet data.
   */
  public constructor(model: FacetModel, public readonly name: string, public data: string) {
    super();

    if (model.facet.column) {
      this.columnField = model.field(COLUMN);
      this.columnName = model.getName('column');
    }

    if (model.facet.row) {
      this.rowField = model.field(ROW);
      this.rowName = model.getName('row');
    }
  }

  get fields() {
    const fields: string[] = [];
    if (this.columnField) {
      fields.push(this.columnField);
    }
    if (this.rowField) {
      fields.push(this.rowField);
    }
    return fields;
  }

  /**
   * The name to reference this source is its name
   */
  get source() {
    return this.name;
  }

  public assemble(source: string) {
    const data: VgData[] = [];

    if (this.columnName) {
      data.push({
        name: this.columnName,
        source: source,
        transform: [{
          type: 'aggregate',
          groupby: [this.columnField]
        }]
      });
    }

    if (this.rowName) {
      data.push({
        name: this.rowName,
        source: source,
        transform: [{
          type: 'aggregate',
          groupby: [this.rowField]
        }]
      });
    }

    return data;
  }
}

