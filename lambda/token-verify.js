//token機制
const SECRET = 'TopTok_SECRET';
const jwt = require('jsonwebtoken');

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const environment = 'test_';

module.exports = async (Auth) => {
    
    if(Auth=='undefined'||Auth==undefined){
        let response = {
            result:{
                state: "error",
                code: 400,
                message: "無效的Token"
            }
        };
        console.log("response", response);
        return response;
    }
    
    let decode;
    try {
        decode = jwt.verify(Auth, SECRET);
    }catch (err){
        //return err;
        if(err.message==='jwt expired'){
            let response = {
                result:{
                    state: "error",
                    code: 403,
                    message: 'token已過期'
                }
            };
            console.log("response:",response);
            return response;
            
        }else{
            let response = {
                result:{
                    state: "error",
                    code: 402,
                    message: 'token驗證失敗'
                }
            };
            console.log("response", response);
            return response;
        }
    }
    
    let uId = decode.uId; 
    let appId = decode.appId;
    let type = decode.type;
    let res = await getUID(uId);
    console.log('res', res);
    
    if(res.Item==undefined||res.Item.appId!=appId||res.Item.type!=type){
        let response = {
            result:{
                state: "error",
                code: 400,
                message: "無效的Token"
            }
        };
        console.log("response:",response);
        return response;
    }

    if(res.Item.accessToken!=Auth){
        let response = {
            result:{
                state: "error",
                code: 406,
                message: "Token異常或已在另一台裝置登入"
            }
        };
        console.log("response:",response);
        return response;
    }
    
};


//查詢有無UID
async function getUID(uId){
    
    const get_params = {
        TableName : environment+'UserID',
        Key: {
            uId: uId
        }
    };
    
    try {
        const data = await dynamoDB.get(get_params).promise();
        return data;
    } catch (err) {
        return err;
    }
}
