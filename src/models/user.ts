export interface IUser {

    uuid: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    isEmailVerified?: boolean;
    isPhoneNumberVerified?: boolean;
    language: string;
    mfaType?: string;
    deleted?: number;
    createdDate?: Date;
    updatedDate?: Date;

}
