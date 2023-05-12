const GetChannelInfo = require("./get-channel-info");
const getChannelInfo = new GetChannelInfo();
const UpdateMonday = require("./update-monday");
const updateMonday = new UpdateMonday();
const Auditor = require("./auditor");
const auditor = new Auditor();
const MakeSheet = require("./make-sheet");
const makeSheet = new MakeSheet();
const converter = require("../frontend/src/assets/dur-iso");

const MOST_RECENT_VID_COL = "date";
const NUM_CAP_COL = "numbers4";
const SEC_COL = "numbers6";
const SEC_CAP_COL = "numbers5";
const REPORT_COL = "link1";

const MONDAY_API_KEY = process.env.MONDAY_API;

class WebhookFunctions {
    doMondayYoutube(res, rowInfo) {
        //let oldMostRecentVid = rowInfo.mostRecentVid;
        return getChannelInfo.updateChannelInfo(res, rowInfo)
            .then(info => {
                var info = info;
                //console.log("The info: " + JSON.stringify(info));
                if (info.status !== undefined) {
                    console.log("There was an error :( " + info.status);
                    updateMonday.updateStatus(res, row, "error");
                    res.status(500).send(rowInfo.error);
                    return "";
                }

                let newDate = info.mostRecentVideo.date.substring(0, info.mostRecentVideo.date.indexOf("T"));

                //console.log("Old date: " + rowInfo.mostRecentVid, "New date: " + newDate);
                if (rowInfo.mostRecentVid === newDate) {
                    updateMonday.updateBoard(res, rowInfo);
                    updateMonday.updateStatus(res, info, "update");
                    info.status = "Up to date";
                    return info;
                } else {
                    console.log("There's a new video, and the channel needs to be audited");

                    return makeSheet.makeSheet(info.name, info.foldName, true)
            .then(id => {
                //console.log("id", id);
                info.sheetId = id;
                return auditor.auditChannel(info.channelId, "Sheets", "", "", "ID found", info)
            .then( results => {
                //console.log(results);
                //console.log("To audit: " + results.vidIds);

                let vidInfo = [];
                for (let i = 0; i < results.vidIds.length; i++) {
                    vidInfo.push(auditor.getVidInfo(results.vidIds[i])
                        .then( result => {
                            let vidSec = converter.convertToSecond(result.rawDur);
                            info.totSec += vidSec;

                            if (result.cap === "Yes") {
                                info.numCap++;
                                info.secCap += vidSec;
                            }

                            //console.log("result", result);
                            return result;
                        }));
                }
                info.vidInfo = vidInfo;
                //console.log("The info in here", info);
                return info;
                //return res.status(200).json({result: results});
            }).catch( err => {
                console.log(err);
                //return res.status(500).json({result: "Error: channel audit failed"});
            });
            });
                }
            });
    }

    async getChannelId(res, itemId, boardId) {
        //console.log("Getting the channel Id")

        const colIds = `[text, ${REPORT_COL}, ${MOST_RECENT_VID_COL}, ${NUM_CAP_COL}, ${SEC_COL}, ${SEC_CAP_COL}]`

        let query = '{ boards(ids:' + boardId + ') { name items(ids: ' + itemId + ' ) { name id column_values ' +
            '(ids: ' + colIds + ') { text }} } }';

        const url = "https://api.monday.com/v2";
        const body = {
            query: query,
            variables: {}
        };
        const headers = {
            headers: {Authorization: MONDAY_API_KEY}
        };

        return auditor.postData(url, body, headers)
            .then( result => {
                //console.log(JSON.stringify(result));
                let item = result.data.boards[0].items[0];
                let foldId = item.column_values[1].text;
                foldId = foldId.substring(foldId.indexOf("folders/") + 8);

                let row = {name: item.name, itemId: item.id, channelId: item.column_values[0].text,
                    mostRecentVid: item.column_values[2].text, capedVids: item.column_values[3].text,
                    secs: item.column_values[4].text, capedSecs: item.column_values[5].text,
                    foldId: foldId, boardId: boardId};
                //console.log(item, row);

                if (item.column_values[0].text === "") {
                    console.log("No channel id given for " + item.name);
                    updateMonday.updateStatus(res, row, "error");
                    return;
                }

                //console.log("Successfully found info for " + item.name);
                return row;
            })
            .catch( err => {
                //res.status(500).send(err.message);
                console.log(err.message);
                return {error: err.message};
            });

    }


}

module.exports = WebhookFunctions;