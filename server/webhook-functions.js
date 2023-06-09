const GetChannelInfo = require("./get-channel-info");
const getChannelInfo = new GetChannelInfo();
const UpdateMonday = require("./update-monday");
const updateMonday = new UpdateMonday();
const Auditor = require("./auditor");
const auditor = new Auditor();
const MakeSheet = require("./make-sheet");
const makeSheet = new MakeSheet();

var throttle = require('promise-ratelimit')(20);

const MOST_RECENT_VID_COL = "date";
const NUM_CAP_COL = "numbers4";
const SEC_COL = "numbers6";
const SEC_CAP_COL = "numbers5";
const REPORT_COL = "link1";

const VID_CHUNK_SIZE = 50;

const MONDAY_API_KEY = process.env.MONDAY_API;

class WebhookFunctions {
    async doMondayYoutube(res, rowInfo) {
        return getChannelInfo.updateChannelInfo(res, rowInfo)
            .then(info => {
                var info = info;
                if (info.status !== undefined) {
                    console.log("There was an error :( " + info.status);
                    if (info.status === "deleted") {
                        console.log("This channel has been deleted.");
                        updateMonday.markDeleted(res, rowInfo);
                    } else if (info.status === "There is no content on the channel") {
                        console.log("The channel has no content.");
                        updateMonday.updateStatus(res, rowInfo, "no content");
                    } else {
                        updateMonday.updateStatus(res, rowInfo, "error");
                        res.status(500).send(rowInfo.error);
                    }
                    return "";
                }

                let newDate = info.mostRecentVideo.date.substring(0, info.mostRecentVideo.date.indexOf("T"));

                if (rowInfo.mostRecentVid === newDate) {
                    updateMonday.updateBoard(res, rowInfo);
                    updateMonday.updateStatus(res, info, "update");
                    console.log("Up to date");
                    info.status = "Up to date";
                    return info;
                } else {
                    console.log(`There's a new video, and the channel needs to be audited`);
                    if (rowInfo.foldId === "") {
                        updateMonday.updateStatus(res, info, "error");
                        info.status = "No folder id";
                        return info;
                    }
                    return makeSheet.makeSheet(info.name, info.foldId, true)
                        .then(id => {
                            if (id === "folder id is invalid") {
                                info.status = "folder id is invalid";
                                return info;
                            }
                            info.sheetId = id;
                            return auditor.auditChannel(info.channelId, "Sheets", "", "", "ID found", info)
                                .then(async(results) => {
                                    //console.log("To audit: " + results.vidIds);

                                    let vidInfo = [];

                                    let vidChunks = [[]];
                                    let chunkIndex = 0;

                                    for (let i = 0; i < results.vidIds.length; i++) {
                                        if (vidChunks[chunkIndex].length >= VID_CHUNK_SIZE) {
                                            chunkIndex++;
                                            vidChunks.push([]);
                                        }
                                        vidChunks[chunkIndex].push(results.vidIds[i]);
                                    }

                                    for (let i = 0; i < vidChunks.length; i++) {
                                        let littleInfo = await this.getChunkOfVids(vidChunks[i]);
                                        console.log("Chunk " + (i + 1));
                                        vidInfo = vidInfo.concat(littleInfo.vidInfo);
                                    }
                                    info.vidInfo = vidInfo;
                                    console.log("The info in here", info);
                                    return info;
                                }).catch(err => {
                                    console.log(err);
                                });
                        });
                }


            });
    }

    async getChunkOfVids(vidIds) {
        let vidInfo = [];

        for (let i = 0; i < vidIds.length; i++) {
            await throttle();
            vidInfo.push(auditor.getVidInfo(vidIds[i])
                .then(result => {
                    return result;
                }));
        }
        return {vidInfo: vidInfo};
    }


    async getChannelId(res, itemId, boardId) {
        console.log("Getting the channel Id");

        const colIds = `[text, ${REPORT_COL}, ${MOST_RECENT_VID_COL}, ${NUM_CAP_COL}, ${SEC_COL}, ${SEC_CAP_COL}]`;

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
                console.log(JSON.stringify(result));
                let item = result.data.boards[0].items[0];
                let foldId = item.column_values[1].text;
                foldId = foldId.substring(foldId.indexOf("folders/") + 8);

                let row = {name: item.name, itemId: item.id, channelId: item.column_values[0].text,
                    mostRecentVid: item.column_values[2].text, capedVids: item.column_values[3].text,
                    secs: item.column_values[4].text, capedSecs: item.column_values[5].text,
                    foldId: foldId, boardId: boardId};

                if (item.column_values[0].text === "") {
                    console.log("No channel id given for " + item.name);
                    row.error = "no channel id";
                    return row;
                }

                console.log("Successfully found info for " + item.name);
                return row;
            })
            .catch( err => {
                console.log(err.message);
                return {error: err.message};
            });

    }


}

module.exports = WebhookFunctions;