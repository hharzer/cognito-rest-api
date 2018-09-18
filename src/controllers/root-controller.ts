
import * as express from "express";
import { Get, Post, Route, Request, Example, SuccessResponse, Response, Body, BodyProp, Header, Security, Controller, Patch } from "tsoa";
import { Injector } from "injection-js";
import { IAuthorizationResult, IServerMessage, ResponseObject } from "../models";
import { getIpFromHeader, getJWTFromHeader } from "../utils/route-security";
import { Constants } from "../utils";
import { IUser } from "../models";

import * as svc from "../services";

@Route("/")

export class RootController extends Controller {

    private userService: svc.UserService;

    constructor(injector: Injector, private authorizationResult: IAuthorizationResult) {
        super();
        this.userService = injector.get(svc.UserService);
    }


    /** Initiate login - it may return tokens or a challenge request */
    @Post("/initiate-auth")
    @Example({
        ChallengeName: "SMS_MFA",
        Session: "KP-3TjuuG3cikDxCjF2lgd0Mog4--pGTMcfsGNYZBX9u3b99VN7hw3Q7ytz-Ps...",
        ChallengeParameters: {
            CODE_DELIVERY_DELIVERY_MEDIUM: "SMS",
            CODE_DELIVERY_DESTINATION: "+********2321",
            USER_ID_FOR_SRP: "b15dsdsdc-5223-440c-ae5e-73sdsdf26"
        }
    })
    @Response(400, Constants.UserService.ErrorCodes.notAuthorizedException, {
        isUserError: true,
        message: Constants.UserService.ErrorCodes.notAuthorizedException
    } as IServerMessage)

    public async initiateAuthRequest(@Request() req: express.Request, @BodyProp() email: string, @BodyProp() password: string): Promise<IServerMessage | AWS.CognitoIdentityServiceProvider.InitiateAuthResponse> {

        let response: ResponseObject | AWS.CognitoIdentityServiceProvider.InitiateAuthResponse = await this.userService.initiateAuthRequest(email, password, getIpFromHeader(req));

        if (response instanceof ResponseObject) {

            this.setStatus(response.statusCode);
            let serverMessage: IServerMessage = response.data;
            return serverMessage;

        } else {

            this.setStatus(200);
            let cognitoResponse: AWS.CognitoIdentityServiceProvider.InitiateAuthResponse = response;
            if (cognitoResponse.AuthenticationResult && cognitoResponse.AuthenticationResult.AccessToken) {

                delete cognitoResponse.AuthenticationResult.IdToken;

            }
            return response;
        }

    }



    @Post("/respond-sms-auth-challenge")
    @Example({ RefreshToken: "2g3T0hvZlJES2h2SlFzZ1d5SElRS0RDaU...", AccessToken: "eyJraWQiOiJOYjhUc2g3T0hvZlJES2h2SlFzZ1d5SElRS0RDaU...", ExpiresIn: 3600 })
    @Response(400, "Wrong confirmationCode provided", {
        isUserError: true,
        message: Constants.UserService.ErrorCodes.codeMismatchException
    } as IServerMessage)

    public async respondSMSAuthChallenge(@Request() req: express.Request, @BodyProp() userId: string, @BodyProp() confirmationCode: string, @BodyProp() session: string): Promise<IServerMessage | AWS.CognitoIdentityServiceProvider.RespondToAuthChallengeResponse> {

        const response: ResponseObject | AWS.CognitoIdentityServiceProvider.RespondToAuthChallengeResponse = await this.userService.respondSMSAuthChallenge(userId, session, confirmationCode, getIpFromHeader(req));
        if (response instanceof ResponseObject) {

            this.setStatus(response.statusCode);
            let serverMessage: IServerMessage = response.data;
            return serverMessage;

        } else {

            this.setStatus(200);
            return response;
        }
    }


    @Post("/verify-email")
    @SuccessResponse(204)
    @Response(400, "Wrong email entered", {
        isUserError: true,
        message: Constants.UserService.ErrorCodes.userNotFoundException
    } as IServerMessage)
    public async verifyUserEmail(@Request() req: express.Request, @BodyProp() confirmationCode: string, @BodyProp() email: string): Promise<IServerMessage> {

        let response: ResponseObject | AWS.CognitoIdentityServiceProvider.ConfirmSignUpResponse = await this.userService.verifyUserEmail(email, confirmationCode, getIpFromHeader(req));

        if (response instanceof ResponseObject) {

            this.setStatus(response.statusCode);
            let serverMessage: IServerMessage = response.data;
            return serverMessage;

        }

    }


    @Post("/setup-sms-mfa")
    @Security("jwt")
    @SuccessResponse(200)
    public async setupSmsTOTP(@Request() req: express.Request, @BodyProp() enabled: boolean): Promise<void> {

        const accessToken: string = getJWTFromHeader(req);

        await this.userService.setSmsTOTP(accessToken, enabled, this.authorizationResult.userUuid);

    }


