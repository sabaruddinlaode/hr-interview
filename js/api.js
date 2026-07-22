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

function doPost(e){

  try{

    const req = JSON.parse(e.postData.contents);

    switch(req.action){

      case "updateStatus":

        return outputJSON({

          success: updateStatus(
            req.noWa,
            req.status
          )

        });

      case "saveTemplateWA":

        saveTemplateWA(req.template);

        return outputJSON({

          success:true

        });

      case "importExcel":

        return outputJSON({

          jumlah: importExcel(req.rows)

        });

      case "terkirimSemua":

        return outputJSON({

          jumlah: terkirimSemua()

        });

      default:

        return outputJSON({

          success:false,
          message:"Action tidak dikenal."

        });

    }

  }catch(err){

    return outputJSON({

      success:false,
      message:err.toString()

    });

  }

}
