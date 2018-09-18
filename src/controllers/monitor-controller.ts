import { Injector } from "injection-js";
import * as svc from "../services";
import * as express from "express";
import { IAuthorizationResult } from "../models";
import { Constants, ControllerUtils } from "../utils";
import { Get, Route, Request, Controller, Post, Security, SuccessResponse } from "tsoa";


@Route("/monitor")
export class MonitorController extends Controller {

    private loggingService: svc.LoggingService;
    private tokenLoggingService: svc.TokenLoggingService;

    constructor(injector: Injector, private authorizationResult: IAuthorizationResult) {
        super();
        this.loggingService = injector.get(svc.LoggingService);
        this.tokenLoggingService = injector.get(svc.TokenLoggingService);

    }

    @Get()
    public async getServerDate(@Request() request: express.Request): Promise<any> {

        this.loggingService.info("monitor", "GetServerDate called");

        return { date: new Date() };
    }


    @Post("/clear-tokens")
    @Security("jwt")
    @SuccessResponse(200)
    public async clearExpiredTokens(): Promise<void> {

        if (ControllerUtils.hasRight(Constants.Authorization.Rights.system, this.authorizationResult)) {

            let rowsBlacklisted: number = await this.tokenLoggingService.deleteExpiredBlacklistedTokens(2);

            let rowsIssuedDeleted: number = await this.tokenLoggingService.deleteIssuedTokens(2);

            this.loggingService.info("monitor", `${rowsBlacklisted} blacklisted tokens deleted.  ${rowsIssuedDeleted} issued tokens deleted.`);

        } else {

            this.setStatus(403);
        }

    }

}
