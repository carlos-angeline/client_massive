const accountName = "smartbr";
const axios = require('axios');
const instance = axios.create({
    headers: {
        'API-AppKey': "",
        'API-AppToken': "",
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
})
const array = [];
const csv = require('csv-parser');
const fs = require('fs');

(async () => {
    let arquivoName = 'clientes_teste.csv'
    


    await new Promise((resolve, reject) => {
        
        fs.createReadStream(arquivoName) //Importante manter uma primeira coluna vazia (ex.: Nada)
            .pipe(csv({
                delimiter: ",",
                trim: true
            }))
            .on('data', (row) => {
            //console.log(row);    
                
                Object.keys(row).forEach(function(key,index) {
                    row[key] = row[key].trim()
                });
                
                const start = (row.regime_start) ?  row.regime_start.split("/"): ''
                const end =(row.regime_end ) ?  row.regime_end.split("/"):  ''
                row.regime_start = start[0] ? `${start[2].length == 4? start[2]:'20'+ start[2]}-${start[1]}-${start[0]}` : null
                row.regime_end = end[0] ? `${end[2].length == 4? end[2]:'20'+ end[2]}-${end[1]}-${end[0]}` : null
                array.push(row)
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
                resolve();
            });
    })
    let i = 0;
    let data = new Date
    let day =  data.getDate()
    let month = data.getMonth()
    let year = data.getFullYear()
    let hour = data.getHours()
    let minute = data.getMinutes()
    let second = data.getSeconds()

  

    fs.appendFile("logs.txt", `##### STARTING SCRIPT ${arquivoName} `  + day + '/' + month + '/' + year + ' ' + hour + ':' + minute + ':' + second + "\n", ()=>{})
    for await (const row of array) {
        await process(row)
        console.log(i);
        i++;
    }
    let dataF = new Date
    let dayF =  dataF.getDate()
    let monthF = dataF.getMonth()
    let yearF = dataF.getFullYear()
    let hourF = dataF.getHours()
    let minuteF = dataF.getMinutes()
    let secondF = dataF.getSeconds()
    fs.appendFile("logs.txt", '##### FINISH SCRIPT ' + dayF + '/' + monthF + '/' + yearF + ' ' + hourF + ':' + minuteF + ':' + secondF +  "\n" ,  ()=>{})
})();

async function process(row) {
    let custumerID = row.QADCustomerId
    let nomeCliente = row.Nome_Cliente
    try {
        
        const { data } = await instance.get(`https://${accountName}.myvtex.com/api/dataentities/CL/search?_fields=id&_where=QADCustomerId=${row.QADCustomerId}`);

        if (!data) return;

        for (const client of data) {
            await instance.patch(`https://${accountName}.myvtex.com/api/dataentities/CL/documents/${client.id}`, {
                "uf_destiny": row.uf_destiny,
                "taxpayer": row.taxpayer==="yes" ? true : false,
                "special_regime": row.special_regime ==="yes" ? true : false,
                "regime_start": row.regime_start,
                "regime_end": row.regime_end
            });
            console.log(client.id)
        }
    }
    catch (e) {
        console.error(e.response.data)
        fs.appendFile('logs.txt',JSON.stringify({"Nome Cliente":nomeCliente, 'CustumerId':custumerID}) + JSON.stringify(e.response.data)  +"\n", function (err) {
            if (err) {
                console.log( 'erro ao salvar log no arquivo',err)
                console.log('erro da requisição',e)
            }
        })
    }
}
