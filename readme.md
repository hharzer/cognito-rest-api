
# Cognito Rest Api

A simple rest api wrapper for cognito user pools so that you can have full control of the UI.

Swagger documentation generated.

Additional validation customization as opposed to generic AWS cognito user pools:

1. Validate token function takes into account signed out tokens.  Once a user is signed out, even if the token is not expired, tokens will not be valid. 
2. A refresh token can be used to generate a new access token, provided the previous access token has not been expired for more an hour.
3. User records (No passwords) also stored in MySql.
4. Access tokens issued are recorded in MySql.
5. There is the ability to blacklist active tokens since issued tokens are recorded.


## Cognito Setup

### Create User pool

change ? for your own values

aws cognito-idp create-user-pool --cli-input-json  file://..pathto..\deploy\cognito-userpool.json

### Retrieve user pool key for validating tokens

when logged into console:  https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json

### Create User pool client

Lookup pool Id created in create-user-pool step.

aws cognito-idp create-user-pool-client --cli-input-json file://..pathto..\deploy\cognito-userpool-client.json 


### Environment Setup

Use returned clientId and poolId from above in config
Also set the contents of public key file to the COGNITO_PUBLIC_KEYS value.  (JSON encoded)

Keys required:

COGNITO_SETTINGS={"clientId":"***********","poolId":"*****"}
COGNITO_PUBLIC_KEYS={"keys":[{*** Content of cognito public key file***"}]}

DATABASE_HOST=localhost
DATABASE_NAME=?
DATABASE_USERNAME=?
DATABASE_PASSWORD=?

PORT=1000
UI_WEBSITE_URI=http://localhost:8080
CORS=*
MEMCACHED_CONFIGURATION=127.0.0.1:11211


### Customize messaging

Set message customization lambda in triggers.