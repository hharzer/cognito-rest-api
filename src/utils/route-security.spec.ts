// import "reflect-metadata";
// import { ReflectiveInjector } from "injection-js";
// import * as supertest from "supertest";
// import { assert } from "chai";

// import * as svc from "../services/index";
// import { IServerMessage } from "../models/server-message";

// import app from "../app";

// app.set("port", 5010);

// const injector: ReflectiveInjector = ReflectiveInjector.resolveAndCreate([
//     svc.LoggingService, { provide: svc.ClientAuthService, useClass: svc.ClientAuthServiceFailureMock }
// ]);

// // store injection container for global consumption
// app.locals.container = injector;

// const request = supertest(app);

// // The assumption is that /user/account/user-rights is a Portal allowable route.
// describe("route-security", () => {

//     it("Should validate a secure route and return a error message", function (done: MochaDone) {

//         request.get(`/user/account/user-rights`)
//             .set("Content-type", "application/json")
//             .expect(function (res: supertest.Response) {

//                 let serverMessage: IServerMessage = res.body;
//                 if (serverMessage.message !== "TokenNotProvided") {

//                     console.log(serverMessage.message);
//                     assert(false, "Wrong error message provided ");
//                 }
//             })
//             .expect(400, done);
//     });

// });


