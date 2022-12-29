export class EndpointError {
  constructor(
    public message: string,
    public httpStatus?: number,
    public isCrossOriginRelated?: boolean
  ) {}
}
