/* ==========================================
   HR Interview Management
   Main Application
========================================== */

/* ==========================================
   GLOBAL VARIABLE
========================================== */

let DATA = [];
let IMPORT_DATA = [];
let TEMPLATE = "";

let BROADCAST = [];
let INDEX_BROADCAST = 0;
let DELAY_BROADCAST = 2000;

let noWaKonfirmasi = "";
document.addEventListener("DOMContentLoaded", () => {

    loadData();

});


let DATA = [];
let noWaKonfirmasi = "";
let IMPORT_DATA = [];
let TEMPLATE = "";
let BROADCAST = [];
let INDEX_BROADCAST = 0;
let DELAY_BROADCAST = 2000;
let STOP_BROADCAST = false;


/* ================================
   LOAD DATA
================================ */

function loadData(){

    showLoading("📄 Memuat data...");

    google.script.run
    .withSuccessHandler(function(data){

        DATA = data;

        renderTable(DATA);

        loadDashboard();

        hideLoading();

    })

    .withFailureHandler(function(err){

        hideLoading();

        Swal.fire({
            icon:"error",
            title:"Error",
            text:err.message
        });

    })

    .getData();

}

/* ================================
   DASHBOARD
================================ */

function loadDashboard(){

  google.script.run
  .withSuccessHandler(function(res){

      document.getElementById("lblTotal").innerHTML = res.total;
      document.getElementById("lblBelum").innerHTML = res.belum;
      document.getElementById("lblKirim").innerHTML = res.terkirim;

  })
  .getDashboard();

}


/* ================================
   TAMPILKAN TABEL
================================ */

function renderTable(data){

    let html = "";

    if(data.length == 0){

        html = `
        <tr>
            <td colspan="8" class="text-center">
                Tidak ada data
            </td>
        </tr>`;

        document.getElementById("tblData").innerHTML = html;
        return;
    }

    data.forEach(function(r, i){

        let status = "";
        let tombol = "";

        // Ambil status
        let sts = String(r[5] || "").trim().toUpperCase();

        // Jika kosong atau status tidak dikenal, anggap BELUM
        if(sts == "" || (sts != "BELUM" && sts != "SIAP DIKIRIM" && sts != "TERKIRIM")){
            sts = "BELUM";
        }

        // =========================
        // STATUS BELUM
        // =========================
        if(sts == "BELUM"){

            status = '<span class="badge bg-warning text-dark">BELUM</span>';

            tombol = `
                <button class="btn btn-success btn-sm"
                    onclick="kirimWA(${i})">
                    📲 Kirim
                </button>
            `;

        }

        // =========================
        // STATUS SIAP DIKIRIM
        // =========================
        else if(sts == "SIAP DIKIRIM"){

            status = '<span class="badge bg-info">SIAP DIKIRIM</span>';

            tombol = `
                <button class="btn btn-warning btn-sm me-1"
                    onclick="kirimWA(${i})">
                    🔄 Kirim Ulang
                </button>

                <button class="btn btn-primary btn-sm"
                    onclick="konfirmasiTerkirim(${i})">

                    ✅ Terkirim

                    </button>
            `;

        }

        // =========================
        // STATUS TERKIRIM
        // =========================
        else{

            status = '<span class="badge bg-secondary">TERKIRIM</span>';

            tombol = `
                <button class="btn btn-secondary btn-sm" disabled>
                    ✔ Terkirim
                </button>
            `;

        }

        html += `
        <tr>

            <td class="text-center">${i+1}</td>

            <td>${r[0]}</td>

            <td>${r[1]}</td>

            <td>${r[2]}</td>

            <td>${r[3]}</td>

            <td>${r[4]}</td>

            <td class="text-center">${status}</td>

            <td class="text-center">${tombol}</td>

        </tr>
        `;

    });

    document.getElementById("tblData").innerHTML = html;

}
/* ================================
   KIRIM WA
================================ */

function kirimWA(index){

    let r = DATA[index];

    google.script.run
    .withSuccessHandler(function(template){

        let pesan = buatPesan(r);

        let no = String(r[1]).replace(/\D/g,'');

        if(no.startsWith("0")){
            no = "62" + no.substring(1);
        }

        let url =
            "whatsapp://send?phone=" +
            no +
            "&text=" +
            encodeURIComponent(pesan);

        window.location.href = url;

        google.script.run
        .withSuccessHandler(function(){

            loadData();

        })
        .updateStatus(r[1],"SIAP DIKIRIM");

    })
    .getTemplateWA();

}



