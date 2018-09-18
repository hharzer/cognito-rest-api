import { Injector } from "injection-js";
import * as svc from "../services";
import * as express from "express";
import { IAuthorizationResult } from "../models";
import { Route, Request, Controller, SuccessResponse, Post } from "tsoa";
import { getJWTFromHeader } from "../utils/route-security";

@Route("/auth")
export class AuthController extends Controller {

    private loggingService: svc.LoggingService;
    private authService: svc.AuthService;


    constructor(injector: Injector, private authorizationResult: IAuthorizationResult) {
        super();
        this.loggingService = injector.get(svc.LoggingService);
        this.authService = injector.get(svc.AuthService);

    }

    @Post("/validate-token")
    @SuccessResponse(200)
    public async validateToken(@Request() req: express.Request): Promise<IAuthorizationResult> {

        const token: string = getJWTFromHeader(req);

        this.loggingService.debug("ValidateToken", "Validate Token Called");

        return this.authService.validateAccessToken(token);

    }
}
