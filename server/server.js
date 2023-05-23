require('dotenv').config();
const {google} = require('googleapis');

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

const MakeSheet = require("./make-sheet");
const makeSheet = new MakeSheet();
const WebhookFuncs = require("./webhook-functions");
const webhook = new WebhookFuncs();
const Auditor = require("./auditor");
const auditor = new Auditor();
const UpdateMonday = require("./update-monday");
const updateMonday = new UpdateMonday();

const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:8080'
}));



app.get('/', (req, res) => {
    console.log("---------------- / ----------------");
    console.log("end ---------------- / ----------------");
    res.send("Hello World!");
});

app.post("/", function(req, res) {
    console.log("---------------- / ----------------");
    console.log(req.body);

    auditor.auditChannel(req.body.channelId, req.body.format, req.body.pubAfter, req.body.pubBefore, req.body.foldName)
        .then( results => {
            console.log(results);
            console.log("end ---------------- / ----------------");
            return res.status(200).json({result: results});
        }).catch( err => {
            console.log(err);
        console.log("end ---------------- / ----------------");
        return res.status(500).json({result: "Error: channel audit failed"});
    });
})

app.post("/get-vid-info", function(req, res) {
    console.log("---------------- /get-vid-info ----------------");
    //console.log("About to print the vid params")
    //console.log(req.body);

    //console.log("The vid info: " + JSON.stringify(req.body.vidInfo));

    auditor.getVidInfo(req.body.id)
        .then( results => {
            console.log(results);
            console.log("end ---------------- /get-vid-info ----------------");
            return res.status(200).json({result: results});
        }).catch( err => {
            console.log(err);
            console.log("end ---------------- /get-vid-info ----------------");
            return res.status(500).json({result: "Error: channel audit failed"});
        });
})

app.post("/fill-sheet", function(req, res) {
    console.log("---------------- /fill-sheet ----------------");

    //console.log("The vid info: " + JSON.stringify(req.body.vidInfo));

    makeSheet.fillSheet(req.body.sheetId, req.body.vidInfo)
        .then( results => {
            console.log("end ---------------- /fill-sheet ----------------");
            return res.status(200).json({status: "Success"});
        })
        .catch(err => {
            console.log("end ---------------- /fill-sheet ----------------");
            console.log("Error filling in the sheet " + err);
            return res.status(500).json({status: "Failure: " + err});
        });
})

app.post("/create-sheet", function (req, res) {
    console.log("---------------- /create-sheet ----------------");

    let name = req.body.name;
    let foldName = req.body.foldName;

    let folderId = makeSheet.FOLDER_IDS[foldName];

    if (!foldName) {
        return res.status(200).json({id: "You don't need thatttt"});
    }

    let jwtClient = makeSheet.authorizeGoogle();

    const sheets = google.sheets({version: 'v4', auth: jwtClient});

    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();

    let title = year + "-" + month + "-" + date + " " + name

    const resource = {
        properties: {
            title: title,
        },
    };
    sheets.spreadsheets.create({
        resource,
        fields: 'spreadsheetId',
    }, function (err, response) {
        if (err) {
            console.log("Error creating spreadsheet " + err);
        } else {
            makeSheet.moveSheet(response.data.spreadsheetId, folderId, jwtClient);
            makeSheet.addHeader(response.data.spreadsheetId, jwtClient);
            makeSheet.formatSheet(response.data.spreadsheetId, jwtClient);
            console.log("end ---------------- /create-sheet ----------------");
            return res.status(200).json({id: response.data.spreadsheetId});
        }
    });
})

app.post("/webhook-endpoint", function(req, res) {
    res.status(200).send(req.body);
    console.log("---------------- /webhook-endpoint ----------------");

    if (req.body.hasOwnProperty("event")) {
        let itemId = req.body.event.pulseId;
        let channelName = req.body.event.pulseName;
        let boardId = req.body.event.boardId;

        //console.log("Triggered on " + channelName);
        webhook.getChannelId(res, itemId, boardId)
            .then (rowInfo => {
                if (rowInfo.error !== undefined) {
                    console.log("There was an error getting the row info :(");
                    console.log(rowInfo.error);
                    updateMonday.updateStatus(res, rowInfo, "error");
                    console.log("end ---------------- /webhook-endpoint ----------------");
                } else {
                    webhook.doMondayYoutube(res, rowInfo)
                        .then( info => {
                            //console.log("The info", info);
                            if (info.status === "folder id is invalid") {
                                updateMonday.updateStatus(res, info, "error");
                                console.log("end ---------------- /webhook-endpoint ----------------");
                            } else if (info.status !== "Up to date" && info !== "") {
                                makeSheet.fillSheetWebhook(info.sheetId, info.vidInfo)
                                    .then(response => {
                                        console.log("Response", response);
                                        if (response.error !== undefined) {
                                            updateMonday.updateStatus(res, info, "error");
                                        } else {
                                            updateMonday.updateBoardPostAudit(res, info);
                                        }
                                        console.log("end ---------------- /webhook-endpoint ----------------");
                                    });
                            }
                        });
                }
            });

    }
})


const server = app.listen(8000, () => {
    console.log('Running at 8000');
});