/* ================================
   KIRIM BERIKUTNYA
================================ */

function kirimBerikutnya(){

    google.script.run
    .withSuccessHandler(function(r){

        if(r==null){

            Swal.fire({
                icon:"info",
                title:"Selesai",
                text:"Semua pelamar sudah dikirim."
            });

            return;

        }

        google.script.run
        .withSuccessHandler(function(template){

            let pesan = buatPesan(r);

            let no = String(r[1]).replace(/\D/g,'');

            if(no.startsWith("0")){
                no = "62" + no.substring(1);
            }

            let url =
                "whatsapp://send?phone=" +
                no +
                "&text=" +
                encodeURIComponent(pesan);

            window.location.href = url;

            google.script.run
            .withSuccessHandler(function(){

                loadData();

            })
            .updateStatus(r[1],"SIAP DIKIRIM");

        })
        .getTemplateWA();

    })
    .getNextCandidate();

}


/* ================================
   SEARCH
================================ */

document.getElementById("txtCari")
.addEventListener("keyup",function(){

    let key=this.value.toLowerCase();

    let hasil = DATA.filter(function(r){

        return (
            r[0].toLowerCase().includes(key) ||
            r[2].toLowerCase().includes(key) ||
            r[1].toLowerCase().includes(key)
        );

    });

    renderTable(hasil);

});


/* ================================
   REFRESH
================================ */

function refreshData(){

    loadData();

}


/* ================================
   START
================================ */

window.onload = function(){

    showLoading("⏳ Memuat data...");

    google.script.run
    .withSuccessHandler(function(template){

        TEMPLATE = template;

        loadData();

    })
    .getTemplateWA();

}

function konfirmasiTerkirim(index){

    let r = DATA[index];

    noWaKonfirmasi = r[1];

    document.getElementById("modalNama").innerHTML = r[0];
    document.getElementById("modalWA").innerHTML = r[1];

    let modal = new bootstrap.Modal(
        document.getElementById("modalTerkirim")
    );

    modal.show();

}

function prosesTerkirim(){

    showSaving();

    google.script.run
    .withSuccessHandler(function(){

        hideSaving();

        bootstrap.Modal
        .getInstance(
            document.getElementById("modalTerkirim")
        )
        .hide();

        loadData();

    })
    .withFailureHandler(function(err){

        hideSaving();

        alert(err.message);

    })
    .updateStatus(noWaKonfirmasi,"TERKIRIM");

}

function showSaving(){

    document.getElementById("savingOverlay").style.display="block";

}

function hideSaving(){

    document.getElementById("savingOverlay").style.display="none";

}

/* ================================
   IMPORT EXCEL
================================ */

function pilihFileImport(){

    document.getElementById("fileExcel").click();

}

function bacaFileExcel(e){

    const file = e.target.files[0];

    if(!file){
        return;
    }

    alert("File dipilih : " + file.name);

}

function bacaFileExcel(e){

    const file = e.target.files[0];

    if(!file) return;

    document.getElementById("loading").style.display="block";

    const reader = new FileReader();

    reader.onload = function(evt){

        const data = new Uint8Array(evt.target.result);

        const workbook = XLSX.read(data,{type:"array"});

        const sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet,{
            header:1,
            defval:""
        });

        hideLoading();

        previewImport(rows,file.name);

    };

    reader.readAsArrayBuffer(file);

}

function previewImport(rows,fileName){

    if(rows.length<=1){

        alert("File tidak memiliki data.");

        return;

    }

    let jumlah = rows.length-1;

    let pesan = "";

    pesan += "File : " + fileName + "\n\n";

    pesan += "Jumlah Data : " + jumlah + "\n\n";

    pesan += "Preview :\n\n";

    for(let i=1;i<Math.min(rows.length,6);i++){

        pesan +=
        rows[i][0] +
        " | " +
        rows[i][1] +
        " | " +
        rows[i][2] +
        "\n";

    }

    alert(pesan);

}

