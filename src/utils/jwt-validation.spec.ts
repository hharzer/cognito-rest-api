import { expect } from "chai";
import { JWTValidation } from "./jwt-validation";
import { IAuthorizationResult, ICognitoSetting } from "../models";

// // The assumption is that /user/user-rights is a Portal allowable route.

beforeEach(function () {
    // runs before all tests in this block
    //  process.env.AWS_REGION = "eu-west-1";
});

function getKeys(): any {
    // tslint:disable-next-line:max-line-length
    return JSON.parse('{"keys":[{"alg":"RS256","e":"AQAB","kid":"MewZWIQ4b0K/4XdldtXnm+nXl8g5tFmm7BdrYWlegrw=","kty":"RSA","n":"q6P-AcrWjySgNN8k34Ip6nmWoMZs2jxfLn_ccOtgaztNfSpO0VIW_k5Kkltr_gsY-JgLqcuPFTUW5bE_u6qGxyWq013d6a5LuurWIvPDSmBh2Cm6qhfPGJMvZUYWBE7SMPjqkJz6tEkTdMsSu6iifEZnHdtViLEcSYs1xC5KY52MaYoq3-tkVaaw81c-qf-Icir4o1d3jc1PrcR-U399THGCFvlkz7lGbYeRUJyXgJwxmiVv4Z2pWucwjHFDxGP5Fqm-BGZDy40fVHbs85RjCQUdKofQQ17ociLzqZPOA2ceGnlQ6gMBlv-xkEdJbq--xW49FjZ9LZ92fZ8pVmDKKw","use":"sig"},{"alg":"RS256","e":"AQAB","kid":"Nb8Tsh7OHofRDKhvJQsgWyHIQKDCiAxXoIDKwITWrfc=","kty":"RSA","n":"o1njbwscdrjUa9E60CSGbPAO1XKYSjC3bqZuM8BeTuEJqx-KcGgros6hHR_iVEjgatQ9CQDeyanuZVI5i9LBVjH7VNaIUqKozfFs56l8dsXObGhNrzk2-xr_ldocrnT5OGG_aN4qJTe3VLGl1G5P7TVP4tJ4umu_Xt9i_YlnuPMAi3btKJuIgyWpQrFyXN58uq6UcB3MXOi03PTL6bEx5151uIFpi44MFM4xB0nxzvI5ozpgbACEy8DFAxfM8emDCkW3KWEBsDnTLolgf2hUmntPVDgXoouODESCa_FL8crvPKC9fijdhqEKksQTOLor-6c-32ET67Eqy4B9-V_JYQ","use":"sig"}]}');
}

