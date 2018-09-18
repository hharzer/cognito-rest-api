import { Injector } from "injection-js";
import * as svc from "../services";
import { Constants } from "../utils";
import { IAuthorizationResult } from "../models";
import { Post, Route, Controller, SuccessResponse, Query, Body } from "tsoa";



@Route("/log")
export class LogController extends Controller {

    private loggingService: svc.LoggingService;

    constructor(injector: Injector, private authorizationResult: IAuthorizationResult) {
        super();
        this.loggingService = injector.get(svc.LoggingService);

    }


    /** Log body to server logs, typically used by UI component */
    @Post()
    @SuccessResponse(204)
    public async log(@Body() body: any, @Query() level: string): Promise<void> {

        this.loggingService.log(level as Constants.LogService.Levels, "ClientLogging", body);

        this.setStatus(204);

    }
}
