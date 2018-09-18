export interface IAuthorizationResult {
    jwtId: string;
    clientName: string;
    isAuthenticated: boolean;
    rights: string[];
    userUuid: string;
    errorCode: string; // TODO replace with enums
}
