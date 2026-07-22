// REST API
function doGet(e){

  const action = e.parameter.action;

  switch(action){

    case "getData":
      return outputJSON(getData());

    case "getDashboard":
      return outputJSON(getDashboard());

    case "getTemplateWA":
      return outputJSON(getTemplateWA());

    case "getBroadcastData":

      return outputJSON(
        getBroadcastData(
          Number(e.parameter.jumlah),
          e.parameter.skip == "true"
        )
      );

    default:

      return outputJSON({
        success:false,
        message:"Action tidak ditemukan."
      });

  }

}

function outputJSON(data){

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(ContentService.MimeType.JSON);

}
