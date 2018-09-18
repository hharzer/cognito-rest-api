import "reflect-metadata";
import { ReflectiveInjector } from "injection-js";
import { expect, assert } from "chai";
import { IServerMessage } from "../models";
import { App } from "../app";
import * as dotenv from "dotenv";
import * as supertest from "supertest";
import * as svc from "../services";

dotenv.config({ path: "./dist/test/test.env" });

let MailslurpClient = require("mailslurp-client");

let app = new App().express;

app.set("port", 5010);

process.env.NODE_ENV = "test";

const request = supertest(app);


// // set up injection providers
const injector: ReflectiveInjector = ReflectiveInjector.resolveAndCreate([
    svc.LoggingService, { provide: svc.CacheService, useClass: svc.CacheServiceMock }, svc.UserService, svc.TokenLoggingService, svc.CognitoService, svc.AuthService
]);

// store injection container for global consumption
app.locals.container = injector;

const api = new MailslurpClient.InboxcontrollerApi();
const apiKey = process.env.MAILSLURP_API_KEY; // {String} Your API Key. Sign up and find it in your dashboard.
const password: string = "Password!1";
const password2: string = password + "b";
const phoneNumber: string = "+447776545544";

let email: string;
let userUuid: string;
let mailboxId: string;
let accessToken: string;
let refreshToken: string;


before(async () => {
    let data = await api.createRandomInboxUsingPOST(apiKey);
    email = data.payload.address;
    mailboxId = data.payload.id;
    return;
});

describe("Root", () => {
    it("should return a 201 and a new uuid in the response", function (done: MochaDone) {

        request.post("/user/signup")
            .set("Content-type", "application/json")
            .send({
                "email": email,
                "password": password,
                "firstName": "John",
                "lastName": "Doe",
                "phoneNumber": phoneNumber,
                "language": "en-GB"
            })
            .expect(201, done)
            .expect(function (res: supertest.Response) {

                userUuid = res.body.uuid;

                if (!userUuid || userUuid.length === 0) {
                    assert(false, "Missing userUuid");
                }
            });

    });
});



describe("Root", () => {
    it("should return a 400 if user already exists", function (done: MochaDone) {

        request.post("/user/signup")
            .set("Content-type", "application/json")
            .send({
                "email": email,
                "password": password,
                "firstName": "John",
                "lastName": "Doe",
                "phoneNumber": "+447765676767",
                "language": "en-GB"
            })
            .expect(400, done)
            .expect({ message: "UserAlreadyExists", isUserError: true } as IServerMessage);


    });
});


describe("Root", () => {
    it("should get a 400 if password not correct", function (done: MochaDone) {

        request.post("/user/initiate-auth")
            .set("Content-type", "application/json")
            .send({
                "password": "gibberish",
                "email": email
            })
            // expect an empty token
            .expect(400, done)
            .expect(function (res: supertest.Response) {
                expect(!res.body.token);
            });
    });
});


describe("Root", () => {
    it("should get a 400 if user email not confirmed", function (done: MochaDone) {

        request.post("/user/initiate-auth")
            .set("Content-type", "application/json")
            .send({
                "password": password,
                "email": email
            })
            // expect an empty token
            .expect(400, done)
            .expect(function (res: supertest.Response) {
                expect(!res.body.token);
            });
    });
});


describe("Root", () => {
    it("should get a 400 if username not exists", function (done: MochaDone) {

        request.post("/user/initiate-auth")
            .set("Content-type", "application/json")
            .send({
                "password": "gibberish",
                "email": "fdfgdfg@gmail.com"
            })
            // expect an empty token
            .expect(400, done)
            .expect(function (res: supertest.Response) {
                expect(!res.body.token);
            });
    });
});

describe("Root", () => {
    it("should allow user to verify email", function (done: MochaDone) {

        (async () => {

            let data = await api.getEmailsForInboxUsingGET(apiKey, mailboxId, {
                minCount: 1,
                maxWait: 60
            });


            let body: string = data.payload[0].body;

            let matchphrase: string = "&code=";
            let confirmationCodeStart: number = body.indexOf(matchphrase) + matchphrase.length;
            let confirmationCode: string = body.substr(confirmationCodeStart, 6);

            // console.log("ConfirmationCode:" + confirmationCode);

            request.post("/user/verify-email")
                .set("Content-type", "application/json")
                .send({
                    "email": email,
                    "confirmationCode": confirmationCode
                })
                .expect(200, done);
        })();

    });
});



