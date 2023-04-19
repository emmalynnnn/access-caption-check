<template>
  <br>

  <form @submit.prevent="onSubmit" class="a-form">


    <div class="a-box">
      <label for="channel-id-input" class="label__lg">
        YouTube Channel ID:
      </label>
      <input
          type="text"
          id="channel-id-input"
          name="channel-id"
          autocomplete="off"
          v-model.lazy.trim="label"/>
    </div>


    <div class="a-box">
      <label for="format-input" class="label__lg">
        Format:
      </label>
      <select name="format-input" class="form-select">
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
          v-model.lazy.trim="label"
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
          v-model.lazy.trim="label"
          class="input__lg" />
    </div>


    <br>

    <div class="button-box">
      <button type="submit" class="btn btn__primary btn__lg">Submit</button>
    </div>
  </form>
</template>

<script>
export default {
  methods: {
    onSubmit() {
      if (this.label === "") {
        return;
      }
      this.$emit("todo-added", this.label);
      this.label = "";
    },
  },

  data() {
    return {
      label: "",
    }
  }
};
</script>