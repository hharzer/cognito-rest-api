
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as express from "express";
import * as helmet from "helmet";
import * as requestLogging from "morgan";
import * as svc from "./services";

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require(__dirname + "/swagger.json");
const httpContext = require("express-http-context");

import { RegisterRoutes } from "./routes/routes";

// NB do not delete this line.
import * as controllers from "./controllers";
// controllers need to be referenced in order to get crawled by the generator

// Run configuration methods on the Express instance.
export class App {

  public express: express.Application;

  constructor() {
    this.express = express();

    // Configure Express middleware.
    const options: cors.CorsOptions = {
      allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization"
      ],
      credentials: false,
      methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
      origin: process.env.CORS,
      preflightContinue: false
    };

    if (process.env.NODE_ENV === "dev") {
      this.express.use(requestLogging("dev"));
    }
    this.express.use(helmet());
    this.express.use(helmet.referrerPolicy({ policy: "no-referrer-when-downgrade" }));
    this.express.use(helmet.noCache());
    this.express.use(bodyParser.urlencoded({ extended: true }));
    this.express.use(bodyParser.json({ type: "application/json" }));
    this.express.use(httpContext.middleware);
    this.express.use(cors(options));
    this.express.disable("x-powered-by");
    this.express.options("*", cors(options));

    const pjson = require("../package.json");

    // default route
    let router = express.Router();
    router.get(
      "/user/version",
      (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        res.json({
          message: `API: ${pjson.version}`
        });
      }
    );

    // Check for x-request-id else create new one.
    this.express.use("*", function (req, res, next) {

      let requestId = req.headers["x-request-id"];
      if (!requestId) {
        requestId = require("uuid/v4")();

      }
      httpContext.set("x-request-id", requestId);

      next();

    });

    this.express.use(router);

    RegisterRoutes(this.express);

    this.express.use("/user/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    this.express.use(function (req: express.Request, res: express.Response, next: express.NextFunction) {
      res.status(404).json({
        message: "Route not found"
      });
    });

    // Catch and handle uncaught errors
    this.express.use(function (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction) {

      if (err) {

        new svc.LoggingService().error("GeneralError", err);
        res.status(500).json({ message: "A server error occurred" });

        next(err);
      }
    });

  }

}


