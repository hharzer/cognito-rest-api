import { Injectable } from "injection-js";
import logger from "../utils/logger";
import { Constants } from "../utils";


@Injectable()
export class LoggingService {


    public log(level: Constants.LogService.Levels, context: string, message: string | object): void {

        logger.log(level, this.wrapMessage(context, message));

    }

    public info(context: string, message: string | object): void {

        logger.log("info", this.wrapMessage(context, message));

    }

    public error(context: string, message: string | object): void {

        logger.log("error", this.wrapMessage(context, message));

    }

    public debug(context: string, message: string | object): void {

        logger.log("debug", this.wrapMessage(context, message));

    }

    private wrapMessage(context: string, message: string | object): string {

        if (typeof message !== "string") {
            message = JSON.stringify(message, Object.getOwnPropertyNames(message), 0);
        }

        let httpContext = require("express-http-context");
        let reqId = httpContext.get("x-request-id");
        let userUuid = httpContext.get("userUuid");

        if (userUuid) {
            message = `[UserUuid]: ${userUuid} ${message}`;
        }

        if (reqId) {
            message = `[x-request-id]: ${reqId} ${message}`;
        }

        message = `[${context}]: ${message}`;


        return message;
    }

}
