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
 * @param {Worker|null} workerInstance
 * @param {Object} params
 * @return {Promise<Object>}
 */
export function sendTaskRequest(taskName, workerInstance, params) {
  return new Promise((resolve, reject) => {
    const requestId = getUniqueId();
    const request = /** @type {WorkerRequest} */ {
      requestId,
      taskName,
      params,
    };
    if (workerInstance === null) {
      window.dispatchEvent(
        new CustomEvent('ogc-client.request', {
          detail: request,
        })
      );
    } else {
      workerInstance.postMessage(request);
    }
    /**
     * Workers either with or without a worker
     * @param {WorkerResponse} [detail]
     * @param {WorkerResponse} [data]
     */
    const handler = ({ detail, data }) => {
      const response = detail || data;
      if (response.requestId === requestId) {
        if (workerInstance === null) {
          window.removeEventListener('message', handler);
        } else {
          workerInstance.removeEventListener('message', handler);
        }
        if ('error' in response) {
          reject(response.error);
        } else {
          resolve(response.response);
        }
      }
    };
    if (workerInstance === null) {
      window.addEventListener('ogc-client.response', handler);
    } else {
      workerInstance.addEventListener('message', handler);
    }
  });
}

/**
 * @param {string} taskName
 * @param {DedicatedWorkerGlobalScope|Window} scope
 * @param {function(params: Object):Promise<Object>} handler
 */
export function addTaskHandler(taskName, scope, handler) {
  const useWorker = typeof WorkerGlobalScope !== 'undefined';
  /**
   * Workers either with or without a worker
   * @param {WorkerRequest} [detail]
   * @param {WorkerRequest} [data]
   */
  const eventHandler = async ({ detail, data }) => {
    const request = detail || data;
    if (request.taskName === taskName) {
      let response, error;
      try {
        response = await handler(request.params);
      } catch (e) {
        error = e;
      }
      const message = /** @type {WorkerResponse} */ {
        taskName,
        requestId: request.requestId,
        ...(response && { response }),
        ...(error && { error }),
      };
      if (useWorker) {
        scope.postMessage(message);
      } else {
        scope.dispatchEvent(
          new CustomEvent('ogc-client.response', {
            detail: message,
          })
        );
      }
    }
  };
  if (useWorker) {
    scope.addEventListener('message', eventHandler);
  } else {
    scope.addEventListener('ogc-client.request', eventHandler);
  }
}
