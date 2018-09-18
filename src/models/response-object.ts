export class ResponseObject {
    public data: any;
    public statusCode: number;

    constructor(statusCode: number, data: any = null) {
        this.statusCode = statusCode;
        this.data = data;
    }
}
