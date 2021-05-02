export class EndpointError extends Error {
  /**
   * @param {string} message
   * @param {number} httpStatus
   * @param {boolean} isCrossOriginRelated
   */
  constructor(message, httpStatus = 0, isCrossOriginRelated = false) {
    super(message);
    this.httpStatus = httpStatus;
    this.isCrossOriginRelated = isCrossOriginRelated;
  }
}
