// @flow
import delegateEvent from './delegate-event';
import unboundEventHandler from './unbound-event-handler';
import CodedError from '../../../util/CodedError';

type Tool = any;
type OnSelectToolHandler = string => boolean;

/**
 * Manages the state of all elements in the provided scope matching the selector
 * `button[tool-id="thing"]``
 */
export default class ToolMenu {
  scope: HTMLElement;
  knownToolIDs: string[];

  /**
   * Handler for the tool change event. The tool will not be allowed to change
   * if the handler returns false.
   */
  __onSelectTool: OnSelectToolHandler;

  constructor(scope: HTMLElement, known_tool_ids: string[]) {
    this.scope = scope;
    this.knownToolIDs = known_tool_ids;
    this.__onSelectTool = unboundEventHandler('__onSelectTool');
  }

  /** 
   * Start listening to click events from the DOM.
   */
  bind() {
    delegateEvent(
      this.scope,
      'click',
      'button[tool-id]',
      this.__setActiveToolFromEvent.bind(this),
    );
  }

  /**
   * Register a handler for selecting a tool.
   */
  onSelectTool(handler: OnSelectToolHandler): this {
    this.__onSelectTool = handler;
    return this;
  }

  __setActiveToolFromEvent(tool_elem: HTMLButtonElement, e: MouseEvent) {
    // Set the current tool from the tool's id
    const tool_id = tool_elem.getAttribute('tool-id');
    if (tool_id === null || tool_id === undefined) {
      throw new CodedError({
        type: 'select_null_tool',
        message: 'selected null or undefined tool',
      });
    }
    if (!this.knownToolIDs.includes(tool_id)) {
      throw new CodedError({
        type: 'select_nonexistant_tool',
        message: `selected unknown tool '${String(tool_id)}'`,
        tool_id: tool_id,
        known_tool_ids: this.knownToolIDs,
      });
    }
    this.setActiveTool(tool_id);
  }

  setActiveTool(tool_id: string): this {
    // do nothing if someone tries to change tools while a current tool is
    // active
    let tool_elem = this.scope.querySelector(`[tool-id="${tool_id}"]`);
    if (tool_elem === null || tool_elem === undefined) {
      throw new CodedError({
        type: 'select_tool_without_element',
        message: `selected tool '${tool_id}' without element`,
        tool_id: tool_id,
      });
    }

    if (!this.__onSelectTool(tool_id)) {
      return this;
    }

    // Set the '.selected' class only on the active tool button
    Array.from(this.scope.querySelectorAll('[tool-id]')).map(element => {
      element.classList.remove('selected');
    });
    tool_elem.classList.add('selected');

    return this;
  }
}
