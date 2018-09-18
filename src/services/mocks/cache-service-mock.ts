import * as svc from "../";
import { Injectable } from "injection-js";

/**
 * A simple cache layer using memcached.
 */

@Injectable()
export class CacheServiceMock {


    constructor(private logging: svc.LoggingService) {


    }

    public async set(key: string, data: any, lifetimeSec: number): Promise<boolean> {

        return true;
    }


    public async get(key: string): Promise<any> {

        return undefined;
    }

}
