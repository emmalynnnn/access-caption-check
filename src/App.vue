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
      <h1>YouTube Caption Auditor (YTCA) Report</h1>
      <p><strong>{{currDate}}</strong></p>
      <!--<h2>Channel 1 of 1:</h2>-->
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
          <th scope="col">Listed on Profile?</th>
        </tr>
        </thead>

        <tbody>

        <tr v-for="vid in vidInfo" :key="vid.url">
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


  </div>
</template>

<script>
/* eslint-disable */

import "./assets/app.css";
const converter = require("./assets/dur-iso");

//import ToDoItem from "./components/ToDoItem.vue";
import ChannelInfoForm from "./components/ChannelInfoForm";
import uniqueId from "lodash.uniqueid";

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
      numCap: 0,
      totSec: 0,
      secCap: 0,
      vidInfo: [],
    };
  },

  methods: {
    addToDo(toDoLabel) {
      this.ToDoItems.push({id:uniqueId('todo-'), label: toDoLabel, done: false});
    },
    updateDoneStatus(toDoId) {
      const toDoToUpdate = this.ToDoItems.find((item) => item.id === toDoId)
      toDoToUpdate.done = !toDoToUpdate.done
    },
    deleteToDo(toDoId) {
      const itemIndex = this.ToDoItems.findIndex((item) => item.id === toDoId);
      this.ToDoItems.splice(itemIndex, 1);
    },
    editToDo(toDoId, newLabel) {
      const toDoToEdit = this.ToDoItems.find((item) => item.id === toDoId);
      toDoToEdit.label = newLabel;
    },

    auditTheChannel(channelId, format, pubAfter, pubBefore) {
      //console.log(channelId, format, pubAfter, pubBefore);

      let emptyInfo = {title: "", url: "",
        date: "", dur: "", cap: "", views: 0, profile: ""};
      //let ourVidInfo = [];

      this.auditChannel(channelId, format, pubAfter, pubBefore)
          .then (results => {
            //console.log("We have gotten the results back!!");
            console.log(results);

            this.noData = false;

            this.numVid = results.numVid;
            this.numCap = results.numCap;
            this.totSec = 0;
            this.secCap = results.secCap;

            let sumInfo = 0;

            for (let i = 0; i < results.vidInfo.length; i++) {
              this.vidInfo.push(emptyInfo);
              var globalVidInfoPls = this.vidInfo;
              sumInfo = results.vidInfo[i]
                  .then(function(theVal) {
                    globalVidInfoPls[i] = theVal;
                    let durSec = converter.convertToSecond(theVal.rawDur);
                    let isCap = 0;
                    let secCap = 0;
                    if (theVal.cap) {
                      isCap = 1;
                      secCap = durSec;
                    }

                    return [durSec, isCap, secCap];
                  })
                  .then( value => {
                    this.totSec += value[0];
                    this.numCap += value[1];
                    this.secCap += value[2];
                  });
            }
            //console.log("Here are all of the videos: " + this.vidInfo);

          });
    }
  },

  computed: {
    percentCap() {
      if (this.numCap === 0) {
        return 0;
      }
      console.log("We have " + this.numVid + " videos and these many are captioned: " + this.numCap);
      return Math.round((this.numCap / this.numVid) * 100);
    },
    currDate() {
      let dateObj = new Date();
      return dateObj.toLocaleDateString();
    }
  }

};

</script>