describe("jwt-validation", () => {

    it("If no token provided should return TokenNotProvided", () => {

        let clientAppSetting: ICognitoSetting = JSON.parse("[{'name':'Portal','clientId':'1m0mc93k6qsq9kkq8r72jot6c6','poolId':'eu-west-1_WT3N4eEfP'}]".replace(/'/g, '"'));

        let result: IAuthorizationResult = JWTValidation.validateToken(null, clientAppSetting, "eu-west-1", getKeys());

        expect(result.isAuthenticated).to.equal(false);
        expect(result.errorCode).to.equal("TokenNotProvided");

    });


    it("If invalid token provided, should return FailedToDecodeToken", () => {

        let clientAppSetting: ICognitoSetting = JSON.parse("{'name':'Portal','clientId':'1m0mc93k6qsq9kkq8r72jot6c6','poolId':'eu-west-1_WT3N4eEfP'}".replace(/'/g, '"'));

        let result: IAuthorizationResult = JWTValidation.validateToken("**badtoken**", clientAppSetting, "eu-west-1", getKeys());

        expect(result.isAuthenticated).to.equal(false);
        expect(result.errorCode).to.equal("FailedToDecodeToken");

    });


    it("If decodable token provided but has expired, should return TokenExpired", () => {

        let clientAppSetting: ICognitoSetting = JSON.parse("{'name':'Portal','clientId':'1m0mc93k6qsq9kkq8r72jot6c6','poolId':'eu-west-1_WT3N4eEfP'}".replace(/'/g, '"'));

        const token: string = "eyJraWQiOiJOYjhUc2g3T0hvZlJES2h2SlFzZ1d5SElRS0RDaUF4WG9JREt3SVRXcmZjPSIsImFsZyI6IlJTMjU2In0" +
            ".eyJzdWIiOiJiMTVkZDk5Yy01MjIzLTQ0MGMtYWU1ZS03M2FkOTIwZjBmMjYiLCJldmVudF9pZCI6IjI3M2NkZmUxLTNmMjktMTFlOC04NDI2LTRiY" +
            "2ViNDk5Y2M0YSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE1" +
            "MjM2MzA3MDcsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5ldS13ZXN0LTEuYW1hem9uYXdzLmNvbVwvZXUtd2VzdC0xX1dUM040ZUVmUCIsImV4" +
            "cCI6MTUyMzYzNDMwNywiaWF0IjoxNTIzNjMwNzA3LCJqdGkiOiJjOTQ0NDMyOC1mZmQyLTQxNzgtOGFlNy01YTk0ODcyMzI1OTkiLCJjbGllbnRfaWQiOi" +
            "IxbTBtYzkzazZxc3E5a2txOHI3MmpvdDZjNiIsInVzZXJuYW1lIjoiYjE1ZGQ5OWMtNTIyMy00NDBjLWFlNWUtNzNhZDkyMGYwZjI2In0.Z5GFTtxNfnTEbu3" +
            "igoIK2iAsKPrt7q3CvByDjB7N9BYT_H9MuMD8L5K0V7UdBw7DtXebFBiPaBLQFRjD4wKvkl3SO58nCcVILiklvD76LdlKk9SvGti014Z78mDMtWzAVebs9t8m7l4" +
            "SIZ1sKwGTYTfA0Z0EG13Umq5oCNXgb1ou6fCNznhO_76DaaZiAmua2kJxZZ7Cca5kbeNr44pORXqUu6eHcETzMtgcjkhn1y_q2qcJC1GQKo8qJxqkr_kzxDSeJhMcO" +
            "NYxUlWE7nhTjGIAbyLtvV_r1QyGjchQRfiAa2ajQL1Tp2wXmjQhrz5dYiD6HL5n1Uh7_1nXBvf1yA";

        let result: IAuthorizationResult = JWTValidation.validateToken(token, clientAppSetting, "eu-west-1", getKeys());

        expect(result.isAuthenticated).to.equal(false);
        expect(result.errorCode).to.equal("TokenExpired");

    });



    it("If decodable token provided but has invalid signature, should return TokenNotValid", () => {

        let clientAppSettings: ICognitoSetting = JSON.parse("{'name':'Portal','clientId':'1m0mc93k6qsq9kkq8r72jot6c6','poolId':'eu-west-1_WT3N4eEfP'}".replace(/'/g, '"'));

        const token: string = "eyJraWQiOiJOYjhUc2g3T0hvZlJES2h2SlFzZ1d5SElRS0RDaUF4WG9JREt3SVRXcmZjPSIsImFsZyI6IlJTMjU2In0" +
            ".eyJzdWIiOiJiMTVkZDk5Yy01MjIzLTQ0MGMtYWU1ZS03M2FkOTIwZjBmMjYiLCJldmVudF9pZCI6IjI3M2NkZmUxLTNmMjktMTFlOC04NDI2LTRiY" +
            "2ViNDk5Y2M0YSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE1" +
            "MjM2MzA3MDcsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5ldS13ZXN0LTEuYW1hem9uYXdzLmNvbVwvZXUtd2VzdC0xX1dUM040ZUVmUCIsImV4" +
            "cCI6MTUyMzYzNDMwNywiaWF0IjoxNTIzNjMwNzA3LCJqdGkiOiJjOTQ0NDMyOC1mZmQyLTQxNzgtOGFlNy01YTk0ODcyMzI1OTkiLCJjbGllbnRfaWQiOi" +
            "IxbTBtYzkzazZxc3E5a2txOHI3MmpvdDZjNiIsInVzZXJuYW1lIjoiYjE1ZGQ5OWMtNTIyMy00NDBjLWFlNWUtNzNhZDkyMGYwZjI2In0.Z5GFTtxNfnTEbu3" +
            "igoIK2iAsKPrt7q3CvByDjB7N9BYT_H9MuMD8L5K0V7UdBw7DtXebFBiPaBLQFRjD4wKvkl3SO58nCcVILiklvD76LdlKk9SvGti014Z78mDMtWzAVebs9t8m7l4" +
            "SIZ1sKwGTYTfA0Z0EG13Umq5oCNXgb1ou6fCNznhO_76DaaZiAmua2kJxZZ7Cca5kbeNr44pORXqUu6eHcETzMtgcjkhn1y_q2qcJC1GQKo8qJxqkr_kzxDSeJhMcO" +
            "NYxUlWE7nhTjGIAbyLtvV_r1QyGjchQRfiAa2ajQL1Tp2wXmjQhrz5dYiD6HL5n1Uh7_1nXBvf1yA--BAD--";


        let result: IAuthorizationResult = JWTValidation.validateToken(token, clientAppSettings, "eu-west-1", getKeys());

        expect(result.isAuthenticated).to.equal(false);
        expect(result.errorCode).to.equal("TokenNotValid");

    });



    it("If token issued by another issuer, should return Issuer not authorized.", () => {

        const token: string = "eyJraWQiOiJOYjhUc2g3T0hvZlJES2h2SlFzZ1d5SElRS0RDaUF4WG9JREt3SVRXcmZjPSIsImFsZyI6IlJTMjU2In0" +
            ".eyJzdWIiOiJiMTVkZDk5Yy01MjIzLTQ0MGMtYWU1ZS03M2FkOTIwZjBmMjYiLCJldmVudF9pZCI6IjI3M2NkZmUxLTNmMjktMTFlOC04NDI2LTRiY" +
            "2ViNDk5Y2M0YSIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiYXdzLmNvZ25pdG8uc2lnbmluLnVzZXIuYWRtaW4iLCJhdXRoX3RpbWUiOjE1" +
            "MjM2MzA3MDcsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC5ldS13ZXN0LTEuYW1hem9uYXdzLmNvbVwvZXUtd2VzdC0xX1dUM040ZUVmUCIsImV4" +
            "cCI6MTUyMzYzNDMwNywiaWF0IjoxNTIzNjMwNzA3LCJqdGkiOiJjOTQ0NDMyOC1mZmQyLTQxNzgtOGFlNy01YTk0ODcyMzI1OTkiLCJjbGllbnRfaWQiOi" +
            "IxbTBtYzkzazZxc3E5a2txOHI3MmpvdDZjNiIsInVzZXJuYW1lIjoiYjE1ZGQ5OWMtNTIyMy00NDBjLWFlNWUtNzNhZDkyMGYwZjI2In0.Z5GFTtxNfnTEbu3" +
            "igoIK2iAsKPrt7q3CvByDjB7N9BYT_H9MuMD8L5K0V7UdBw7DtXebFBiPaBLQFRjD4wKvkl3SO58nCcVILiklvD76LdlKk9SvGti014Z78mDMtWzAVebs9t8m7l4" +
            "SIZ1sKwGTYTfA0Z0EG13Umq5oCNXgb1ou6fCNznhO_76DaaZiAmua2kJxZZ7Cca5kbeNr44pORXqUu6eHcETzMtgcjkhn1y_q2qcJC1GQKo8qJxqkr_kzxDSeJhMcO" +
            "NYxUlWE7nhTjGIAbyLtvV_r1QyGjchQRfiAa2ajQL1Tp2wXmjQhrz5dYiD6HL5n1Uh7_1nXBvf1yA";

        let clientAppSettings: ICognitoSetting = JSON.parse("{'name':'Portal','clientId':'1m0mc93k6qsq9kkq8r72jot6c6','poolId':'wrongpool'}".replace(/'/g, '"'));

        let result: IAuthorizationResult = JWTValidation.validateToken(token, clientAppSettings, "eu-west-1", getKeys());

        expect(result.isAuthenticated).to.equal(false);
        expect(result.errorCode).to.equal("TokenIssuerNotAuthorized");

    });


});

