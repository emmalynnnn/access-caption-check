const MONDAY_API_KEY = process.env.MONDAY_API;

const CAPTION_STATUS_COL = "status_1";
const DATE_OF_LAST_VIDEO_COL = "date";
const TRIGGER_COL = "status"; //different on dev/prod - DEV: status, PROD: status84
const LAST_UPDATE_COL = "date9"; //different on dev/prod - DEV: date9, PROD: date86
const SUB_COL = "numbers";
const VIEWS_COL = "numbers65";
const NUM_VIDEOS_COL = "numbers7";

const VIDS_CAP_COL = "numbers4";
const TOT_SEC_COL = "numbers6";
const SEC_CAP_COL = "numbers5";

const axios = require('axios');
const converter = require("./dur-iso");

class UpdateMonday {

    async postData(url, data, headers) {
        return axios.post(url, data, headers)
            .then(response => {
                return response.data;
            })
            .catch(error => {
                throw error;
            });
    }

    checkResponse(response) {
        if (response.hasOwnProperty("error_code")) {
            console.log("Monday update failed");
        }
    }

    async updateBoard(res, channelInfo) {
        //console.log("Updating board")

        let newDate = channelInfo.mostRecentVideo.date.substring(0, channelInfo.mostRecentVideo.date.indexOf("T"));

        let query = 'mutation ($columnVals: JSON!) { change_multiple_column_values (board_id:' + channelInfo.boardId +
            ', item_id:' + channelInfo.itemId +
            ', column_values:$columnVals) { name id } }';
        let vars = {
            "columnVals" : JSON.stringify({
                [DATE_OF_LAST_VIDEO_COL] : newDate,
                [SUB_COL] : channelInfo.subscriberCount,
                [VIEWS_COL] : channelInfo.viewCount,
                [NUM_VIDEOS_COL] : channelInfo.videoCount
            })
        };
        const headers = {
            headers: {
                Authorization: MONDAY_API_KEY
            }
        };
        const url = 'https://api.monday.com/v2';

        const body = {
            query: query,
            variables: vars
        };

        this.postData(url, body, headers)
            .then(result => {
                this.checkResponse(JSON.stringify(result, null, 2));
            })
            .catch(error => {
                console.log(error);
                res.status(500).send(error.message);
            });
    }

    async updateBoardPostAudit(res, channelInfo) {
        return Promise.all(channelInfo.vidInfo).then((vidInfo) => {
            console.log("updating the board post audit", channelInfo);

            let vidsCaped = 0;
            let secCaped = 0;
            let totSec = 0;
            for (let i = 0; i < vidInfo.length; i++) {
                totSec += converter.convertToSecond(vidInfo[i].rawDur);
                if (vidInfo[i].cap === "Yes") {
                    vidsCaped++;
                    secCaped += converter.convertToSecond(vidInfo[i].rawDur);
                }
            }

            let newDate = channelInfo.mostRecentVideo.date.substring(0, channelInfo.mostRecentVideo.date.indexOf("T"));

            let query = 'mutation ($columnVals: JSON!) { change_multiple_column_values (board_id:' + channelInfo.boardId +
                ', item_id:' + channelInfo.itemId +
                ', column_values:$columnVals) { name id } }';
            let vars = {
                "columnVals" : JSON.stringify({
                    [DATE_OF_LAST_VIDEO_COL] : newDate,
                    [SUB_COL] : channelInfo.subscriberCount,
                    [VIEWS_COL] : channelInfo.viewCount,
                    [NUM_VIDEOS_COL] : channelInfo.videoCount,
                    [VIDS_CAP_COL] : vidsCaped,
                    [TOT_SEC_COL] : totSec,
                    [SEC_CAP_COL] : secCaped
                })
            };
            const headers = {
                headers: {
                    Authorization: MONDAY_API_KEY
                }
            };
            const url = 'https://api.monday.com/v2';

            const body = {
                query: query,
                variables: vars
            };

            return this.postData(url, body, headers)
                .then(result => {
                    console.log(result);
                    this.checkResponse(JSON.stringify(result, null, 2));
                    return this.updateStatus(res, channelInfo, "update");
                })
                .then(result => {
                    console.log("Updated status: " + result);
                    return result;
                })
                .catch(error => {
                    console.log(error);
                    res.status(500).send(error.message);
                });
        });
    }

    async markDeleted(res, channelInfo) {
        let query = 'mutation ($columnVals: JSON!) { change_multiple_column_values (board_id:' + channelInfo.boardId +
            ', item_id:' + channelInfo.itemId +
            ', column_values:$columnVals) { name id } }';
        let vars = {
            "columnVals" : JSON.stringify({
                [CAPTION_STATUS_COL] : "Deleted"
            })
        };

        const headers = {
            headers: {
                Authorization: MONDAY_API_KEY
            }
        };
        const url = 'https://api.monday.com/v2';

        const body = {
            query: query,
            variables: vars
        };

        this.postData(url, body, headers)
            .then(result => {
                console.log(result);
                this.checkResponse(JSON.stringify(result, null, 2));
                this.updateStatus(res, channelInfo, "update");
            })
            .catch(error => {
                console.log(error);
                res.status(500).send(error.message);
            });

    }

    async updateStatus(res, channelInfo, type) {
        console.log('marking updated: ' + type);
        let newStatus = "";
        if (type === "update") {
            newStatus = "Done";
        } else if (type === "error") {
            newStatus = "Error";
        } else if (type === "no content") {
            newStatus = "No Content";
        }
        const currentDate = new Date().toJSON().slice(0, 10);
        let query = 'mutation ($columnVals: JSON!) { change_multiple_column_values (board_id:' + channelInfo.boardId +
            ', item_id:' + channelInfo.itemId +
            ', column_values:$columnVals) { name id } }';
        let vars = {
            "columnVals" : JSON.stringify({
                [TRIGGER_COL] : newStatus,
                [LAST_UPDATE_COL] : currentDate
            })
        };

        const body = {
            query: query,
            variables: vars
        };

        const headers = {
            headers: {
                Authorization: MONDAY_API_KEY
            }
        };
        const url = 'https://api.monday.com/v2';

        return this.postData(url, body, headers)
            .then(result => {
                console.log(result);
                this.checkResponse(JSON.stringify(result, null, 2));
            })
            .catch(error => {
                console.log(error.message);
            })
    }
}

module.exports = UpdateMonday;
