const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const checkParam = require("./checkParam");

exports.handler = async (event, context) => {
    
    console.info("EVENT\n" + JSON.stringify(event, null, 2));
    
    // 判斷式 如有錯誤 返回error
    let response;
    
    let versionCode = event['queryParams']['versionCode'];//Number( event['queryParams']['versionCode'] );
    let versionName = event['queryParams']['versionName'];
    let platform = event['queryParams']['platform'];
    
    let iosAppVersion;
    let prm;
    if(platform==='android'){
    //判定 參數 是否 符合
        let param = ['versionCode', 'platform'];
        let res = await checkParam(event, param);
        if ( res != true ) {
            return res;
        }
    }
    else{
        //判定 參數 是否 符合
        let param = ['versionName', 'platform'];
        let res = await checkParam(event, param);
        if ( res != true ) {
            return res;
        }
        
        //讀取 Ios 版本號
        prm = {
            tablename: "AppVersion",
            indexname: "versionName-versionCode-index",
            pk_name: "versionName",
            pk_prm: versionName,
        };
        let resIos = await queryIos(prm);
        
        if ( resIos.length != 0 ) {
            versionCode = resIos[0].versionCode;
            iosAppVersion = resIos[0].versionName.split('.').map(Number);
        }
        else {
            iosAppVersion = versionName.split('.').map(Number);
            versionCode = 0;
        }
    }
    
    let resSmall, resBig = [], iosForceBefore, iosForceNew;
    let state, code, message, update, isNotification, isForce;
    
    //查詢 test_AppVersion , isNotification = true
    prm = {
        tablename: "AppVersion",
        pk_name: "platform",
        pk_prm: platform,
    };
    resSmall = await queryNewSmall(prm);
    console.log('resSmall', resSmall);
    
    if ( resSmall[0].isForce == false ) {
        
        // android 判斷 versionCode
        // ios 判斷 versionName 分別判斷
        prm = {
            tablename: "AppVersion",
            pk_name: "platform",
            pk_prm: platform,
        };
        resBig = await queryNewBig(prm);
        
        if ( platform === 'android' ) {
            if ( versionCode < resBig[0].versionCode ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = resBig[0].isNotification;
                isForce = resBig[0].isForce;
            }
            else if ( resSmall[0].versionCode <= versionCode ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = false;
            }
            else if ( resBig[0].versionCode <= versionCode && versionCode < resSmall[0].versionCode ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = resSmall[0].isNotification;
                isForce = resSmall[0].isForce;
            }
            else {
                state = 'error';
                code = 520;
                message = '讀取失敗';
            }
        }
        else {
            iosForceNew = resSmall[0].versionName.split('.').map(Number);
            iosForceBefore = resBig[0].versionName.split('.').map(Number);
            
            if ( ( iosAppVersion[0] < iosForceBefore[0] ) || +
            ( iosAppVersion[0] == iosForceBefore[0] && iosAppVersion[1] < iosForceBefore[1] ) || +
            ( iosAppVersion[0] == iosForceBefore[0] && iosAppVersion[1] == iosForceBefore[1] && iosAppVersion[2] < iosForceBefore[2] ) ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = resBig[0].isNotification;
                isForce = resBig[0].isForce;
            }
            else if ( ( iosAppVersion[0] < iosForceNew[0] ) || +
            ( iosAppVersion[0] == iosForceNew[0] && iosAppVersion[1] < iosForceNew[1] ) || +
            ( iosAppVersion[0] == iosForceNew[0] && iosAppVersion[1] == iosForceNew[1] && iosAppVersion[2] < iosForceNew[2] ) ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = resSmall[0].isNotification;
                isForce = resSmall[0].isForce;
            }
            else if ( ( iosForceNew[0] <= iosAppVersion[0] ) || +
            ( iosForceNew[0] == iosAppVersion[0] && iosForceNew[1] <= iosAppVersion[1] ) || +
            ( iosForceNew[0] == iosAppVersion[0] && iosForceNew[1] == iosAppVersion[1] && iosForceNew[2] <= iosAppVersion[2] ) ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = false;
            }
            else {
                state = 'error';
                code = 520;
                message = '讀取失敗';
            }
        }
    }
    else if ( resSmall[0].isForce == true) {
        
        if ( platform === 'android' ) {
            if ( versionCode < resSmall[0].versionCode ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = resSmall[0].isNotification;
                isForce = resSmall[0].isForce;
            }
            else if ( resSmall[0].versionCode <= versionCode ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = false;
            }
            else {
                state = 'error';
                code = 520;
                message = '讀取失敗';
            }
        }
        else {
            iosForceNew = resSmall[0].versionName.split('.').map(Number);
            
            if ( ( iosAppVersion[0] < iosForceNew[0] ) || +
            ( iosAppVersion[0] == iosForceNew[0] && iosAppVersion[1] < iosForceNew[1] ) || +
            ( iosAppVersion[0] == iosForceNew[0] && iosAppVersion[1] == iosForceNew[1] && iosAppVersion[2] < iosForceNew[2] ) ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = resSmall[0].isNotification;
                isForce = resSmall[0].isForce;
            }
            else if ( ( iosForceNew[0] <= iosAppVersion[0] ) || +
            ( iosForceNew[0] == iosAppVersion[0] && iosForceNew[1] <= iosAppVersion[1] ) || +
            ( iosForceNew[0] == iosAppVersion[0] && iosForceNew[1] == iosAppVersion[1] && iosForceNew[2] <= iosAppVersion[2] ) ) {
                state = 'success';
                code = 220;
                message = '讀取成功';
                isNotification = false;
            }
            else {
                state = 'error';
                code = 520;
                message = '讀取失敗';
            }
        }
    }
    
    if(platform==='android'){
        response = {
            result : {
                state : state,
                code : code,
                message : message
            },
            data : {
                isNotification: isNotification,
                isForce: isForce
            }
        };
    }
    else{
        if(!isNotification){
            update='none';
        }
        else if(isNotification && isForce){
            update='force';
        }
        else{
            update='soft';
        }
        response = {
            result : {
                state : state,
                code : code,
                message : message
            },
            data : {
                update: update
            }
        };
    }
    
    console.log('response', response);
    return response;
};

