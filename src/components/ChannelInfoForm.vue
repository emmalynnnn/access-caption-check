<template>
  <br>

  <form @submit.prevent="onSubmit" class="a-form">


    <div class="a-box">
      <p>USU Opera: UCJVp8EsMap1PQH-UIxQ00EA</p>
      <p>Audiology: UCilhAOYJnG7cTZquud__07Q</p>
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