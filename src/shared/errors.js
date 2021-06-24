export class EndpointError {
  /**
   * @param {string} message
   * @param {number} httpStatus
   * @param {boolean} isCrossOriginRelated
   */
  constructor(message, httpStatus = 0, isCrossOriginRelated = false) {
    this.message = message;
    this.httpStatus = httpStatus;
    this.isCrossOriginRelated = isCrossOriginRelated;
  }
}
