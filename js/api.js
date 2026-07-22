// REST API
function doGet(e){

  if(e.parameter.key != API_KEY){

    return outputJSON({
      success:false,
      message:"Unauthorized"
    });

  }

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

          e.parameter.skip=="true"

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

    // ===============================
    // CEK API KEY
    // ===============================
    if(req.key != API_KEY){

      return outputJSON({

        success:false,
        message:"Unauthorized"

      });

    }

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

/* ==========================================
   API CONFIG
========================================== */

const API_URL =
"https://script.google.com/macros/s/AKfycby3PNvsf31qdX_-mDILidHyCZV62cDK2DZB38i1otuhthqKfrXLeUhZY2yzTslVWQpj/exec";

const API_KEY =
"SBR-HR-2026-9d7KxL82Pq";


/* ==========================================
   GET
========================================== */

async function apiGet(action, params = {}) {

    params.action = action;
    params.key = API_KEY;

    const query = new URLSearchParams(params);

    const response = await fetch(
        API_URL + "?" + query.toString()
    );

    return await response.json();

}


/* ==========================================
   POST
========================================== */

async function apiPost(action, data = {}) {

    data.action = action;
    data.key = API_KEY;

    const response = await fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(data)

    });

    return await response.json();

}

async function loadData(){

    try{

        showLoading("📄 Memuat data...");

        DATA = await apiGet("getData");

        renderTable(DATA);

        await loadDashboard();

        hideLoading();

    }
    catch(err){

        hideLoading();

        console.error(err);

        Swal.fire({

            icon:"error",

            title:"Error",

            text:err.message

        });

    }

}

async function loadDashboard(){

    const dash = await apiGet("getDashboard");

    document.getElementById("totalData").innerHTML =
        dash.total;

    document.getElementById("belumKirim").innerHTML =
        dash.belum;

    document.getElementById("sudahKirim").innerHTML =
        dash.terkirim;

}
