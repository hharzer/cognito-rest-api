import { Injectable } from "injection-js";
import { TokenLoggingDB } from "../db/token-logging-db";
import * as svc from ".";


@Injectable()
export class TokenLoggingService {

    private tokenLoggingdb: TokenLoggingDB;

    private getBlackListedTokenCacheKey(jti: string): string {
        return `blacklistedToken_${jti}`;
    }

    constructor(private loggingService: svc.LoggingService, private cacheService: svc.CacheService) {

        this.tokenLoggingdb = new TokenLoggingDB();

    }

    public async insertBlacklistedToken(jti: string): Promise<number> {

        try {
            let result: number = await this.tokenLoggingdb.insertBlacklistedToken(jti);
            await this.cacheService.set(this.getBlackListedTokenCacheKey(jti), true, 3600);
            return result;

        } catch (ex) {
            this.loggingService.error("insertBlackListedToken", ex);
            return -1;
        }

    }

    public async insertIssuedToken(jti: string, userID: string, ip: string): Promise<number> {

        try {
            return this.tokenLoggingdb.insertIssuedToken(jti, userID, ip);

        } catch (ex) {
            this.loggingService.error("insertIssuedToken", ex);

        }
    }

    public async deleteExpiredBlacklistedTokens(ageHours: number): Promise<number> {

        try {
            return this.tokenLoggingdb.deleteExpiredBlacklistedToken(ageHours);

        } catch (ex) {
            this.loggingService.error("deleteExpiredBlacklistedToken", ex);

        }
    }

    public async deleteIssuedTokens(ageHours: number): Promise<number> {

        try {
            return this.tokenLoggingdb.deleteIssuedTokens(ageHours);

        } catch (ex) {
            this.loggingService.error("deleteIssuedTokens", ex);

        }
    }



    public async isTokenBlackListed(jti: string): Promise<boolean> {

        let isTokenBlackListed: boolean = await this.cacheService.get(this.getBlackListedTokenCacheKey(jti));

        if (isTokenBlackListed === undefined) {
            isTokenBlackListed = await this.tokenLoggingdb.isTokenBlackListed(jti);
            await this.cacheService.set(this.getBlackListedTokenCacheKey(jti), isTokenBlackListed, 3600);
        } else {
            return isTokenBlackListed;
        }

        return isTokenBlackListed;
    }

    public async getJtiIssuedAge(jti: string): Promise<number> {
        try {
            return this.tokenLoggingdb.getJtiIssuedAge(jti);

        } catch (ex) {
            this.loggingService.error("getJtiIssuedAge", ex);

        }
    }
}
