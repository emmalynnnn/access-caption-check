<template>
  <div id="app">
    <div v-if="noData">
      <h1>YouTube Caption Auditor (YTCA-USU)</h1>
      <p>Built and currently maintained by Emma Lynn (a02391851@usu.edu).</p>
      <p>Based off Terrill Thompson (University of Washington)'s <a href="https://github.com/terrill/YTCA">YTCA</a>.</p>
      <p>Use the following form to generate a report regarding the indicated YouTube channel(s). For YTCA-USU source
        code and documentation, see <a href="https://github.com/emmalynnnn/YTCA-USU">YTCA-USU on GitHub</a>.</p>
      <channel-info-form @form-submitted="auditTheChannel"></channel-info-form>

    </div>

    <div v-else>
      <div id="toDownload">
        <h1>YouTube Caption Auditor (YTCA) Report</h1>
        <p><strong>{{currDate}}</strong></p>
        <h2>{{name}}</h2>
        <p>{{this.channelId}}</p>

        <ul>
          <li>Number of videos: <strong>{{numVid}}</strong></li>
          <li>Number captioned: <strong>{{numCap}} ({{percentCap}}%)</strong></li>
          <li>Total seconds: <strong>{{totSec}}</strong></li>
          <li>Seconds captioned: <strong>{{secCap}}</strong></li>
        </ul>

        <table class="table table-bordered table-striped mce-item-table" style="border-collapse: collapse;">
          <thead>
          <tr>
            <th scope="row">Video Title</th>
            <th scope="col">Date</th>
            <th scope="col">Duration</th>
            <th scope="col">Captioned</th>
            <th scope="col">Views</th>
            <th scope="col">Live Stream?</th>
          </tr>
          </thead>

          <tbody>

          <tr v-for="vid in displayVids" :key="vid.url">
              <th scope="row"><a :href="vid.url">{{vid.title}}</a></th>
              <td>{{vid.date}}</td>
              <td>{{vid.dur}}</td>
              <td :class="vid.cap">{{vid.cap}}</td>
              <td class="data">{{vid.views}}</td>
              <td :class="vid.profile">{{vid.profile}}</td>
          </tr>

          </tbody>

        </table>
      </div>
      <div>
        <br>
        <div class="button-box" id="backBox">
          <a @click="goBack" class="btn btn__primary btn__lg">Back</a>
        </div>
        <br>
        <div class="button-box" id="downloadBox">
          <a @click="download" id="downloadLink"
             href="#" :download="downloadName" class="btn btn__primary btn__lg">Download</a>
        </div>
      </div>
      <br>

    </div>


  </div>
</template>

<script>
/* eslint-disable */

import "./assets/app.css";
const converter = require("./assets/dur-iso");

import ChannelInfoForm from "./components/ChannelInfoForm";

export default {
  name: 'App',
  components: {
    ChannelInfoForm,
  },
  mixins: [
    require('./myMixins.vue')
  ],

  data() {
    return {
      noData: true,
      numVid: 0,
      name: "",
      numCap: 0,
      totSec: 0,
      secCap: 0,
      vidInfo: [],
      channelId: "",
      downloaded: false,
      SERVER_URL: "http://localhost:8000/",
    };
  },

  methods: {
    download() {

      document.getElementById("downloadBox").style="display: none;";
      document.getElementById("backBox").style="display: none;";

      let theLink = document.getElementById("downloadLink");
      theLink.href='data:text/html;charset=UTF-8,'+encodeURIComponent(document.documentElement.outerHTML);

      document.getElementById("downloadBox").style="";
      document.getElementById("backBox").style="";

      this.downloaded = true;
    },

    goBack() {
      if (!this.downloaded) {
        if (confirm("Are you sure you want to go back? If you continue without saving, " +
            "all data from this scan will be lost.")) {
          this.reset();
        }
      } else {
        this.reset();
      }
    },

    reset() {
      this.noData = true;
      this.numVid = 0;
      this.numCap = 0;
      this.totSec = 0;
      this.secCap = 0;
      this.vidInfo = [];
      this.channelId = "";
      this.downloaded = false;
      this.name = "";
    },

    auditTheChannel(channelId, format, pubAfter, pubBefore, foldName) {
      //console.log(channelId, format, pubAfter, pubBefore);

      console.log("Outputting to " + format + " " + foldName);

      let emptyInfo = {title: "", url: "",
        date: "", dur: "", cap: "", views: "", profile: ""};
      //let ourVidInfo = [];

      this.channelId = channelId;

      let inputData = {channelId: channelId, format: format, pubAfter: pubAfter, pubBefore: pubBefore, foldName: foldName}

      this.postData(this.SERVER_URL, inputData).then((data) => {
        let results = data.result;
        //console.log(results);
        //console.log("We have gotten the results back!!");

        this.noData = false;

        this.numVid = results.numVid;
        this.name = results.name;
        this.numCap = results.numCap;
        this.totSec = 0;
        this.secCap = results.secCap;

        let sumInfo = 0;

        for (let i = 0; i < results.vidIds.length; i++) {
          //console.log(results.vidIds[i]);

          this.postData(this.SERVER_URL + "get-vid-info/", {id: results.vidIds[i], foldName: foldName})
              .then (result => {
                let vidInfo = result.result;

                this.vidInfo.push(vidInfo);

                let vidSec = converter.convertToSecond(vidInfo.rawDur);

                this.totSec += vidSec;

                if (vidInfo.cap === "Yes") {
                  this.numCap++;
                  this.secCap += vidSec;
                }
              })
        }
      });

    },
    postData(url, data, contentType="application/json") {
      return fetch(url, {
        method: "POST",
        /*mode: "no-cors",*/
        cache: "no-cache",
        credentials: "same-origin",
        connection: "keep-alive",
        headers: {
          Accept: 'application.json',
          "Content-Type": contentType,
        },
        body: JSON.stringify(data)
      })
          .then(res => {
            return res.json();
          })
          .then((obj) => {
            return obj;
          })
          .catch(err => {
            console.log(err);
          });
    },

  },

  computed: {
    percentCap() {
      if (this.numCap === 0) {
        return 0;
      }
      return Math.round((this.numCap / this.numVid) * 100);
    },
    currDate() {
      let dateObj = new Date();
      return dateObj.toLocaleDateString();
    },
    downloadName() {
      return "ytca-report-" + this.channelId + ".html";
    },
    displayVids() {
      let toReturn = [];
      for (let i = 0; i < this.vidInfo.length; i++) {
        if (this.vidInfo[i].title) {
          toReturn.push(this.vidInfo[i]);
        }
      }
      return toReturn;
    }
  }

};

</script>

