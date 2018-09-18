import { Injectable } from "injection-js";
import { IUser, IServerMessage, ResponseObject, IAuthorizationResult, ICognitoSetting } from "../models";
import { Constants, JWTValidation } from "../utils";
import * as AWS from "aws-sdk";
import * as svc from "./index";
import * as db from "../db";


@Injectable()
export class UserService {

    constructor(private loggingService: svc.LoggingService, private cognitoService: svc.CognitoService,
        private authService: svc.AuthService, private tokenLoggingService: svc.TokenLoggingService,
        private cacheService: svc.CacheService) {

    }


    public async userSignup(email: string, password: string, phoneNumber: string, firstName: string, lastName: string, language: string, ipAddress: string = null): Promise<ResponseObject> {

        email = email.toLowerCase();

        let userDB: db.UserDB = new db.UserDB();

        let existingUser: IUser = await userDB.getByEmail(email);

        if (existingUser) {
            return new ResponseObject(400, { message: Constants.UserService.ErrorCodes.userAlreadyExists, isUserError: true } as IServerMessage);
        }

        let response: ResponseObject = await this.cognitoService.userSignup(email, password, phoneNumber, firstName, lastName, language, ipAddress);

        if (response.statusCode === 201) {

            let user: IUser = {

                uuid: response.data,
                email: email,
                phoneNumber: phoneNumber,
                firstName: firstName,
                lastName: lastName,
                language: language

            } as IUser;

            await userDB.insertUser(user);

            return new ResponseObject(201, { uuid: user.uuid });

        } else {
            return response;

        }
    }


    public async verifyUserEmail(email: string, confirmationCode: string, ipAddress: string): Promise<ResponseObject> {

        let response: ResponseObject = await this.cognitoService.verifyUserEmail(email, confirmationCode, ipAddress);

        if (response.statusCode === 200) {

            email = email.toLowerCase();
            let userDB: db.UserDB = new db.UserDB();
            await userDB.setEmailVerified(email);
        }

        return response;
    }


    public async respondSMSAuthChallenge(userUuid: string, session: string, confirmationCode: string, ipAddress: string): Promise<ResponseObject | AWS.CognitoIdentityServiceProvider.RespondToAuthChallengeResponse> {

        return this.cognitoService.respondSMSAuthChallenge(userUuid, session, confirmationCode, ipAddress);

    }


    public async initiateAuthRequest(email: string, password: string, ipAddress: string): Promise<ResponseObject | AWS.CognitoIdentityServiceProvider.InitiateAuthResponse> {

        let response: AWS.CognitoIdentityServiceProvider.InitiateAuthResponse | ResponseObject = await this.cognitoService.initiateAuthRequest(email, password, ipAddress);

        if (response instanceof ResponseObject) {

            return response;

        } else {

            let cognitoResponse: AWS.CognitoIdentityServiceProvider.InitiateAuthResponse = response;
            if (cognitoResponse.AuthenticationResult && cognitoResponse.AuthenticationResult.AccessToken) {

                let decodedToken: any = JWTValidation.decodeToken(cognitoResponse.AuthenticationResult.AccessToken);

                await this.tokenLoggingService.insertIssuedToken(decodedToken.payload.jti, decodedToken.payload.username, ipAddress);
            }

            return cognitoResponse;

        }
    }

    public async updateUser(accessToken: string, user: IUser, authResult: IAuthorizationResult): Promise<ResponseObject> {

        if (authResult.userUuid !== user.uuid) {
            return new ResponseObject(400, { message: "WrongUserForAccessToken", isUserError: true } as IServerMessage);
        }

        let response: ResponseObject = await this.cognitoService.updateUser(accessToken, user.phoneNumber, user.firstName, user.lastName, user.language);

        if (response.statusCode === 200) {

            let userDB: db.UserDB = new db.UserDB();

            let oldUser: IUser = await userDB.getByUuid(user.uuid);

            if (!oldUser) {
                return new ResponseObject(404, { message: "UserNotFoundInDB", isUserError: true } as IServerMessage);
            }

            // note - limit the properties allowed to be updated.
            oldUser.phoneNumber = user.phoneNumber;
            oldUser.firstName = user.firstName;
            oldUser.lastName = user.lastName;
            oldUser.language = user.language;

            await userDB.updateUser(oldUser);

            let newUser: IUser = await userDB.getByUuid(user.uuid);
            return new ResponseObject(200, newUser);

        } else {

            return response;
        }
    }


    public async signout(accessToken: string): Promise<void> {

        let authResult: IAuthorizationResult = await this.authService.validateAccessToken(accessToken);

        if (authResult.isAuthenticated) {

            await this.cognitoService.signout(accessToken);

            await this.tokenLoggingService.insertBlacklistedToken(authResult.jwtId);
        }
    }


    public async setSmsTOTP(accessToken: string, enabled: boolean, userUuid: string): Promise<void> {

        await this.cognitoService.setSmsTOTP(accessToken, enabled);

        let userDB: db.UserDB = new db.UserDB();

        let user: IUser = await userDB.getByUuid(userUuid);

        user.mfaType = enabled ? Constants.UserService.MFATypes.sms : Constants.UserService.MFATypes.none;

        await userDB.updateUser(user);

    }

