import DeepDiff from  'deep-diff';
const applyChange = DeepDiff.applyChange;
const diff = DeepDiff.diff;
/**
 * Edit history tracker for a javascript object using deep-diff to generate and apply patches
 */
export default class EditHistory {
  /**
   * Instantiates an instance of EditHistory
   * @param {Object} obj The object or array to track
   */
  constructor(obj) {
    this.obj = JSON.parse(JSON.stringify(obj));

    // initialize arrays for forwards and backwards patches
    this.forward = [];
    this.backward = [];
  }

  /**
   * Clears all forward and backward patches
   */
  clear() {
    this.forward = [];
    this.backward = [];
  }

  /**
   * Records a change to an object
   * @param {Object} newObj The new object
   */
  recordChange(newObj) {
    const patch = {
      redo: diff(this.obj, newObj),
      undo: diff(newObj, this.obj)
    };

    if (!patch.redo || !patch.undo) {
      console.warn("Objects could not be diffed");
    } else {
      this.obj = JSON.parse(JSON.stringify(newObj));
      this.backward.push(patch);
    }
  }

  /**
   * Applies the most recent undo patch and returns the new object
   * @returns {Object} The tracked object
   */
  undo() {
    if (this.backward.length === 0) {
      return null;
    }

    // grab the most recent backwards patch
    const patch = this.backward.pop();

    // applyChange doesn't accept arrays, only its members
    patch.undo.forEach(x => applyChange(this.obj, x));

    // put the patch into the forward queue
    this.forward.push(patch);

    return JSON.parse(JSON.stringify(this.obj));
  }

  /**
   * Applies the most recent redo patch and returns the new object
   * @returns {Object} The tracked object
   */
  redo() {
    if (this.forward.length === 0) {
      return null;
    }

    // grab the most recent forwards patch
    const patch = this.forward.pop();

    // applyChange doesn't accept arrays, only its members
    patch.redo.forEach(x => applyChange(this.obj, x));

    // put the patch into the backward queue
    this.backward.push(patch);

    return JSON.parse(JSON.stringify(this.obj));
  }

  /**
   * Applies all the undo patches in the queue and returns the new object
   * @returns {Object} The tracked object
   */
  undoAll() {
    while (this.backward.length > 0) {
      this.undo();
    }

    return this.obj;
  }

  /**
   * Applies all the redo patches in the queue and returns the new object
   * @returns {Object} The tracked object
   */
  redoAll() {
    while (this.forward.length > 0) {
      this.redo();
    }

    return this.obj;
  }
}
