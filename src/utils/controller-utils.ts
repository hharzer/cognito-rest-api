import { Constants } from ".";
import { IAuthorizationResult } from "../models";

export class ControllerUtils {

    public static hasRight(right: Constants.Authorization.Rights, authResult: IAuthorizationResult): boolean {

        return authResult.rights.indexOf(right) > -1;

    }

}
