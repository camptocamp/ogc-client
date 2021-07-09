import { getUniqueId } from '../shared/id';

/**
 * @typedef {Object} WorkerRequest
 * @property {number} requestId
 * @property {string} taskName
 * @property {Object} params
 */

/**
 * @typedef {Object} WorkerResponse
 * @property {number} requestId
 * @property {Object} [error]
 * @property {Object} [response]
 */

/**
 * @param {string} taskName
 * @param {Worker} workerInstance
 * @param {Object} params
 * @return {Promise<Object>}
 */
export function sendTaskRequest(taskName, workerInstance, params) {
  return new Promise((resolve, reject) => {
    const requestId = getUniqueId();
    workerInstance.postMessage(
      /** @type {WorkerRequest} */ {
        requestId,
        taskName,
        params,
      }
    );
    /** @param {WorkerResponse} data */
    const handler = ({ data }) => {
      console.log('message received in main', data);
      if (data.requestId === requestId) {
        workerInstance.removeEventListener('message', handler);
        if ('error' in data) {
          reject(data.error);
        } else {
          resolve(data.response);
        }
      }
    };
    workerInstance.addEventListener('message', handler);
  });
}

/**
 * @param {string} taskName
 * @param {DedicatedWorkerGlobalScope} scope
 * @param {function(params: Object):Promise<Object>} handler
 */
export function addTaskHandler(taskName, scope, handler) {
  /**
   * @param {WorkerRequest} data
   */
  const eventListener = async ({ data }) => {
    if (data.taskName === taskName) {
      let response, error;
      try {
        response = await handler(data.params);
      } catch (e) {
        error = e;
      }
      scope.postMessage(
        /** @type {WorkerResponse} */ {
          taskName,
          requestId: data.requestId,
          ...(response && { response }),
          ...(error && { error }),
        }
      );
    }
  };
  scope.addEventListener('message', eventListener);
}
