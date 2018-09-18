import "reflect-metadata";
import { ReflectiveInjector } from "injection-js";
import { App } from "../app";
import * as dotenv from "dotenv";
import * as supertest from "supertest";
import * as svc from "../services";

dotenv.config({ path: "./dist/test/test.env" });

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


describe("Log", () => {
    it("should return a 204", function (done: MochaDone) {

        request.post("/user/log?level=error")
            .set("Content-type", "application/json")
            .send({
                "data": "general stuff"
            })
            .expect(204, done);
    });
});


