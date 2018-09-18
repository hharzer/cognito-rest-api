import { Injectable } from "injection-js";
import * as svc from "..";
import { IAuthorizationResult } from "../../models";


@Injectable()
export class ClientAuthServiceFailureMock {

    constructor(private loggingService: svc.LoggingService) {


    }

    public async validateAccessToken(token: string, allowableClientApps: string[]): Promise<IAuthorizationResult> {

        return {
            isAuthenticated: false,
            errorCode: "TokenNotProvided"
        } as IAuthorizationResult;

    }
}
