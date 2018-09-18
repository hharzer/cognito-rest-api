export namespace Constants {

    export namespace UserService {

        export enum ErrorCodes {
            internalServerError = "InternalServerErrror",
            userAlreadyExists = "UserAlreadyExists",
            codeMismatchException = "CodeMismatchException",
            notAuthorizedException = "NotAuthorizedException",
            userNotConfirmedException = "UserNotConfirmedException",
            userNotFoundException = "UserNotFoundException",
            invalidParameterException = "InvalidParameterException", // this will never be returned.
            invalidPhoneNumber = "InvalidPhoneNumber",
            invalidEmail = "InvalidMail",
            invalidPasswordException = "InvalidPasswordException",
            expiredCodeException = "ExpiredCodeException",
            limitExceededException = "LimitExceededException"
        }

        export enum MFATypes {
            none = "none",
            sms = "sms",
            totp = "totp"
        }
    }

    export namespace Authorization {

        export enum Rights {
            system = "system"
        }

    }

    export namespace LogService {

        export enum Levels {
            info = "info",
            debug = "debug",
            error = "error"
        }

    }
}
