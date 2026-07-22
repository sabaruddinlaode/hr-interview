/* ==========================================
   HR Interview Management
   Main Application (GitHub Version)
========================================== */

let DATA = [];
let TEMPLATE = "";
let IMPORT_DATA = [];
let BROADCAST = [];
let INDEX_BROADCAST = 0;
let DELAY_BROADCAST = 2000;
let STOP_BROADCAST = false;
let noWaKonfirmasi = "";

/* ================================
   LOAD DATA
================================ */

async function loadData(){

    try{

        showLoading("📄 Memuat data...");

        DATA = await apiGet("getData");

        renderTable(DATA);

        await loadDashboard();

        hideLoading();

    }catch(err){

        hideLoading();

        Swal.fire({
            icon:"error",
            title:"Error",
            text:err.message
        });

    }

}

/* ================================
   DASHBOARD
================================ */

async function loadDashboard(){

    const res = await apiGet("getDashboard");

    document.getElementById("lblTotal").innerHTML = res.total;
    document.getElementById("lblBelum").innerHTML = res.belum;
    document.getElementById("lblKirim").innerHTML = res.terkirim;

}

/* ================================
   TAMPILKAN TABEL
================================ */

function renderTable(data){

    let html="";

    if(data.length==0){

        html=`
        <tr>
            <td colspan="8" class="text-center">
                Tidak ada data
            </td>
        </tr>`;

        document.getElementById("tblData").innerHTML=html;
        return;

    }

    data.forEach(function(r,i){

        let status="";
        let tombol="";

        let sts=String(r[5]||"").trim().toUpperCase();

        if(
            sts=="" ||
            (
                sts!="BELUM" &&
                sts!="SIAP DIKIRIM" &&
                sts!="TERKIRIM"
            )
        ){
            sts="BELUM";
        }

        if(sts=="BELUM"){

            status='<span class="badge bg-warning text-dark">BELUM</span>';

            tombol=`
            <button class="btn btn-success btn-sm"
                onclick="kirimWA(${i})">
                📲 Kirim
            </button>`;

        }

        else if(sts=="SIAP DIKIRIM"){

            status='<span class="badge bg-info">SIAP DIKIRIM</span>';

            tombol=`
            <button class="btn btn-warning btn-sm me-1"
                onclick="kirimWA(${i})">
                🔄 Kirim Ulang
            </button>

            <button class="btn btn-primary btn-sm"
                onclick="konfirmasiTerkirim(${i})">
                ✅ Terkirim
            </button>`;

        }

        else{

            status='<span class="badge bg-secondary">TERKIRIM</span>';

            tombol=`
            <button class="btn btn-secondary btn-sm" disabled>
                ✔ Terkirim
            </button>`;

        }

        html+=`

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

    document.getElementById("tblData").innerHTML=html;

}

/* ================================
   KIRIM WA
================================ */

async function kirimWA(index){

    let r=DATA[index];

    let pesan=buatPesan(r);

    let no=String(r[1]).replace(/\D/g,'');

    if(no.startsWith("0")){
        no="62"+no.substring(1);
    }

    let url=
        "whatsapp://send?phone="+
        no+
        "&text="+
        encodeURIComponent(pesan);

    window.location.href=url;

    await apiPost("updateStatus",{

        noWa:r[1],
        status:"SIAP DIKIRIM"

    });

    loadData();

}

/* ================================
   KIRIM BERIKUTNYA
================================ */

async function kirimBerikutnya(){

    let list=await apiGet("getBroadcastData",{

        jumlah:1,
        skip:true

    });

    if(list.length==0){

        Swal.fire({

            icon:"info",
            title:"Selesai",
            text:"Semua pelamar sudah dikirim."

        });

        return;

    }

    let r=list[0];

    let pesan=buatPesan(r);

    let no=String(r[1]).replace(/\D/g,'');

    if(no.startsWith("0")){
        no="62"+no.substring(1);
    }

    let url=
        "whatsapp://send?phone="+
        no+
        "&text="+
        encodeURIComponent(pesan);

    window.location.href=url;

    await apiPost("updateStatus",{

        noWa:r[1],
        status:"SIAP DIKIRIM"

    });

    loadData();

}

/* ==========================================
   KONFIRMASI TERKIRIM
========================================== */

function konfirmasiTerkirim(index){

    let r = DATA[index];

    noWaKonfirmasi = r[1];

    document.getElementById("modalNama").innerHTML = r[0];
    document.getElementById("modalWA").innerHTML = r[1];

    new bootstrap.Modal(
        document.getElementById("modalTerkirim")
    ).show();

}

async function prosesTerkirim(){

    try{

        showSaving();

        await apiPost("updateStatus",{

            noWa:noWaKonfirmasi,
            status:"TERKIRIM"

        });

        hideSaving();

        bootstrap.Modal
        .getInstance(
            document.getElementById("modalTerkirim")
        )
        .hide();

        await loadData();

    }

    catch(err){

        hideSaving();

        Swal.fire({

            icon:"error",
            title:"Error",
            text:err.message

        });

    }

}


/* ==========================================
   SHOW / HIDE SAVING
========================================== */

function showSaving(){

    document.getElementById("savingOverlay").style.display="block";

}

function hideSaving(){

    document.getElementById("savingOverlay").style.display="none";

}


/* ==========================================
   IMPORT EXCEL
========================================== */

function pilihFileImport(){

    document.getElementById("fileExcel").click();

}

function bacaFileExcel(e){

    const file = e.target.files[0];

    if(!file) return;

    showLoading("Membaca File Excel...");

    const reader = new FileReader();

    reader.onload=function(evt){

        const data=new Uint8Array(evt.target.result);

        const workbook=XLSX.read(data,{
            type:"array"
        });

        const sheetName=workbook.SheetNames[0];

        const worksheet=workbook.Sheets[sheetName];

        const rows=XLSX.utils.sheet_to_json(

            worksheet,

            {

                header:1,
                defval:""

            }

        );

        hideLoading();

        previewImport(rows,file.name);

    };

    reader.readAsArrayBuffer(file);

}


/* ==========================================
   PREVIEW IMPORT
========================================== */

function previewImport(rows,fileName){

    if(rows.length<=1){

        Swal.fire({

            icon:"warning",

            title:"File kosong"

        });

        return;

    }

    IMPORT_DATA=rows;

    document.getElementById("namaFile").innerHTML=fileName;

    document.getElementById("jumlahData").innerHTML=rows.length-1;

    let html="";

    for(

        let i=1;

        i<Math.min(rows.length,6);

        i++

    ){

        html+=`

        <tr>

            <td>${rows[i][0]}</td>

            <td>${rows[i][1]}</td>

            <td>${rows[i][2]}</td>

            <td>${rows[i][3]}</td>

            <td>${rows[i][4]}</td>

        </tr>

        `;

    }

    document.getElementById(

        "previewImport"

    ).innerHTML=html;

    new bootstrap.Modal(

        document.getElementById("modalImport")

    ).show();

}


/* ==========================================
   IMPORT SEKARANG
========================================== */

async function importSekarang(){

    if(IMPORT_DATA.length<=1){

        return;

    }

    showLoading("Mengimpor Data...");

    let rows=[];

    for(

        let i=1;

        i<IMPORT_DATA.length;

        i++

    ){

        rows.push([

            IMPORT_DATA[i][0],

            IMPORT_DATA[i][1],

            IMPORT_DATA[i][2],

            IMPORT_DATA[i][3],

            IMPORT_DATA[i][4]

        ]);

    }

    try{

        const res=

        await apiPost(

            "importExcel",

            {

                rows:rows

            }

        );

        hideLoading();

        bootstrap.Modal

        .getInstance(

            document.getElementById("modalImport")

        )

        .hide();

        Swal.fire({

            icon:"success",

            title:"Import Berhasil",

            text:

            res.jumlah+

            " data berhasil diimport."

        });

        loadData();

    }

    catch(err){

        hideLoading();

        Swal.fire({

            icon:"error",

            title:"Error",

            text:err.message

        });

    }

}


/* ==========================================
   EXPORT CSV
========================================== */

async function exportCSV(){

    try{

        showLoading("Mengekspor Data...");

        const csv=

        await apiGet(

            "exportCSV"

        );

        hideLoading();

        const blob=new Blob(

            [

                "\ufeff"+csv

            ],

            {

                type:"text/csv;charset=utf-8;"

            }

        );

        const url=

        URL.createObjectURL(blob);

        const link=

        document.createElement("a");

        const tgl=new Date();

        link.href=url;

        link.download=

        "Data Pelamar "+

        tgl.getFullYear()+"-"+

        (tgl.getMonth()+1)+"-"+

        tgl.getDate()+

        ".csv";

        link.click();

        URL.revokeObjectURL(url);

    }

    catch(err){

        hideLoading();

        Swal.fire({

            icon:"error",

            title:"Export Gagal",

            text:err.message

        });

    }

}

/* ==========================================
   TEMPLATE WA
========================================== */

async function bukaTemplate(){

    try{

        showLoading("📄 Memuat Template...");

        TEMPLATE = await apiGet("getTemplateWA");

        hideLoading();

        const box = document.getElementById("txtTemplate");

        if(!box){

            Swal.fire(
                "Error",
                "Textarea Template tidak ditemukan.",
                "error"
            );

            return;

        }

        box.value = TEMPLATE;

        new bootstrap.Modal(
            document.getElementById("modalTemplate")
        ).show();

    }catch(err){

        hideLoading();

        Swal.fire({
            icon:"error",
            title:"Error",
            text:err.message
        });

    }

}


async function simpanTemplate(){

    let isi =
        document.getElementById("txtTemplate").value;

    showLoading("💾 Menyimpan Template...");

    try{

        await apiPost("saveTemplateWA",{

            template: isi

        });

        TEMPLATE = isi;

        hideLoading();

        bootstrap.Modal
            .getInstance(
                document.getElementById("modalTemplate")
            )
            .hide();

        Swal.fire({

            icon:"success",

            title:"Berhasil",

            text:"Template berhasil disimpan."

        });

    }catch(err){

        hideLoading();

        Swal.fire({

            icon:"error",

            title:"Error",

            text:err.message

        });

    }

}


function buatPesan(r){

    return TEMPLATE

        .replaceAll("{NAMA}",r[0])

        .replaceAll("{NOWA}",r[1])

        .replaceAll("{POSISI}",r[2])

        .replaceAll("{TANGGAL}",r[3])

        .replaceAll("{JAM}",r[4]);

}


/* ==========================================
   BROADCAST
========================================== */

function showBroadcast(){

    new bootstrap.Modal(

        document.getElementById("modalBroadcast")

    ).show();

}


async function mulaiBroadcast(){

    let jumlah =
        parseInt(
            document.getElementById("broadcastJumlah").value
        );

    let delay =
        parseInt(
            document.getElementById("broadcastDelay").value
        );

    let skip =
        document.getElementById("skipSent").checked;

    bootstrap.Modal

        .getInstance(

            document.getElementById("modalBroadcast")

        )

        .hide();

    showLoading("⏳ Menyiapkan Broadcast...");

    try{

        BROADCAST =
            await apiGet("getBroadcastData",{

                jumlah:jumlah,

                skip:skip

            });

        hideLoading();

        if(BROADCAST.length==0){

            Swal.fire({

                icon:"info",

                title:"Broadcast",

                text:"Tidak ada data yang bisa dikirim."

            });

            return;

        }

        INDEX_BROADCAST = 0;

        DELAY_BROADCAST = delay*1000;

        STOP_BROADCAST = false;

        document.getElementById("progressBar").style.width="0%";

        document.getElementById("progressBar").innerHTML="0%";

        document.getElementById("lblProgress").innerHTML=

            "0 / "+BROADCAST.length;

        document.getElementById("lblNama").innerHTML="-";

        document.getElementById("lblWA").innerHTML="-";

        new bootstrap.Modal(

            document.getElementById("modalProgress")

        ).show();

        prosesBroadcast();

    }

    catch(err){

        hideLoading();

        Swal.fire({

            icon:"error",

            title:"Error",

            text:err.message

        });

    }

}

/* ==========================================
   PROSES BROADCAST
========================================== */

async function prosesBroadcast(){

    if(STOP_BROADCAST){

        bootstrap.Modal
            .getInstance(
                document.getElementById("modalProgress")
            )
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
            .getInstance(
                document.getElementById("modalProgress")
            )
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
        persen + "%";

    document.getElementById("progressBar").innerHTML =
        persen + "%";

    document.getElementById("lblProgress").innerHTML =
        (INDEX_BROADCAST+1) + " / " + BROADCAST.length;

    document.getElementById("lblNama").innerHTML = r[0];

    document.getElementById("lblWA").innerHTML = r[1];

    let pesan = buatPesan(r);

    let no = String(r[1]).replace(/\D/g,'');

    if(no.startsWith("0")){
        no = "62" + no.substring(1);
    }

    window.location.href =
        "whatsapp://send?phone=" +
        no +
        "&text=" +
        encodeURIComponent(pesan);

    try{

        await apiPost("updateStatus",{

            noWa:r[1],

            status:"SIAP DIKIRIM"

        });

    }catch(err){

        console.error(err);

    }

    INDEX_BROADCAST++;

    setTimeout(prosesBroadcast, DELAY_BROADCAST);

}


/* ==========================================
   TANDAI SEMUA TERKIRIM
========================================== */

async function terkirimSemua(){

    const result = await Swal.fire({

        title:"Konfirmasi",

        html:
        "Semua data dengan status <b>SIAP DIKIRIM</b><br>" +
        "akan diubah menjadi <b>TERKIRIM</b>.",

        icon:"question",

        showCancelButton:true,

        confirmButtonText:"Ya, Tandai Semua",

        cancelButtonText:"Batal",

        confirmButtonColor:"#198754"

    });

    if(!result.isConfirmed) return;

    showLoading("💾 Mengubah status...");

    try{

        const res =
            await apiPost("terkirimSemua");

        hideLoading();

        Swal.fire({

            icon:"success",

            title:"Berhasil",

            text:
                res.jumlah +
                " data berhasil diperbarui."

        });

        loadData();

    }

    catch(err){

        hideLoading();

        Swal.fire({

            icon:"error",

            title:"Error",

            text:err.message

        });

    }

}


/* ==========================================
   STOP BROADCAST
========================================== */

function stopBroadcast(){

    STOP_BROADCAST = true;

}


/* ==========================================
   START APP
========================================== */

window.onload = async function(){

    try{

        showLoading("⏳ Memuat data...");

        TEMPLATE =
            await apiGet("getTemplateWA");

        await loadData();

        hideLoading();

    }

    catch(err){

        hideLoading();

        console.error(err);

        Swal.fire({

            icon:"error",

            title:"Tidak dapat terhubung",

            text:err.message

        });

    }

};
