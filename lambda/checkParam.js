
module.exports = async (event, app) => {
    
    let key = Object.keys(event['queryParams']);
    let value = Object.values(event['queryParams']);
    
    //判斷request 陣列長度 是否符合
    if ( key.length != app.length ) {
        return reserr('參數漏填，欄位長度不符合', 310, "error");
    }
    
    //判斷欄位是否符合
    let result = key.filter((e) => {
        return app.indexOf(e) > -1;
    });
    
    //欄位符合後，判定陣列長度 是否為符合
    if ( result.length != app.length ) {
        return reserr("參數漏填，欄位對應不符合", 310, "error");
    }
    
    //判斷 platform 是否 = android , ios
    let platform = event['queryParams']['platform'];
    let phone = ["android", "ios"];
    if ( !phone.includes(platform) ) {
        return reserr( "參數錯誤，" + 'platform 欄位, 限定為 android or ios', 300, "error" );
    }
    
    
    let error = [undefined, null, "", "0"];
    //欄位參數值 不得為undefined or null
    for (let i = 0; i < value.length; i++) {
        if ( error.includes(value[i]) ) {
            return reserr( "參數錯誤，" + Object.keys(event['queryParams'])[i] + 
            "欄位 不可為 undefined or null or 0", 300, "error");
        }
    }
    
    // 判斷式 如有錯誤 返回error
    function reserr( res, code, state) {
        let reserr = {
            result : {
                state : state,
                code : code,
                message : res
            }
        };
        return reserr;
    }
    
    return true;
};