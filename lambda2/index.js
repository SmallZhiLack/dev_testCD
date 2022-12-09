exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: `<meta charset="utf-8"><h1>我們是 創星幫 牛皮的</h1>`,
  };
};