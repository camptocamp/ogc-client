export class EndpointError {
    /**
     * @param {string} message
     * @param {number} httpStatus
     * @param {boolean} isCrossOriginRelated
     */
    constructor(message: string, httpStatus?: number, isCrossOriginRelated?: boolean);
    message: string;
    httpStatus: number;
    isCrossOriginRelated: boolean;
}
