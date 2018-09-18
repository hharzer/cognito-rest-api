import * as winston from "winston";
import * as path from "path";

const DailyRotateFile = require("winston-daily-rotate-file");

const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new DailyRotateFile({
            level: "info",
            prepend: true,
            json: true,
            timestamp: true,
            filename: path.join("\logs", "application-%DATE%.log"),
            datePattern: "YYYY-MM-DD-HH",
            maxSize: "100m",
            maxFiles: "90d"
        })
    ]
});

export default logger;
