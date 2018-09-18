import "reflect-metadata";
import { ReflectiveInjector } from "injection-js";
import * as dotenv from "dotenv";

import * as svc from "./services";

import { App } from "./app";

dotenv.config({ path: "./dist/.env" });

const port: number = +process.env.PORT;

let app = new App().express;
app.set("port", port);

// set up injection providers
const injector: ReflectiveInjector = ReflectiveInjector.resolveAndCreate([
    svc.LoggingService, svc.CognitoService, svc.CacheService, svc.TokenLoggingService, svc.AuthService, svc.UserService
]);

// store injection container for global use
app.locals.container = injector;

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});



