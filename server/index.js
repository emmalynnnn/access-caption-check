const {google} = require('googleapis');
const serverless = require("serverless-http");

const express = require('express');
const bodyParser = require('body-parser');

const MakeSheet = require("./make-sheet");
const makeSheet = new MakeSheet();
const WebhookFuncs = require("./webhook-functions");
const webhook = new WebhookFuncs();
const Auditor = require("./auditor");
const auditor = new Auditor();
const UpdateMonday = require("./update-monday");
const updateMonday = new UpdateMonday();

const clientUrl = 'https://master.d18gulj4il0z61.amplifyapp.com';

const app = express();
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors({
    origin: clientUrl
}));


app.get('/test', (req, res) => {
    console.log("Test endpoint hit");
    console.log(req);
    res.send("Hello World!");
});

app.post("/audit-channel", function(req, res) {
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
});

app.post("/get-vid-info", function(req, res) {
    console.log("---------------- /get-vid-info ----------------");

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
});

app.post("/fill-sheet", function(req, res) {
    console.log("---------------- /fill-sheet ----------------");

    makeSheet.fillSheet(req.body.sheetId, req.body.vidInfo, req.body.firstIndex)
        .then( results => {
            console.log("end ---------------- /fill-sheet ----------------");
            return res.status(200).json({status: "Success"});
        })
        .catch(err => {
            console.log("end ---------------- /fill-sheet ----------------");
            console.log("Error filling in the sheet " + err);
            return res.status(500).json({status: "Failure: " + err});
        });
});

app.post("/sort-sheet", function(req, res) {
    console.log("---------------- /sort-sheet ----------------");

    let sheetId = req.body.sheetId;
    console.log(sheetId);

    makeSheet.sortSheet(sheetId)
        .then( results => {
            console.log("end ---------------- /sort-sheet ----------------");
            return res.status(200).json({status: "Success"});
        })
        .catch(err => {
            console.log("end ---------------- /sort-sheet ----------------");
            console.log("Error sorting the sheet " + err);
            return res.status(500).json({status: "Failure: " + err});
        });
});

app.post("/size-sheet", function(req, res) {
    console.log("---------------- /size-sheet ----------------");

    let sheetId = req.body.sheetId;
    let vidNum = req.body.vidNum;

    makeSheet.updateSheetSize(sheetId, vidNum)
        .then( results => {
            console.log(results);
            console.log("end ---------------- /size-sheet ----------------");
            return res.status(200).json({status: "Success"});
        })
        .catch(err => {
            console.log("end ---------------- /size-sheet ----------------");
            console.log("Error sorting the sheet " + err);
            return res.status(500).json({status: "Failure: " + err});
        });
});

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

    let title = year + "-" + month + "-" + date + " " + name;

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
            makeSheet.moveSheet(response.data.spreadsheetId, folderId, jwtClient)
                .then(resp => {
                    return makeSheet.addHeader(response.data.spreadsheetId, jwtClient);
                })
                .then(resp => {
                    return makeSheet.formatSheet(response.data.spreadsheetId, jwtClient);
                })
                .then(resp => {
                    console.log("end ---------------- /create-sheet ----------------");
                    return res.status(200).json({id: response.data.spreadsheetId});
                });
        }
    });
});

app.post("/webhook-endpoint", function(req, res) {
    if (req.body.challenge) {
        console.log(req.body);
        res.status(200).send(req.body);
        return;
    }
    console.log("---------------- /webhook-endpoint ----------------");

    if (req.body.hasOwnProperty("event")) {
        let itemId = req.body.event.pulseId;
        let channelName = req.body.event.pulseName;
        let boardId = req.body.event.boardId;

        let theInfo;

        console.log("Triggered on " + channelName);
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
                            if (info.status === "folder id is invalid") {
                                updateMonday.updateStatus(res, info, "error");
                                console.log("end ---------------- /webhook-endpoint ----------------");
                            } else if (info.status === "No folder id") {
                                updateMonday.updateStatus(res, info, "error");
                                console.log("end ---------------- /webhook-endpoint ----------------");
                            } else if (info.status !== "Up to date" && info !== "") {
                                theInfo = info;
                                makeSheet.updateSheetSize(info.sheetId, info.videoCount)
                                    .then(response => {
                                        return makeSheet.fillSheetWebhook(theInfo.sheetId, theInfo.vidInfo);
                                    })
                                    .then(response => {
                                        if (response.error !== undefined) {
                                            updateMonday.updateStatus(res, theInfo, "error")
                                                .then(resp => {
                                                    console.log("resp " + resp);
                                                    console.log("end ---------------- /webhook-endpoint ----------------");
                                                    res.status(200).send({result: "error"});
                                                });
                                        } else {
                                            updateMonday.updateBoardPostAudit(res, theInfo)
                                                .then(resp => {
                                                    console.log("resp " + resp);
                                                    console.log("end ---------------- /webhook-endpoint ----------------");
                                                    res.status(200).send({result: "success"});
                                                });
                                        }
                                    });
                            }
                        });
                }
            });

    }
});


module.exports.handler = serverless(app);