    public async forgotPassword(email: string, ipAddress: string): Promise<ResponseObject> {

        let response: ResponseObject = await this.cognitoService.forgotPassword(email, ipAddress);
        // this.loggingService.info("ForgotPassword", { "email": email, "statusCode": response.statusCode, "response": response.data });
        return response;

    }

    public async confirmForgotPassword(email: string, confirmationCode: string, password: string, ipAddress: string): Promise<ResponseObject> {

        let response: ResponseObject = await this.cognitoService.confirmForgotPassword(email, confirmationCode, password, ipAddress);
        // this.loggingService.info("confirmForgotPassword", { "email": email, "statusCode": response.statusCode, "response": response.data });
        return response;

    }


    public async changePassword(accessToken: string, previousPassword: string, proposedPassword: string): Promise<ResponseObject> {

        let response: ResponseObject = await this.cognitoService.changePassword(previousPassword, proposedPassword, accessToken);
        // this.loggingService.info("changePassword", { "statusCode": response.statusCode, "response": response.data });
        return response;
    }


    public async resendConfirmationCode(email: string, ipAddress: string): Promise<ResponseObject> {

        let response: ResponseObject = await this.cognitoService.resendConfirmationCode(email, ipAddress);
        // this.loggingService.info("resendConfirmationCode", { "statusCode": response.statusCode, "response": response.data });
        return response;
    }


    public async getUser(userUuid: string): Promise<IUser> {

        let userDB: db.UserDB = new db.UserDB();

        return userDB.getByUuid(userUuid);

    }


    public async refreshToken(refreshToken: string, accessToken: string, ipAddress: string): Promise<ResponseObject> {

        /**
         *  The system needs to check:
         *
         *  1. access token is authenticated, or if just expired then issued less than 2 hours ago.
         *  2. access token is not blacklisted.
         *  3. token associated to refresh token user.  We check this by looking at the newly issued token - to make sure username matches the old access token.
         *
         */

        try {

            let cognitoSettings: ICognitoSetting = JSON.parse(process.env.COGNITO_SETTINGS);
            let publicKeys: any = JSON.parse(process.env.COGNITO_PUBLIC_KEYS);
            let oldTokenVal: IAuthorizationResult = JWTValidation.validateToken(accessToken, cognitoSettings, process.env.AWS_REGION, publicKeys);

            if (await this.isAccessTokenUsedForRefreshSuitable(oldTokenVal)) {

                let response: AWS.CognitoIdentityServiceProvider.InitiateAuthResponse | ResponseObject = await this.cognitoService.refreshToken(refreshToken, ipAddress);

                if (response instanceof ResponseObject) {

                    // return any errors from the congito refresh token operation
                    return response;

                } else {

                    let cognitoResponse: AWS.CognitoIdentityServiceProvider.InitiateAuthResponse = response;

                    if (cognitoResponse.AuthenticationResult && cognitoResponse.AuthenticationResult.AccessToken) {

                        let decodedNewToken: any = JWTValidation.decodeToken(cognitoResponse.AuthenticationResult.AccessToken);

                        // now decode the new access token - username must match.
                        if (oldTokenVal.userUuid !== decodedNewToken.payload.username) {
                            return new ResponseObject(400, { message: "AccessTokenNotIssuedToUser", isUserError: false } as IServerMessage);
                        }

                        await this.tokenLoggingService.insertBlacklistedToken(oldTokenVal.jwtId);

                        await this.tokenLoggingService.insertIssuedToken(decodedNewToken.payload.jti, decodedNewToken.payload.username, ipAddress);

                        return new ResponseObject(200, response.AuthenticationResult.AccessToken);

                    } else {

                        this.loggingService.error("refreshToken", "Cognito did not issue token");
                        return new ResponseObject(500, { message: "InternalServerError", isUserError: false } as IServerMessage);
                    }
                }
            } else {
                this.loggingService.info("refreshToken", `AccessTokenNotSuitable: ${oldTokenVal.jwtId}`);
                return new ResponseObject(400, { message: "AccessTokenNotSuitable", isUserError: false } as IServerMessage);
            }


        } catch (ex) {
            this.loggingService.error("refreshToken", ex);
            return new ResponseObject(500, { message: "InternalServerError", isUserError: false } as IServerMessage);
        }

    }


    private async isAccessTokenUsedForRefreshSuitable(oldTokenVal: IAuthorizationResult): Promise<boolean> {

        let result: boolean = true;

        if (oldTokenVal.isAuthenticated || (!oldTokenVal.isAuthenticated && oldTokenVal.errorCode === "TokenExpired")) {

            if (await this.tokenLoggingService.isTokenBlackListed(oldTokenVal.jwtId)) {
                result = false;
            }

            let ageHours: number = await this.tokenLoggingService.getJtiIssuedAge(oldTokenVal.jwtId);
            if (ageHours === undefined || ageHours >= 2) {
                result = false;
            }

        } else {
            result = false;

        }

        if (!result) {
            this.loggingService.info("isAccessTokenUsedForRefreshSuitable", oldTokenVal);
        }

        return result;
    }
}


