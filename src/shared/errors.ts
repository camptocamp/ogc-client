export class EndpointError extends Error {
  constructor(
    public message: string,
    public httpStatus?: number,
    public isCrossOriginRelated?: boolean
  ) {
    super(message);
  }
}
