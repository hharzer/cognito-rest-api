import { Injectable } from "injection-js";
import * as AWS from "aws-sdk";
import { ICognitoSetting } from "../models/cognito-setting";
import { ResponseObject, IServerMessage } from "../models";
import { Constants } from "../utils";
import * as svc from ".";


@Injectable()
export class CognitoService {

    private cogApi: AWS.CognitoIdentityServiceProvider;

    constructor(private loggingService: svc.LoggingService) {

        this.cogApi = new AWS.CognitoIdentityServiceProvider({ apiVersion: "2016-04-19", region: process.env.AWS_REGION });

    }


    public async userSignup(emailAddress: string, password: string, phoneNumber: string, firstName: string, lastName: string, language: string, ipAddress: string = null): Promise<ResponseObject> {
        {

            let signUpRequest: AWS.CognitoIdentityServiceProvider.Types.SignUpRequest = {
                Username: emailAddress,
                ClientId: this.getCognitoClientId(),
                Password: password,
                UserAttributes: [
                    { Name: "email", Value: emailAddress },
                    { Name: "phone_number", Value: phoneNumber },
                    { Name: "family_name", Value: lastName },
                    { Name: "given_name", Value: firstName },
                    { Name: "custom:language", Value: language }
                ]
            };

            if (ipAddress) {
                signUpRequest.UserContextData = {
                    EncodedData: ipAddress
                };
            }

            try {
                let response: AWS.CognitoIdentityServiceProvider.SignUpResponse = await this.cogApi.signUp(signUpRequest).promise();
                return new ResponseObject(201, response.UserSub);

            } catch (ex) {

                if (ex.code) {

                    switch (ex.code) {

                        case Constants.UserService.ErrorCodes.invalidPasswordException:
                            return new ResponseObject(400, { message: Constants.UserService.ErrorCodes.invalidPasswordException, isUserError: true } as IServerMessage);

                        case Constants.UserService.ErrorCodes.invalidParameterException:

                            if (ex.message === "Invalid phone number format.") {
                                return new ResponseObject(400, { message: Constants.UserService.ErrorCodes.invalidPhoneNumber, isUserError: true } as IServerMessage);
                            }

                            if (ex.message === "Invalid email address format.") {
                                return new ResponseObject(400, { message: Constants.UserService.ErrorCodes.invalidEmail, isUserError: true } as IServerMessage);
                            }

                            this.loggingService.error("signup", ex);
                            return new ResponseObject(400, { message: "Unknown parameter exception", isUserError: true } as IServerMessage);

                        default:
                            this.loggingService.error("signup", ex);
                            return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                    }

                } else {

                    this.loggingService.error("signup", ex);
                    return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);

                }
            }
        }
    }


    public async verifyUserEmail(email: string, confirmationCode: string, ipAddress: string = null): Promise<ResponseObject> {

        let confirmSignUpRequest: AWS.CognitoIdentityServiceProvider.Types.ConfirmSignUpRequest = {
            ClientId: this.getCognitoClientId(),
            Username: email,
            ConfirmationCode: confirmationCode
        };

        if (ipAddress) {
            confirmSignUpRequest.UserContextData = {
                EncodedData: ipAddress
            };
        }


        try {
            await this.cogApi.confirmSignUp(confirmSignUpRequest).promise();
            return new ResponseObject(200);

        } catch (ex) {

            if (ex.code) {

                switch (ex.code) {

                    case Constants.UserService.ErrorCodes.userNotFoundException:
                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                    case Constants.UserService.ErrorCodes.codeMismatchException:
                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                    default:
                        this.loggingService.error("verifyUser", ex);
                        return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                }

            } else {

                this.loggingService.error("verifyUser", ex);
                return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);

            }
        }
    }


    public async setSmsTOTP(accessToken: string, enabled: boolean): Promise<AWS.CognitoIdentityServiceProvider.Types.InitiateAuthResponse> {
        {

            if (enabled) {

                // Set SMS as an MFA option for this user.  (required when MFA is optional for pool)
                let smsResponse: AWS.CognitoIdentityServiceProvider.Types.SetUserSettingsResponse = await this.cogApi.setUserSettings({
                    AccessToken: accessToken,
                    MFAOptions: [{
                        DeliveryMedium: "SMS",
                        AttributeName: "phone_number"
                    }]
                }).promise();
            }


            let response: AWS.CognitoIdentityServiceProvider.Types.SetUserMFAPreferenceResponse = await this.cogApi.setUserMFAPreference({
                AccessToken: accessToken,
                SMSMfaSettings: {
                    PreferredMfa: true,
                    Enabled: enabled
                }
            }).promise();

            return response;

        }

    }


    public async respondSMSAuthChallenge(userId: string, session: string, confirmationCode: string, ipAddress: string): Promise<ResponseObject | AWS.CognitoIdentityServiceProvider.Types.RespondToAuthChallengeResponse> {

        let req: AWS.CognitoIdentityServiceProvider.Types.RespondToAuthChallengeRequest = {
            ClientId: this.getCognitoClientId(),
            ChallengeName: "SMS_MFA",
            Session: session,
            ChallengeResponses: { SMS_MFA_CODE: confirmationCode, USERNAME: userId }
        };

        if (ipAddress) {
            req.UserContextData = {
                EncodedData: ipAddress
            };
        }

        try {
            let response = await this.cogApi.respondToAuthChallenge(req).promise();
            return response;

        } catch (ex) {

            if (ex.code) {

                switch (ex.code) {

                    case Constants.UserService.ErrorCodes.codeMismatchException:
                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                    default:
                        this.loggingService.error("respondSMSAuthChallenge", ex);
                        return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                }

            } else {

                this.loggingService.error("respondSMSAuthChallenge", ex);
                return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);

            }

        }

    }


    public async initiateAuthRequest(username: string, password: string, ipAddress: string = null): Promise<ResponseObject | AWS.CognitoIdentityServiceProvider.Types.InitiateAuthResponse> {
        {

            let initiateAuthRequest: AWS.CognitoIdentityServiceProvider.Types.InitiateAuthRequest = {
                AuthFlow: "USER_PASSWORD_AUTH",
                ClientId: this.getCognitoClientId(),
                AuthParameters: {
                    USERNAME: username,
                    PASSWORD: password
                }
            };

            if (ipAddress) {
                initiateAuthRequest.UserContextData = {
                    EncodedData: ipAddress
                };
            }

            try {

                let response: AWS.CognitoIdentityServiceProvider.Types.InitiateAuthResponse = await this.cogApi.initiateAuth(initiateAuthRequest).promise();
                return response;

            } catch (ex) {

                if (ex.code) {
                    switch (ex.code) {

                        case Constants.UserService.ErrorCodes.limitExceededException:
                            return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                        case Constants.UserService.ErrorCodes.notAuthorizedException:
                            return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                        case Constants.UserService.ErrorCodes.userNotConfirmedException:
                            return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                        case Constants.UserService.ErrorCodes.userNotFoundException:
                            // deliberately return not authorized exception so as not to indicate whether user exists or not
                            return new ResponseObject(400, { message: Constants.UserService.ErrorCodes.notAuthorizedException, isUserError: true } as IServerMessage);

                        default:
                            this.loggingService.error("initiateAuthRequest", ex);
                            return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                    }

                } else {

                    this.loggingService.error("initiateAuthRequest", ex);
                    return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                }

            }

        }

    }


    public async signout(accessToken: string): Promise<void> {
        await this.cogApi.globalSignOut({ AccessToken: accessToken }).promise();

    }


    public async confirmForgotPassword(email: string, confirmationCode: string, password: string, ipAddress: string = null): Promise<ResponseObject> {

        let request: AWS.CognitoIdentityServiceProvider.Types.ConfirmForgotPasswordRequest = {
            ClientId: this.getCognitoClientId(),
            ConfirmationCode: confirmationCode,
            Username: email,
            Password: password
        };

        if (ipAddress) {
            request.UserContextData = {
                EncodedData: ipAddress
            };
        }

        try {
            await this.cogApi.confirmForgotPassword(request).promise();
            return new ResponseObject(200);

        } catch (ex) {

            if (ex.code) {

                switch (ex.code) {

                    case Constants.UserService.ErrorCodes.limitExceededException:
                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                    case Constants.UserService.ErrorCodes.expiredCodeException:
                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                    default:
                        this.loggingService.error("confirmForgotPassword", ex);
                        return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                }

            } else {

                this.loggingService.error("confirmForgotPassword", ex);
                return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
            }

        }

    }


    public async changePassword(previousPassword: string, ProposedPassword: string, accessToken: string): Promise<ResponseObject> {

        let request: AWS.CognitoIdentityServiceProvider.Types.ChangePasswordRequest = {
            PreviousPassword: previousPassword,
            ProposedPassword: ProposedPassword,
            AccessToken: accessToken
        };

        try {

            await this.cogApi.changePassword(request).promise();
            return new ResponseObject(200, { message: "success", isUserError: false } as IServerMessage);

        } catch (ex) {

            if (ex.code) {

                switch (ex.code) {

                    case Constants.UserService.ErrorCodes.invalidParameterException:
                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                    // wrong previous password given
                    case Constants.UserService.ErrorCodes.notAuthorizedException:
                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                    default:
                        this.loggingService.error("confirmForgotPassword", ex);
                        return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                }

            } else {

                this.loggingService.error("confirmForgotPassword", ex);
                return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
            }
        }

    }


    public async forgotPassword(email: string, ipAddress: string = null): Promise<ResponseObject> {

        let request: AWS.CognitoIdentityServiceProvider.Types.ForgotPasswordRequest = {
            ClientId: this.getCognitoClientId(),
            Username: email
        };

        if (ipAddress) {
            request.UserContextData = {
                EncodedData: ipAddress
            };
        }

        try {
            await this.cogApi.forgotPassword(request).promise();

            return new ResponseObject(200, { message: "success", isUserError: false } as IServerMessage);

        } catch (ex) {

            if (ex.code) {

                switch (ex.code) {

                    case Constants.UserService.ErrorCodes.invalidParameterException:

                        //  ex.stack === "InvalidParameterException: Cannot reset password for the user as there is no registered/verified email or phone_number") {
                        this.loggingService.info("DD", ex.stack);
                        return this.resendConfirmationCode(email, ipAddress);

                    case Constants.UserService.ErrorCodes.limitExceededException:

                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);


                    case Constants.UserService.ErrorCodes.userNotFoundException:

                        // we want to hide the fact that the user doesn't exist so return a 200.
                        return new ResponseObject(200, { message: "success", isUserError: false } as IServerMessage);


                    default:
                        this.loggingService.error("forgotPassword", ex);
                        return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                }

            } else {
                this.loggingService.error("forgotPassword", ex);
                return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);

            }
        }
    }

    public async resendConfirmationCode(email: string, ipAddress: string = null): Promise<ResponseObject> {

        let request: AWS.CognitoIdentityServiceProvider.Types.ResendConfirmationCodeRequest = {
            ClientId: this.getCognitoClientId(),
            Username: email
        };

        if (ipAddress) {
            request.UserContextData = {
                EncodedData: ipAddress
            };
        }

        try {
            await this.cogApi.resendConfirmationCode(request).promise();
            return new ResponseObject(200, { message: "success", isUserError: false } as IServerMessage);

        } catch (ex) {

            if (ex.code) {
                switch (ex.code) {

                    case Constants.UserService.ErrorCodes.userNotFoundException:
                        return new ResponseObject(400, { message: Constants.UserService.ErrorCodes.userNotFoundException, isUserError: true } as IServerMessage);

                    case Constants.UserService.ErrorCodes.invalidParameterException:
                        return new ResponseObject(400, { message: Constants.UserService.ErrorCodes.invalidParameterException, isUserError: true } as IServerMessage);


                    default:
                        this.loggingService.error("resendConfirmationCode", ex);
                        return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                }

            } else {

                this.loggingService.error("resendConfirmationCode", ex);
                return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
            }

        }

    }


    public async refreshToken(refreshToken: string, ipAddress: string = null): Promise<ResponseObject | AWS.CognitoIdentityServiceProvider.Types.InitiateAuthResponse> {

        let initiateAuthRequest: AWS.CognitoIdentityServiceProvider.Types.InitiateAuthRequest = {
            AuthFlow: "REFRESH_TOKEN_AUTH",
            ClientId: this.getCognitoClientId(),
            AuthParameters: {
                REFRESH_TOKEN: refreshToken
            }
        };

        if (ipAddress) {
            initiateAuthRequest.UserContextData = {
                EncodedData: ipAddress
            };
        }

        try {

            let response: AWS.CognitoIdentityServiceProvider.Types.InitiateAuthResponse = await this.cogApi.initiateAuth(initiateAuthRequest).promise();
            return response;

        } catch (ex) {

            if (ex.code) {
                switch (ex.code) {

                    case Constants.UserService.ErrorCodes.notAuthorizedException:

                        // refresh token is not valid
                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                    default:
                        this.loggingService.error("refreshToken", ex);
                        return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                }

            } else {

                this.loggingService.error("refreshToken", ex);
                return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
            }

        }

    }

    public async updateUser(accessToken: string, phoneNumber: string, firstName: string, lastName: string, language: string): Promise<ResponseObject> {

        const params = {
            AccessToken: accessToken,
            UserAttributes: [
                {
                    Name: "phone_number",
                    Value: phoneNumber
                },
                {
                    Name: "given_name",
                    Value: firstName
                },
                {
                    Name: "family_name",
                    Value: lastName
                },
                {
                    Name: "custom:language",
                    Value: language
                }
            ]
        };

        try {

            await this.cogApi.updateUserAttributes(params).promise();
            return new ResponseObject(200);

        } catch (ex) {

            if (ex.code) {

                switch (ex.code) {

                    case Constants.UserService.ErrorCodes.invalidParameterException:
                        return new ResponseObject(400, { message: ex.code, isUserError: true } as IServerMessage);

                    default:
                        this.loggingService.error("updateUser", ex);
                        return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
                }

            } else {

                this.loggingService.error("updateUser", ex);
                return new ResponseObject(500, { message: Constants.UserService.ErrorCodes.internalServerError, isUserError: false } as IServerMessage);
            }

        }

    }



    private getCognitoClientId(): string {
        let clientApps: ICognitoSetting = JSON.parse(process.env.COGNITO_SETTINGS);
        return clientApps.clientId;
    }

}
