import { getUniqueId } from '../shared/id.js';
import { decodeError, encodeError } from '../shared/errors.js';

type TaskParams = Record<string, unknown>;
type TaskResponse = Record<string, unknown>;

export type WorkerRequest = {
  requestId: number;
  taskName: string;
  params: TaskParams;
};

export type WorkerResponse = {
  requestId: number;
  error?: Record<string, unknown>;
  response?: TaskResponse;
};

export function sendTaskRequest<T>(
  taskName: string,
  workerInstance: Worker,
  params: TaskParams
): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestId = getUniqueId();
    const request: WorkerRequest = {
      requestId,
      taskName,
      params,
    };
    if (workerInstance === null) {
      globalThis.dispatchEvent(
        new CustomEvent('ogc-client.request', {
          detail: request,
        })
      );
    } else {
      workerInstance.postMessage(request);
    }

    const handler = (response: WorkerResponse) => {
      if (response.requestId === requestId) {
        if (workerInstance === null) {
          globalThis.removeEventListener('message', windowHandler);
        } else {
          workerInstance.removeEventListener('message', workerHandler);
        }
        if ('error' in response) {
          reject(decodeError(response.error));
        } else {
          resolve(response.response as T);
        }
      }
    };
    const windowHandler = (event) => handler(event.detail);
    const workerHandler = (event) => handler(event.data);

    if (workerInstance === null) {
      globalThis.addEventListener('ogc-client.response', windowHandler);
    } else {
      workerInstance.addEventListener('message', workerHandler);
    }
  });
}

/**
 * @param {string} taskName
 * @param {DedicatedWorkerGlobalScope|Window} scope
 * @param {function(params: Object):Promise<Object>} handler
 */
export function addTaskHandler(
  taskName: string,
  scope: DedicatedWorkerGlobalScope | Window | typeof globalThis,
  handler: (params: TaskParams) => Promise<TaskResponse>
) {
  const useWorker = typeof WorkerGlobalScope !== 'undefined';

  const eventHandler = async (request: WorkerRequest) => {
    if (request.taskName === taskName) {
      let response, error;
      try {
        response = await handler(request.params);
      } catch (e) {
        error = encodeError(e);
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
    scope.addEventListener('message', (event) => eventHandler(event.data));
  } else {
    scope.addEventListener('ogc-client.request', (event) =>
      eventHandler(event.detail)
    );
  }
}
