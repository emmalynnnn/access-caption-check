const MONDAY_API_KEY = process.env.MONDAY_API;

const CAPTION_STATUS_COL = "status_1";
const DATE_OF_LAST_VIDEO_COL = "date";
const TRIGGER_COL = "status"; //different on dev/prod
const LAST_UPDATE_COL = "date9"; //different on dev/prod
const SUB_COL = "numbers";
const VIEWS_COL = "numbers65";
const NUM_VIDEOS_COL = "numbers7";


const axios = require('axios');

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
                console.log(result);
                this.checkResponse(JSON.stringify(result, null, 2));
                this.updateStatus(res, channelInfo, "update");
            })
            .catch(error => {
                console.log(error);
                res.status(500).send(error.message);
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
        console.log("New date " + currentDate);
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

        this.postData(url, body, headers)
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
