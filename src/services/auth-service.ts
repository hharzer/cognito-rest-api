import { Injectable } from "injection-js";
import * as svc from "./index";
import { IAuthorizationResult, ICognitoSetting } from "../models";
import { JWTValidation } from "../utils/jwt-validation";
import * as db from "../db";


@Injectable()
export class AuthService {

    constructor(private loggingService: svc.LoggingService, private cacheService: svc.CacheService, private tokenLoggingService: svc.TokenLoggingService) {


    }

    public async validateAccessToken(accessToken: string): Promise<IAuthorizationResult> {

        let cognitoSettings: ICognitoSetting = JSON.parse(process.env.COGNITO_SETTINGS);
        let publicKeys: any = JSON.parse(process.env.COGNITO_PUBLIC_KEYS);

        let val: IAuthorizationResult = JWTValidation.validateToken(accessToken, cognitoSettings, process.env.AWS_REGION, publicKeys);

        if (val.isAuthenticated) {

            let [isBlackListed, rights] = await Promise.all(
                [
                    this.tokenLoggingService.isTokenBlackListed(val.jwtId),
                    this.getUserRights(val.userUuid)
                ]
            );

            if (isBlackListed) {

                val.isAuthenticated = false;
                val.errorCode = "TokenBlacklisted";

            } else {

                val.rights = rights;
            }

        }

        return val;


    }


    public async getUserRights(userUuid: string): Promise<string[]> {

        let cacheKey: string = `getUserRights_${userUuid}`;

        let rights: string[] = await this.cacheService.get(cacheKey);

        if (!rights) {

            let userDB: db.UserDB = new db.UserDB();
            rights = await userDB.getUserRights(userUuid);
            await this.cacheService.set(cacheKey, rights, 1200);
        }

        return rights;

    }
}
