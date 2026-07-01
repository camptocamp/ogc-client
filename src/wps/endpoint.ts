import { parseWpsCapabilities } from '../worker/index.js';
import { useCache } from '../shared/cache.js';
import {
  postXmlDocument,
  queryXmlDocument,
  setQueryParams,
} from '../shared/http-utils.js';
import {
  type HttpMethod,
  type OperationName,
  type OperationUrl,
} from '../shared/models.js';
import {
  WpsEndpointInfo,
  WpsExecuteOptions,
  WpsExecuteResponse,
  WpsProcessFull,
  WpsProcessSummary,
  WpsVersion,
} from './model.js';
import { generateDescribeProcessUrl } from './url.js';
import { parseDescribeProcessResponse } from './describeprocess.js';
import { buildExecuteRequest, parseExecuteResponse } from './execute.js';

/**
 * Represents a WPS endpoint advertising a set of processes.
 */
export default class WpsEndpoint {
  private _capabilitiesUrl: string;
  private _capabilitiesPromise: Promise<void>;
  private _info: WpsEndpointInfo | null;
  private _processes: WpsProcessSummary[] | null;
  private _url: Record<OperationName, OperationUrl>;
  private _version: WpsVersion | null;

  /**
   * @param url WPS endpoint url; can contain any query parameters, these will be used to
   *   initialize the endpoint
   */
  constructor(url: string) {
    this._capabilitiesUrl = setQueryParams(url, {
      SERVICE: 'WPS',
      REQUEST: 'GetCapabilities',
    });

    /**
     * This fetches the capabilities doc and parses its contents
     */
    this._capabilitiesPromise = useCache(
      () => parseWpsCapabilities(this._capabilitiesUrl),
      'WPS',
      'CAPABILITIES',
      this._capabilitiesUrl
    ).then(({ info, processes, url, version }) => {
      this._info = info;
      this._processes = processes;
      this._url = url;
      this._version = version;
    });
  }

  /**
   * Resolves when the endpoint is ready to use. Returns the same endpoint object for convenience.
   * @throws {EndpointError}
   */
  isReady() {
    return this._capabilitiesPromise.then(() => this);
  }

  /**
   * Returns the service information.
   */
  getServiceInfo() {
    return this._info;
  }

  /**
   * Returns the WPS version advertised by this endpoint.
   */
  getVersion() {
    return this._version;
  }

  /**
   * Returns an array of processes advertised by the service, in summary format.
   */
  getProcesses() {
    return this._processes;
  }

  /**
   * Returns the summary of a process by its identifier, or null if not found.
   */
  getProcessSummary(processId: string): WpsProcessSummary | null {
    if (!this._processes) return null;
    return (
      this._processes.find((process) => process.identifier === processId) ??
      null
    );
  }

  /**
   * Returns the URL reported by the WPS for the given operation
   * @param operationName e.g. Execute, DescribeProcess, GetCapabilities
   * @param method HTTP method
   */
  getOperationUrl(operationName: OperationName, method: HttpMethod = 'Get') {
    if (!this._url) {
      return null;
    }
    return this._url[operationName]?.[method];
  }

  /**
   * Returns the Capabilities URL used to initialize the endpoint.
   */
  getCapabilitiesUrl() {
    return this._capabilitiesUrl;
  }

  /**
   * Performs a DescribeProcess request for the given process and returns its
   * full description (inputs, outputs, supported formats).
   * @param processId Process identifier to describe
   */
  describeProcess(processId: string): Promise<WpsProcessFull | null> {
    return useCache(
      () => {
        const url = generateDescribeProcessUrl(
          this._reproxyUrl(this.getOperationUrl('DescribeProcess')) ||
            this._capabilitiesUrl,
          this._version,
          processId
        );
        return queryXmlDocument(url).then((doc) =>
          parseDescribeProcessResponse(doc, processId)
        );
      },
      'WPS',
      'DESCRIBEPROCESS',
      this._capabilitiesUrl,
      processId
    );
  }

  /**
   * Executes a process (POST XML). Fetches the process description first in
   * order to type the inputs.
   * @param processId Process identifier to execute
   * @param options Execution options (inputs, outputs, response form flags)
   */
  async execute(
    processId: string,
    options: WpsExecuteOptions
  ): Promise<WpsExecuteResponse> {
    const process = await this.describeProcess(processId);
    if (!process) {
      throw new Error(`Process '${processId}' was not found in this endpoint`);
    }
    const body = buildExecuteRequest(process, options, this._version);
    const executeUrl =
      this._reproxyUrl(this.getOperationUrl('Execute', 'Post')) ||
      this._capabilitiesUrl;
    return postXmlDocument(executeUrl, body).then(parseExecuteResponse);
  }

  /**
   * Polls the status of an asynchronous execution.
   * @param statusLocation The statusLocation URL returned by execute()
   */
  getStatus(statusLocation: string): Promise<WpsExecuteResponse> {
    return queryXmlDocument(this._reproxyUrl(statusLocation)).then(
      parseExecuteResponse
    );
  }

  /**
   * Operation URLs come from the raw `xlink:href` of the capabilities, so they
   * point directly at the service. If the endpoint was created with a proxied
   * URL, re-apply the same proxy prefix so requests keep going through it
   * (otherwise a direct request would bypass the proxy and fail on CORS).
   */
  private _reproxyUrl(url: string): string {
    if (!url) return url;
    // detect the proxy prefix in the capabilities URL (everything before the
    // first encoded "http://" / "https://")
    const match = this._capabilitiesUrl.match(/^(.*?)(https?%3A%2F%2F)/i);
    const prefix = match ? match[1] : '';
    // don't re-proxy an URL that is already proxied
    if (!prefix || url.startsWith(prefix)) return url;
    return prefix + encodeURIComponent(url);
  }
}
