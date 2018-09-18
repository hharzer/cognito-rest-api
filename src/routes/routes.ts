/* tslint:disable */
import { Injector } from 'injection-js';
import { IAuthorizationResult } from "../models";
import { catchAsyncErrors } from '../utils/async-catch';

import { Controller, ValidateParam, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { MonitorController } from './../controllers/monitor-controller';
import { RootController } from './../controllers/root-controller';
import { AuthController } from './../controllers/auth-controller';
import { LogController } from './../controllers/log-controller';
import { expressAuthentication } from './../utils/route-security';

const models: TsoaRoute.Models = {
    "IServerMessage": {
        "properties": {
            "message": { "dataType": "string", "required": true },
            "isUserError": { "dataType": "boolean", "required": true },
        },
    },
    "IUser": {
        "properties": {
            "uuid": { "dataType": "string", "required": true },
            "email": { "dataType": "string", "required": true },
            "firstName": { "dataType": "string", "required": true },
            "lastName": { "dataType": "string", "required": true },
            "phoneNumber": { "dataType": "string", "required": true },
            "isEmailVerified": { "dataType": "boolean" },
            "isPhoneNumberVerified": { "dataType": "boolean" },
            "language": { "dataType": "string", "required": true },
            "mfaType": { "dataType": "string" },
            "deleted": { "dataType": "double" },
            "createdDate": { "dataType": "datetime" },
            "updatedDate": { "dataType": "datetime" },
        },
    },
    "IAuthorizationResult": {
        "properties": {
            "jwtId": { "dataType": "string", "required": true },
            "clientName": { "dataType": "string", "required": true },
            "isAuthenticated": { "dataType": "boolean", "required": true },
            "rights": { "dataType": "array", "array": { "dataType": "string" }, "required": true },
            "userUuid": { "dataType": "string", "required": true },
            "errorCode": { "dataType": "string", "required": true },
        },
    },
};

export function RegisterRoutes(app: any) {
    app.get('/user/monitor',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "request", "name": "request", "required": true, "dataType": "object" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new MonitorController(injector, response.locals.authorizationResult);


            const promise = controller.getServerDate.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/monitor/clear-tokens',
        catchAsyncErrors(authenticateMiddleware([{ "name": "jwt" }])),
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new MonitorController(injector, response.locals.authorizationResult);


            const promise = controller.clearExpiredTokens.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/initiate-auth',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                email: { "in": "body-prop", "name": "email", "required": true, "dataType": "string" },
                password: { "in": "body-prop", "name": "password", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.initiateAuthRequest.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/respond-sms-auth-challenge',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                userId: { "in": "body-prop", "name": "userId", "required": true, "dataType": "string" },
                confirmationCode: { "in": "body-prop", "name": "confirmationCode", "required": true, "dataType": "string" },
                session: { "in": "body-prop", "name": "session", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.respondSMSAuthChallenge.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/verify-email',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                confirmationCode: { "in": "body-prop", "name": "confirmationCode", "required": true, "dataType": "string" },
                email: { "in": "body-prop", "name": "email", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.verifyUserEmail.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/setup-sms-mfa',
        catchAsyncErrors(authenticateMiddleware([{ "name": "jwt" }])),
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                enabled: { "in": "body-prop", "name": "enabled", "required": true, "dataType": "boolean" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.setupSmsTOTP.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/signup',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                email: { "in": "body-prop", "name": "email", "required": true, "dataType": "string" },
                password: { "in": "body-prop", "name": "password", "required": true, "dataType": "string" },
                firstName: { "in": "body-prop", "name": "firstName", "required": true, "dataType": "string" },
                lastName: { "in": "body-prop", "name": "lastName", "required": true, "dataType": "string" },
                language: { "in": "body-prop", "name": "language", "required": true, "dataType": "string" },
                phoneNumber: { "in": "body-prop", "name": "phoneNumber", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.signUp.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.get('/user',
        catchAsyncErrors(authenticateMiddleware([{ "name": "jwt" }])),
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.getUser.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.get('/user/user-rights',
        catchAsyncErrors(authenticateMiddleware([{ "name": "jwt" }])),
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.validateToken.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/sign-out',
        catchAsyncErrors(authenticateMiddleware([{ "name": "jwt" }])),
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.signout.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/forgot-password',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                email: { "in": "body-prop", "name": "email", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.forgotPassword.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.patch('/user',
        catchAsyncErrors(authenticateMiddleware([{ "name": "jwt" }])),
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                user: { "in": "body", "name": "user", "required": true, "ref": "IUser" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.updateUser.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/confirm-forgot-password',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                email: { "in": "body-prop", "name": "email", "required": true, "dataType": "string" },
                password: { "in": "body-prop", "name": "password", "required": true, "dataType": "string" },
                code: { "in": "body-prop", "name": "code", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.confirmForgotPassword.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/refresh-token',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                authorization: { "in": "header", "name": "authorization", "required": true, "dataType": "any" },
                refreshToken: { "in": "body-prop", "name": "refreshToken", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.refreshToken.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/change-password',
        catchAsyncErrors(authenticateMiddleware([{ "name": "jwt" }])),
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                proposedPassword: { "in": "body-prop", "name": "proposedPassword", "required": true, "dataType": "string" },
                previousPassword: { "in": "body-prop", "name": "previousPassword", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.changePassword.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/resend-confirmation-code',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
                email: { "in": "body-prop", "name": "email", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new RootController(injector, response.locals.authorizationResult);


            const promise = controller.resendConfirmationCode.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/auth/validate-token',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                req: { "in": "request", "name": "req", "required": true, "dataType": "object" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new AuthController(injector, response.locals.authorizationResult);


            const promise = controller.validateToken.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));
    app.post('/user/log',
        catchAsyncErrors(async function(request: any, response: any, next: any) {
            const args = {
                body: { "in": "body", "name": "body", "required": true, "dataType": "any" },
                level: { "in": "query", "name": "level", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return response.status(400).send(err);
            }


            let injector: Injector = app.locals.container;
            const controller = new LogController(injector, response.locals.authorizationResult);


            const promise = controller.log.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        }));

    function authenticateMiddleware(security: TsoaRoute.Security[] = []) {
        return expressAuthentication()

    }

    function promiseHandler(controllerObj: any, promise: any, response: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode;
                if (controllerObj instanceof Controller) {
                    const controller = controllerObj as Controller
                    const headers = controller.getHeaders();
                    Object.keys(headers).forEach((name: string) => {
                        response.set(name, headers[name]);
                    });

                    statusCode = controller.getStatus();
                }

                if (data) {
                    response.status(statusCode || 200).json(data);
                } else {
                    response.status(statusCode || 204).end();
                }
            })
            .catch((error: any) => next(error));
    }

    function getValidatedArgs(args: any, request: any): any[] {
        const fieldErrors: FieldErrors = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return ValidateParam(args[key], request.query[name], models, name, fieldErrors);
                case 'path':
                    return ValidateParam(args[key], request.params[name], models, name, fieldErrors);
                case 'header':
                    return ValidateParam(args[key], request.header(name), models, name, fieldErrors);
                case 'body':
                    return ValidateParam(args[key], request.body, models, name, fieldErrors, name + '.');
                case 'body-prop':
                    return ValidateParam(args[key], request.body[name], models, name, fieldErrors, 'body.');
            }
        });
        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }
}