function previewImport(rows,fileName){

    if(rows.length <= 1){

        alert("File tidak memiliki data.");

        return;

    }

    IMPORT_DATA = rows;

    document.getElementById("namaFile").innerHTML = fileName;

    document.getElementById("jumlahData").innerHTML = rows.length - 1;

    let html="";

    for(let i=1;i<Math.min(rows.length,6);i++){

        html += `
        <tr>

            <td>${rows[i][0]}</td>

            <td>${rows[i][1]}</td>

            <td>${rows[i][2]}</td>

            <td>${rows[i][3]}</td>

            <td>${rows[i][4]}</td>

        </tr>
        `;

    }

    document.getElementById("previewImport").innerHTML = html;

    let modal = new bootstrap.Modal(
        document.getElementById("modalImport")
    );

    modal.show();

}

function importSekarang(){

    if(IMPORT_DATA.length<=1){

        alert("Tidak ada data.");

        return;

    }

    showLoading("⏳ Mengimpor data...");

    let rows=[];

    for(let i=1;i<IMPORT_DATA.length;i++){

        rows.push([

            IMPORT_DATA[i][0],
            IMPORT_DATA[i][1],
            IMPORT_DATA[i][2],
            IMPORT_DATA[i][3],
            IMPORT_DATA[i][4]

        ]);

    }

    google.script.run

    .withSuccessHandler(function(jumlah){

        hideLoading();

        bootstrap.Modal
        .getInstance(
        document.getElementById("modalImport"))
        .hide();

        Swal.fire({
    icon: "success",
    title: "Import Berhasil",
    text: jumlah + " data berhasil diimport.",
    confirmButtonText: "OK",
    confirmButtonColor: "#198754"
});

        loadData();

    })

    .withFailureHandler(function(err){

        hideLoading();

        alert(err.message);

    })

    .importExcel(rows);

}

/* ================================
   EXPORT CSV
================================ */

function exportCSV(){

    showLoading("📤 Mengekspor data...");

    google.script.run

    .withSuccessHandler(function(csv){

        document.getElementById("loading").style.display = "none";

        const blob = new Blob(
            ["\ufeff" + csv], // UTF-8 BOM agar karakter Indonesia tampil benar di Excel
            {type:"text/csv;charset=utf-8;"}
        );

        const link = document.createElement("a");

        const url = URL.createObjectURL(blob);

        const tgl = new Date();

        const namaFile =
            "Data Pelamar " +
            String(tgl.getDate()).padStart(2,"0") + "-" +
            String(tgl.getMonth()+1).padStart(2,"0") + "-" +
            tgl.getFullYear() +
            ".csv";

        link.href = url;
        link.download = namaFile;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);

    })

    .withFailureHandler(function(err){

        document.getElementById("loading").style.display = "none";

        alert(err.message);

    })

    .exportCSV();

}

function showLoading(text){

    document.getElementById("loadingText").innerHTML = text;

    document.getElementById("loading").style.display = "block";

}

function hideLoading(){

    document.getElementById("loading").style.display = "none";

}

function bukaTemplate(){

    google.script.run
    .withSuccessHandler(function(txt){

        const box = document.getElementById("txtTemplate");

        if(!box){
            Swal.fire(
                "Error",
                "Textarea Template tidak ditemukan.",
                "error"
            );
            return;
        }

        box.value = txt;

        const modal =
            new bootstrap.Modal(
                document.getElementById("modalTemplate")
            );

        modal.show();

    })
    .getTemplateWA();

}

function simpanTemplate(){

    let isi = document.getElementById("txtTemplate").value;

    showLoading("💾 Menyimpan Template...");

    google.script.run

    .withSuccessHandler(function(){

        hideLoading();

        // update cache
        TEMPLATE = isi;

        bootstrap.Modal
        .getInstance(document.getElementById("modalTemplate"))
        .hide();

        Swal.fire({
            icon:"success",
            title:"Berhasil",
            text:"Template berhasil disimpan."
        });

    })

    .withFailureHandler(function(err){

        hideLoading();

        Swal.fire({
            icon:"error",
            title:"Gagal",
            text:err.message
        });

    })

    .saveTemplateWA(isi);

}

function buatPesan(r){

    return TEMPLATE

    .replaceAll("{NAMA}", r[0])
    .replaceAll("{NOWA}", r[1])
    .replaceAll("{POSISI}", r[2])
    .replaceAll("{TANGGAL}", r[3])
    .replaceAll("{JAM}", r[4]);

}

