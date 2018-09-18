import * as dbclient from "mysql-client";

import { IUser } from "../models";

export class UserDB {

    private db: dbclient.DB;

    constructor(conn: dbclient.DBConnection = null) {

        this.db = new dbclient.DB(conn);

    }

    public async insertUser(user: IUser): Promise<number> {

        const sql = "insert into user(uuid, email, first_name, last_name, phone_number, language) values (?,?,?,?,?,?);";

        return this.db.queryAsync(sql, [user.uuid, user.email, user.firstName, user.lastName, user.phoneNumber, user.language]);

    }

    public async getUserRights(userUuid: string): Promise<string[]> {

        const sql = "select right_name from user_right ur inner join `right` r on ur.right_uuid=r.uuid where ur.user_uuid=?";

        let rows: any = await this.db.queryAsync(sql, [userUuid]);

        let rights: string[] = [];

        rows.forEach((row) => {

            rights.push(row.right_name);

        });

        return rights;

    }


    public async setEmailVerified(email: string): Promise<number> {

        const sql = "update user set is_email_verified=1, updated_date=now() where email=? and deleted=0;";

        return this.db.queryAsync(sql, [email]);

    }

    public async updateUser(user: IUser): Promise<number> {

        const sql = "update user set first_name=?, last_name=?, is_email_verified=?, is_phone_number_verified=?, mfa_type=?, language=?, updated_date=now() where uuid=?;";

        return this.db.queryAsync(sql, [user.firstName, user.lastName, user.isEmailVerified ? 1 : 0, user.isPhoneNumberVerified ? 1 : 0, user.mfaType, user.language, user.uuid]);
    }


    public async getByEmail(email: string): Promise<IUser> {

        email = email.toLowerCase();

        const sql = `SELECT uuid, email, first_name, last_name, is_email_verified, is_phone_number_verified, mfa_type, created_date, updated_date from user WHERE email=? and deleted=0`;

        let rows: any = await this.db.queryAsync(sql, email);

        if (rows[0]) {
            return this.buildUser(rows[0]);

        } else {
            return null;
        }
    }

    public async getByUuid(userUuid: string): Promise<IUser> {

        const sql = `SELECT uuid, email, first_name, last_name, phone_number, is_email_verified, is_phone_number_verified, mfa_type, language, created_date, updated_date from user WHERE uuid=?`;

        let rows: any = await this.db.queryAsync(sql, userUuid);

        if (rows[0]) {
            return this.buildUser(rows[0]);

        } else {
            return null;

        }
    }


    private buildUser(r: any): IUser {

        let u: IUser = {

            uuid: r.uuid,
            email: r.email,
            phoneNumber: r.phone_number,
            firstName: r.first_name,
            lastName: r.last_name,
            isEmailVerified: r.is_email_verified === 1 ? true : false,
            isPhoneNumberVerified: r.is_phone_verified === 1 ? true : false,
            language: r.language,
            mfaType: r.mfa_type,
            deleted: r.deleted

        } as IUser;

        u.createdDate = r.created_date;
        u.updatedDate = r.updated_date;

        return u;
    }

}