//讀取 isNotification = true
function queryNewSmall(obj){
    return new Promise((resolve, reject) => {
        let params = {
            TableName: obj.tablename,
            KeyConditionExpression: "#pk_name = :pk_prm",
            ExpressionAttributeNames:{
                "#pk_name": obj.pk_name
            },
            ExpressionAttributeValues: {
                ":pk_prm": obj.pk_prm,
                ":isNotification": true
            },
            FilterExpression: "isNotification = :isNotification",
            ScanIndexForward: false
        };
        dynamoDB.query(params,function(err, data) {
            if (err) {
                reject(err, err);
            } else {
                resolve(data.Items);
            }
        });
    });
}

//讀取 isNotification = true , isForce = true
function queryNewBig(obj){
    return new Promise((resolve, reject) => {
        let params = {
            TableName: obj.tablename,
            KeyConditionExpression: "#pk_name = :pk_prm",
            ExpressionAttributeNames:{
                "#pk_name": obj.pk_name
            },
            ExpressionAttributeValues: {
                ":pk_prm": obj.pk_prm,
                ":isNotification": true,
                ":isForce": true
            },
            FilterExpression: "isNotification = :isNotification and isForce = :isForce",
            ScanIndexForward: false
        };
        dynamoDB.query(params,function(err, data) {
            if (err) {
                reject(err, err);
            } else {
                resolve(data.Items);
            }
        });
    });
}

//讀取 ios版本號
function queryIos(obj){
    return new Promise((resolve, reject) => {
        let params = {
            TableName: obj.tablename,
            IndexName: obj.indexname,
            KeyConditionExpression: "#pk_name = :pk_prm",
            ExpressionAttributeNames:{
                "#pk_name": obj.pk_name
            },
            ExpressionAttributeValues: {
                ":pk_prm": obj.pk_prm
            },
            ScanIndexForward: false
        };
        dynamoDB.query(params,function(err, data) {
            if (err) {
                reject(err, err);
            } else {
                resolve(data.Items);
            }
        });
    });
}

function checkCode(code){
    if ( code.startsWith('0') ) {
        return 16;
    }
    else {
        return 15;
    }
}