function showBroadcast(){

    new bootstrap.Modal(
        document.getElementById("modalBroadcast")
    ).show();

}

function mulaiBroadcast(){

    let jumlah = parseInt(document.getElementById("broadcastJumlah").value);

    let delay = parseInt(document.getElementById("broadcastDelay").value);

    let skip = document.getElementById("skipSent").checked;

    bootstrap.Modal
        .getInstance(document.getElementById("modalBroadcast"))
        .hide();

    showLoading("⏳ Menyiapkan Broadcast...");

    google.script.run
    .withSuccessHandler(function(data){

        hideLoading();

        if(data.length == 0){

            Swal.fire({
                icon:"info",
                title:"Broadcast",
                text:"Tidak ada data yang bisa dikirim."
            });

            return;
        }

        BROADCAST = data;
        INDEX_BROADCAST = 0;
        DELAY_BROADCAST = delay * 1000;

        STOP_BROADCAST = false;

        // reset progress
        document.getElementById("progressBar").style.width = "0%";
        document.getElementById("progressBar").innerHTML = "0%";
        document.getElementById("lblProgress").innerHTML = "0 / " + data.length;
        document.getElementById("lblNama").innerHTML = "-";
        document.getElementById("lblWA").innerHTML = "-";

        // tampilkan modal progress
        new bootstrap.Modal(
            document.getElementById("modalProgress")
        ).show();

        prosesBroadcast();

    })

    .withFailureHandler(function(err){

        hideLoading();

        Swal.fire({
            icon:"error",
            title:"Error",
            text:err.message
        });

    })

    .getBroadcastData(jumlah, skip);

}


function prosesBroadcast(){

    if(STOP_BROADCAST){

        bootstrap.Modal
        .getInstance(document.getElementById("modalProgress"))
        .hide();

        Swal.fire({
            icon:"warning",
            title:"Broadcast dihentikan"
        });

        loadData();

        return;
    }

    if(INDEX_BROADCAST >= BROADCAST.length){

        bootstrap.Modal
        .getInstance(document.getElementById("modalProgress"))
        .hide();

        Swal.fire({
            icon:"success",
            title:"Selesai",
            text:"Broadcast selesai."
        });

        loadData();

        return;
    }

    let r = BROADCAST[INDEX_BROADCAST];

    let persen = Math.round(
        ((INDEX_BROADCAST+1)/BROADCAST.length)*100
    );

    document.getElementById("progressBar").style.width =
        persen+"%";

    document.getElementById("progressBar").innerHTML =
        persen+"%";

    document.getElementById("lblProgress").innerHTML =
        (INDEX_BROADCAST+1)+" / "+BROADCAST.length;

    document.getElementById("lblNama").innerHTML =
        r[0];

    document.getElementById("lblWA").innerHTML =
        r[1];

    let pesan = buatPesan(r);

    let no = String(r[1]).replace(/\D/g,'');

    if(no.startsWith("0")){
        no = "62"+no.substring(1);
    }

    let url =
        "whatsapp://send?phone="+
        no+
        "&text="+
        encodeURIComponent(pesan);

    window.location.href = url;

    google.script.run.updateStatus(r[1],"SIAP DIKIRIM");

    INDEX_BROADCAST++;

    setTimeout(prosesBroadcast, DELAY_BROADCAST);

}

function terkirimSemua(){

    Swal.fire({

        title: "Konfirmasi",

        html:
        "Semua data dengan status <b>SIAP DIKIRIM</b><br>" +
        "akan diubah menjadi <b>TERKIRIM</b>.",

        icon: "question",

        showCancelButton: true,

        confirmButtonText: "Ya, Tandai Semua",

        cancelButtonText: "Batal",

        confirmButtonColor: "#198754"

    }).then((result)=>{

        if(!result.isConfirmed) return;

        showLoading("💾 Mengubah status...");

        google.script.run

        .withSuccessHandler(function(jumlah){

            hideLoading();

            Swal.fire({

                icon:"success",

                title:"Berhasil",

                text: jumlah + " data berhasil diperbarui."

            });

            loadData();

        })

        .withFailureHandler(function(err){

            hideLoading();

            Swal.fire({

                icon:"error",

                title:"Error",

                text:err.message

            });

        })

        .terkirimSemua();

    });

}

function stopBroadcast(){

    STOP_BROADCAST = true;

}
