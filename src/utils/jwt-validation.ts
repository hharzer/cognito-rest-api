import { decode, TokenExpiredError, verify } from "jsonwebtoken";
import * as fs from "fs";
import { IAuthorizationResult, ICognitoSetting } from "../models";
const jwkToPem = require("jwk-to-pem");

export class JWTValidation {

    // private static getClientAppSettings(decodedToken: any, clientAppSettings: IClientAppSetting[]): IClientAppSetting {
    //     return clientAppSettings.find((x) => x.clientId === decodedToken.payload.client_id);
    // }

    public static decodeToken(token: string): any {
        return decode(token, { complete: true });
    }

    public static validateToken(token: string, clientAppSetting: ICognitoSetting, region: string, publicKeys: any): IAuthorizationResult {

        if (!token || token.length === 0) {

            return {
                isAuthenticated: false,
                errorCode: "TokenNotProvided"
            } as IAuthorizationResult;

        }

        let decodedToken: any = JWTValidation.decodeToken(token);

        if (!decodedToken) {

            return {
                isAuthenticated: false,
                errorCode: "FailedToDecodeToken"
            } as IAuthorizationResult;

        } else {


            if (!clientAppSetting) {

                return {
                    isAuthenticated: false,
                    errorCode: "ClientAppSettingsMissing"
                } as IAuthorizationResult;


            } else {

                // Test according AWS Cognito recommendations
                // https://aws.amazon.com/premiumsupport/knowledge-center/decode-verify-cognito-json-token/

                if (decodedToken.payload.token_use !== "access") {

                    return {
                        isAuthenticated: false,
                        errorCode: "TokenUseMismatch"
                    } as IAuthorizationResult;

                } else {

                    if (decodedToken.payload.iss !== `https://cognito-idp.${region}.amazonaws.com/${clientAppSetting.poolId}`) {

                        return {
                            isAuthenticated: false,
                            errorCode: "TokenIssuerNotAuthorized"
                        } as IAuthorizationResult;

                    } else {

                        // find the relevant pool ID key file.
                        // const jwks: any = JSON.parse(fs.readFileSync(`./keys/jwks-${clientAppSetting.poolId}.json`, { encoding: "utf-8" }));

                        // find the correct key inside the file
                        const jwk: any = publicKeys.keys.find((x) => x.kid === decodedToken.header.kid);

                        // convert to pem
                        const pem = jwkToPem(jwk);

                        // verify signature and expiration
                        try {
                            verify(token, pem, { clockTolerance: 10 });

                            // success
                            return {
                                isAuthenticated: true,
                                clientName: clientAppSetting.name,
                                userUuid: decodedToken.payload.username,
                                jwtId: decodedToken.payload.jti
                            } as IAuthorizationResult;

                        } catch (ex) {

                            if (ex instanceof TokenExpiredError) {

                                return {
                                    isAuthenticated: false,
                                    errorCode: "TokenExpired",
                                    jwtId: decodedToken.payload.jti,
                                    userUuid: decodedToken.payload.username,
                                } as IAuthorizationResult;

                            } else {

                                return {
                                    isAuthenticated: false,
                                    errorCode: "TokenNotValid"
                                } as IAuthorizationResult;
                            }

                        }
                    }
                }
            }

        }
    }
}

