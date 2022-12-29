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
export function sendTaskRequest(taskName: string, workerInstance: Worker | null, params: any): Promise<any>;
/**
 * @param {string} taskName
 * @param {DedicatedWorkerGlobalScope|Window} scope
 * @param {function(params: Object):Promise<Object>} handler
 */
export function addTaskHandler(taskName: string, scope: DedicatedWorkerGlobalScope | Window, handler: (arg0: params, arg1: any) => Promise<any>): void;
export type WorkerRequest = {
    requestId: number;
    taskName: string;
    params: any;
};
export type WorkerResponse = {
    requestId: number;
    error?: any;
    response?: any;
};
