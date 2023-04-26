<template>
  <br>

  <form @submit.prevent="onSubmit" class="a-form">


    <div class="a-box">
      <p>Student Retention: UCRPI0furXHcZ7yLgvVNlHDg</p>
      <p>Aggie Radio: UCNuyoAnorbXfITrjF2WqmAQ</p>
      <p>USU Opera: UCJVp8EsMap1PQH-UIxQ00EA</p>
      <label for="channel-id-input" class="label__lg">
        <span style="color: brown">*</span>YouTube Channel ID:
      </label>
      <input
          type="text"
          id="channel-id-input"
          name="channel-id"
          autocomplete="off"
          v-model.lazy.trim="channelId"/>
    </div>


    <div class="a-box">
      <label for="format-input" class="label__lg">
        <span style="color: brown">*</span>Format:
      </label>
      <select name="format-input" class="form-select" v-model.lazy.trim="format">
        <option value="HTML">HTML</option>
      </select>
    </div>


    <div class="a-box">
      <label for="after-date-input" class="label__lg">
        Published after (YYYY-MM-DD):
      </label>
      <input
          type="text"
          id="after-date-input"
          name="after-date"
          autocomplete="off"
          v-model.lazy.trim="pubAfter"
          class="input__lg" />
    </div>

    <div class="a-box">
      <label for="before-date-input" class="label__lg">
        Published before (YYYY-MM-DD):
      </label>
      <input
          type="text"
          id="before-date-input"
          name="before-date"
          autocomplete="off"
          v-model.lazy.trim="pubBefore"
          class="input__lg" />
    </div>

    <p><span style="color: brown">*</span>Required Field</p>


    <div class="button-box">
      <button type="submit" class="btn btn__primary btn__lg">Submit</button>
    </div>
  </form>
</template>

<script>
export default {
  emits: ["form-submitted"],
  methods: {
    onSubmit() {
      if (this.channelId === "" || this.format === "") {
        //These fields are required!!
        return;
      }

      if (this.pubAfter) {
        if (this.pubAfter[4] !== "-" || this.pubAfter[7] !== "-" || this.pubAfter.length !== 10) {
          console.log("Invalid datetime" + this.pubAfter[4]);
          return;
        }
        if (isNaN(this.pubAfter.substring(0, 4)) || parseInt(this.pubAfter.substring(0, 4)) < 0) {
          console.log("Invalid year" + this.pubAfter.substring(0, 4));
          return;
        }
        if (isNaN(this.pubAfter.substring(5, 7)) || parseInt(this.pubAfter.substring(5, 7)) > 12 || parseInt(this.pubAfter.substring(5, 7)) < 0) {
          console.log("Invalid month" + this.pubAfter.substring(5, 7));
          return;
        }
        if (isNaN(this.pubAfter.substring(8)) || parseInt(this.pubAfter.substring(8)) > 31 || parseInt(this.pubAfter.substring(8)) < 0) {
          console.log("Invalid day" + this.pubAfter.substring(8));
          return;
        }
      }

      if (this.pubBefore) {
        if (this.pubBefore[4] !== "-" || this.pubBefore[7] !== "-" || this.pubBefore.length !== 10) {
          console.log("Invalid datetime" + this.pubBefore[4]);
          return;
        }
        if (isNaN(this.pubBefore.substring(0, 4)) || parseInt(this.pubBefore.substring(0, 4)) < 0) {
          console.log("Invalid year" + this.pubBefore.substring(0, 4));
          return;
        }
        if (isNaN(this.pubBefore.substring(5, 7)) || parseInt(this.pubBefore.substring(5, 7)) > 12 || parseInt(this.pubBefore.substring(5, 7)) < 0) {
          console.log("Invalid month" + this.pubBefore.substring(5, 7));
          return;
        }
        if (isNaN(this.pubBefore.substring(8)) || parseInt(this.pubBefore.substring(8)) > 31 || parseInt(this.pubBefore.substring(8)) < 0) {
          console.log("Invalid day" + this.pubBefore.substring(8));
          return;
        }
      }

      this.$emit("form-submitted", this.channelId, this.format, this.pubAfter, this.pubBefore);
      this.channelId = "";
      this.format = "";
      this.pubAfter = "";
      this.pubBefore = "";
    },
  },

  data() {
    return {
      channelId: "",
      format: "",
      pubAfter: "",
      pubBefore: "",
    }
  }
};
</script>