    /** Signup for user account.  */
    @Post("/signup")
    @Example({
        uuid: "abc-34f-334-3434"
    })
    public async signUp(

        @Request() req: express.Request,
        @BodyProp() email: string,
        @BodyProp() password: string,
        @BodyProp() firstName: string,
        @BodyProp() lastName: string,
        @BodyProp() language: string,
        @BodyProp() phoneNumber: string): Promise<IServerMessage | {}> {

        // make lowercase email
        email = email.toLowerCase();

        let response: ResponseObject = await this.userService.userSignup(email, password, phoneNumber, firstName, lastName, language, getIpFromHeader(req));

        this.setStatus(response.statusCode);

        return response.data;

    }

    /** Get user */
    @Get("/")
    @Security("jwt")
    @Example({
        "uuid": "d2496da2-b2fd-4c98-9146-5fbd7bf6beca",
        "email": "pg@gmail.com",
        "firstName": "John",
        "lastName": "Doe",
        "isEmailVerified": true,
        "isPhoneNumberVerified": false,
        "phoneNumber": "+44772989823989",
        "language": "en-GB",
        "mfaType": "none",
        "createdDate": "2018-08-01T08:54:43.000Z",
        "updatedDate": "2018-08-01T09:30:44.000Z"
    })
    public async getUser(): Promise<IUser> {

        this.setStatus(200);

        return this.userService.getUser(this.authorizationResult.userUuid);

    }

    /** Get user rights */
    @Get("/user-rights")
    @Security("jwt")
    @Example({
        "isAuthenticated": true,
        "clientName": "Portal",
        "userUuid": "d2496da2-b2fd-4c98-9146-5fbd7bf6beca",
        "jwtId": "5bc2934c-b77a-4135-b238-ae12fe67a087",
        "rights": [
            "companyAdmin"
        ]
    })
    public async validateToken(@Request() req: express.Request): Promise<IAuthorizationResult> {

        this.setStatus(200);
        return this.authorizationResult;

    }


    /** Signouts user and blacklists token */
    @Post("/sign-out")
    @Security("jwt")
    @SuccessResponse(200)
    public async signout(@Request() req: express.Request): Promise<void> {

        const accessToken: string = getJWTFromHeader(req);

        await this.userService.signout(accessToken);

        this.setStatus(200);

    }


    /** Request a new password via email */
    @Post("/forgot-password")
    @SuccessResponse(200)
    public async forgotPassword(@Request() req: express.Request, @BodyProp() email: string): Promise<IServerMessage> {

        let response: ResponseObject = await this.userService.forgotPassword(email, getIpFromHeader(req));
        this.setStatus(response.statusCode);
        let serverMessage: IServerMessage = response.data;
        return serverMessage;
    }


    /** Update user - limited properties only */
    @Patch("/")
    @Security("jwt")
    @SuccessResponse(200)
    public async updateUser(@Request() req: express.Request, @Body() user: IUser): Promise<IServerMessage | IUser> {

        const accessToken: string = getJWTFromHeader(req);

        let response: ResponseObject = await this.userService.updateUser(accessToken, user, this.authorizationResult);
        this.setStatus(response.statusCode);

        if (response.statusCode === 200) {
            return response.data as IUser;

        } else {

            let serverMessage: IServerMessage = response.data;
            return serverMessage;
        }
    }


    /** Enter a new password by providing code, email and new password */
    @Post("/confirm-forgot-password")
    @SuccessResponse(200)
    public async confirmForgotPassword(@Request() req: express.Request, @BodyProp() email: string, @BodyProp() password: string, @BodyProp() code: string): Promise<IServerMessage> {

        let response: ResponseObject = await this.userService.confirmForgotPassword(email, code, password, getIpFromHeader(req));
        this.setStatus(response.statusCode);
        let serverMessage: IServerMessage = response.data;
        return serverMessage;
    }


    /** Refresh access token using refresh token, access token that is not blacklisted and less than 2 hours old */
    @Post("/refresh-token")
    @Example({
        AccessToken: "GdfHRDabc34f3343434..."
    })
    public async refreshToken(@Request() req: express.Request, @Header() authorization, @BodyProp() refreshToken: string): Promise<IServerMessage | {}> {

        const accessToken: string = getJWTFromHeader(req);

        let response: ResponseObject = await this.userService.refreshToken(refreshToken, accessToken, getIpFromHeader(req));

        if (response.statusCode === 200) {

            this.setStatus(200);
            return { AccessToken: response.data };


        } else {
            this.setStatus(response.statusCode);
            let serverMessage: IServerMessage = response.data;
            return serverMessage;
        }
    }


    @Post("/change-password")
    @Security("jwt")
    @SuccessResponse(200)
    public async changePassword(@Request() req: express.Request, @BodyProp() proposedPassword: string, @BodyProp() previousPassword: string): Promise<IServerMessage> {

        const accessToken: string = getJWTFromHeader(req);

        let response: ResponseObject = await this.userService.changePassword(accessToken, previousPassword, proposedPassword);

        this.setStatus(response.statusCode);
        let serverMessage: IServerMessage = response.data;
        return serverMessage;

    }


    @Post("/resend-confirmation-code")
    @SuccessResponse(200)
    public async resendConfirmationCode(@Request() req: express.Request, @BodyProp() email: string): Promise<IServerMessage> {

        let response: ResponseObject = await this.userService.resendConfirmationCode(email, getIpFromHeader(req));

        this.setStatus(response.statusCode);
        let serverMessage: IServerMessage = response.data;
        return serverMessage;

    }





}
