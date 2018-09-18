import * as dbclient from "mysql-client";

export class TokenLoggingDB {

    private db: dbclient.DB;

    constructor(conn: dbclient.DBConnection = null) {

        this.db = new dbclient.DB(conn);

    }

    public async insertBlacklistedToken(jti: string): Promise<number> {

        const sql = "insert into blacklisted_tokens(jti) values (?);";

        let rowsAffected: number = await this.db.queryAsync(sql, [jti]);

        return rowsAffected;
    }

    public async insertIssuedToken(jti: string, userID: string, ip: string): Promise<number> {

        const sql = "insert into issued_tokens(jti, user_uuid, ip) values (?,?,?);";

        let rowsAffected: number = await this.db.queryAsync(sql, [jti, userID, ip]);

        return rowsAffected;
    }

    public async deleteExpiredBlacklistedToken(ageHours: number): Promise<number> {

        const sql = "delete from blacklisted_tokens where TIMESTAMPDIFF(HOUR, created_date, now()) > ?";

        let rowsAffected: number = (await this.db.queryAsync(sql, [ageHours])).changedRows;

        return rowsAffected;
    }

    public async deleteIssuedTokens(ageHours: number): Promise<number> {

        const sql = "delete from issued_tokens where TIMESTAMPDIFF(HOUR, created_date, now()) > ?";

        let rowsAffected: number = (await this.db.queryAsync(sql, [ageHours])).changedRows;

        return rowsAffected;
    }

    public async isTokenBlackListed(jti: string): Promise<boolean> {

        const sql = "select jti from blacklisted_tokens where jti=?;";

        let rows: any = await this.db.queryAsync(sql, [jti]);

        return rows.length > 0;
    }

    public async getJtiIssuedAge(jti: string): Promise<number> {

        const sql = "select TIMESTAMPDIFF(HOUR, created_date, now()) age FROM issued_tokens where jti=?";

        let rows: any = await this.db.queryAsync(sql, [jti]);

        if (rows[0]) {

            return rows[0].age;

        } else {

            return undefined;
        }
    }


}