describe("Root", () => {
    it("should allow user to login", function (done: MochaDone) {

        request.post("/user/initiate-auth")
            .set("Content-type", "application/json")
            .send({
                "password": password,
                "email": email
            })
            .expect(200, done)
            .expect(function (res: supertest.Response) {

                if (res.body && res.body.AuthenticationResult) {
                    accessToken = res.body.AuthenticationResult.AccessToken;
                    refreshToken = res.body.AuthenticationResult.RefreshToken;
                }

                if (!accessToken || accessToken.length === 0) {
                    assert(false, "Missing access token");
                }

                if (!refreshToken || refreshToken.length === 0) {
                    assert(false, "Missing refresh token");
                }
            });
    });
});


describe("Root", () => {
    it("should allow user to get user-rights", function (done: MochaDone) {

        request.get("/user/user-rights")
            .set("Content-type", "application/json")
            .set("Authorization", `Bearer ${accessToken}`)
            .send()
            .expect(200, done)
            .expect(function (res: supertest.Response) {

                let authenticated: boolean = res.body.isAuthenticated;

                if (!authenticated) {
                    assert(false, "Did not authenticate");
                }
            });
    });
});


describe("Auth", () => {
    it("should return an authorization result with a valid token", function (done: MochaDone) {

        request.post("/user/auth/validate-token")
            .set("Content-type", "application/json")
            .set("Authorization", `Bearer ${accessToken}`)
            .send()
            .expect(200, done)
            .expect(function (res: supertest.Response) {

                let authenticated: boolean = res.body.isAuthenticated;

                if (!authenticated) {
                    assert(false, "Did not authenticate");
                }
            });
    });
});

describe("Root", () => {
    it("should allow user to refresh token", function (done: MochaDone) {

        request.post("/user/refresh-token")
            .set("Content-type", "application/json")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                refreshToken: refreshToken
            })
            .expect(200, done)
            .expect(function (res: supertest.Response) {

                accessToken = res.body.AccessToken;

                if (!accessToken || accessToken.length === 0) {
                    assert(false, "Missing access token");
                }
            });
    });
});

describe("Root", () => {
    it("should allow user to changePassword", function (done: MochaDone) {

        request.post("/user/change-password")
            .set("Content-type", "application/json")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                "previousPassword": password,
                "proposedPassword": password2
            })
            .expect(200, done);
    });
});


describe("Root", () => {
    it("should allow user to requestForgottenEmail", function (done: MochaDone) {

        request.post("/user/forgot-password")
            .set("Content-type", "application/json")
            .send({
                "email": email

            })
            .expect(200, done);
    });
});


describe("Root", () => {
    it("should allow user to updateForgottenPassword", function (done: MochaDone) {

        (async () => {

            let data = await api.getEmailsForInboxUsingGET(apiKey, mailboxId, {
                minCount: 2,
                maxWait: 60
            });

            let body: string = data.payload[1].body;

            let matchphrase: string = "&code=";
            let codeStart: number = body.indexOf(matchphrase) + matchphrase.length;
            let code: string = body.substr(codeStart, 6);

            request.post("/user/confirm-forgot-password")
                .set("Content-type", "application/json")
                .send({
                    "email": email,
                    "code": code,
                    "password": password
                })
                .expect(200, done);
        })();
    });


    describe("Root", () => {
        it("should allow user to signout", function (done: MochaDone) {

            request.post("/user/sign-out")
                .set("Content-type", "application/json")
                .set("Authorization", `Bearer ${accessToken}`)
                .send()
                .expect(200, done);
        });
    });


    describe("Root", () => {
        it("should not allow user to get user-rights after signing out", function (done: MochaDone) {

            request.get("/user/user-rights")
                .set("Content-type", "application/json")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({

                })
                .expect(401, done)
                .expect(function (res: supertest.Response) {

                    let authenticated: boolean = res.body.isAuthenticated;

                    if (authenticated) {
                        assert(false, "Did not disallow authenticate");
                    }
                });
        });
    });


});





