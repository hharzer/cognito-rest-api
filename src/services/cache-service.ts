import * as Memcached from "memcached";
import * as svc from ".";
import { Injectable } from "injection-js";

/**
 * A simple cache layer using memcached.
 */

@Injectable()
export class CacheService {

    private memcached: Memcached;

    constructor(private logging: svc.LoggingService) {

        this.memcached = new Memcached(process.env.MEMCACHED_CONFIGURATION);
        this.logging.info("CacheService", `Using Memcached on CacheService ${process.env.MEMCACHED_CONFIGURATION}`);

    }

    public async set(key: string, data: any, lifetimeSec: number): Promise<boolean> {

        try {
            let success: boolean = await this.setPromise(key, data, lifetimeSec);
            this.logging.debug("set", `Memcache Set key: ${key}`);
            return success;

        } catch (ex) {
            this.logging.error("set", `Memcache Set key: ${key} error: ${JSON.stringify(ex)}`);
            return false;
        }
    }

    public async touch(key: string, lifetimeSec: number): Promise<boolean> {

        try {
            let success: boolean = await this.touchPromise(key, lifetimeSec);
            this.logging.debug("touch", `Memcache Touch key: ${key}`);
            return success;

        } catch (ex) {
            // in dev environment (windows) touch not available
            if (process.env.NODE_ENV !== "dev") {
                this.logging.error("touch", `Memcache Touch key: ${key} error: ${JSON.stringify(ex)}`);
            }

            return false;
        }
    }

    public async get(key: string): Promise<any> {

        try {
            let data: any = await this.getPromise(key);
            this.logging.debug("get", `Memcache Get key: ${key}`);
            return data;

        } catch (ex) {
            this.logging.error("get", `Memcache Get key: ${key} error: ${JSON.stringify(ex)}`);
            return null;
        }
    }

    public async del(key: string): Promise<boolean> {

        try {
            let result: boolean = await this.delPromise(key);
            this.logging.debug("del", `Memcache Del key: ${key}`);
            return result;

        } catch (ex) {
            this.logging.error("del", `Memcache Del key: ${key} error: ${JSON.stringify(ex)}`);
            return null;
        }
    }


    private setPromise(key: string, data: any, lifetimeSec: number): Promise<boolean> {

        return new Promise<boolean>(
            (resolve, reject) => {
                return this.memcached.set(key, data, lifetimeSec, function (err: Memcached.CommandData, result: boolean) {

                    if (err) {
                        reject(err);
                    }
                    resolve(result);
                });
            });
    }


    private touchPromise(key: string, lifetimeSec: number): Promise<boolean> {

        return new Promise<boolean>(
            (resolve, reject) => {
                return this.memcached.touch(key, lifetimeSec, function (err: Memcached.CommandData) {

                    if (err) {
                        reject(err);
                    }
                    resolve(true);
                });
            });
    }

    private async getPromise(key: string): Promise<any> {

        return new Promise<boolean>(
            (resolve, reject) => {
                return this.memcached.get(key, function (err: Memcached.CommandData, data: any) {

                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                });
            });
    }

    private delPromise(key: string): Promise<boolean> {

        return new Promise<boolean>(
            (resolve, reject) => {
                return this.memcached.del(key, function (err: Memcached.CommandData) {

                    if (err) {
                        reject(err);
                    }
                    resolve(true);
                });
            });
    }

}
