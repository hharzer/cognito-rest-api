import { Injector } from "injection-js/injector";
import { NextFunction, Request, Response } from "express";
import { IAuthorizationResult } from "../models";

import * as svc from "../services";


export function getIpFromHeader(req: Request): string {

    let addressHeader: string | string[] = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    return Array.isArray(addressHeader) ? addressHeader[0] : addressHeader;
}

export function getJWTFromHeader(req: Request): string {

    let authorizationHeader: string | string[] = req.headers.authorization;
    let authorizationHeaderStr: string = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;

    if (authorizationHeaderStr && authorizationHeaderStr.indexOf("Bearer ") > -1) {
        authorizationHeaderStr = authorizationHeaderStr.substr(7);
    }

    return authorizationHeaderStr;

}


export function expressAuthentication() {

    return async function (req: Request, res: Response, next: NextFunction) {

        const token: string = getJWTFromHeader(req);

        const injector: Injector = req.app.locals.container;
        let authService: svc.AuthService = injector.get(svc.AuthService);
        let loggingService: svc.LoggingService = injector.get(svc.LoggingService);

        try {

            const authResult: IAuthorizationResult = await authService.validateAccessToken(token);

            if (authResult.isAuthenticated) {

                // store userUuid in httpcontext
                const httpContext = require("express-http-context");
                httpContext.set("userUuid", authResult.userUuid);

                res.locals.authorizationResult = authResult;
                next();

            } else {

                return res.status(401).send({ message: authResult.errorCode });

            }
        } catch (ex) {

            loggingService.error("expressAuthentication", ex);
            return res.status(500).send({ message: "An error occurred authorizing user" });
        }

    };

}




