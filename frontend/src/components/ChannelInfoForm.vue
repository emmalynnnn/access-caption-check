<template>
  <br>

  <form @submit.prevent="onSubmit" class="a-form">


    <div class="a-box">
      <!--<p>Student Retention: UCRPI0furXHcZ7yLgvVNlHDg</p>
      <p>Aggie Radio: UCNuyoAnorbXfITrjF2WqmAQ</p>
      <p>USU Opera: UCJVp8EsMap1PQH-UIxQ00EA</p>-->
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
      <select name="format-input" class="form-select" v-model.lazy.trim="format" @change="showField($event)">
        <option disabled value="">Select output format</option>
        <option value="HTML">HTML</option>
        <option value="Sheets">Google Sheets</option>
      </select>
    </div>

    <div class="a-box" id="div1" v-if="showFolderField" @change="showTheSubFolderField($event)">
      <label for="folder-name-input" class="label__lg">
        <span style="color: brown">*</span>Folder:
      </label>
      <select class="form-select" id="folder-name-input" name="folder-name" v-model.lazy.trim="bigFoldName">
        <option disabled value="">Select folder</option>
        <option v-for="folder in FOLDER_NAMES" :value="folder.value" :key="folder.value">{{folder.text}}</option>
      </select>
    </div>

    <div class="a-box" id="div1" v-if="showSubFolderField">
      <label for="subfolder-name-input" class="label__lg">
        <span style="color: brown">*</span>Sub-folder:
      </label>
      <select class="form-select" id="subfolder-name-input" name="subfolder-name" v-model.lazy.trim="foldName">
        <option disabled value="">Select subfolder</option>
        <option v-for="folder in theseSubFolders" :value="folder.value" :key="folder.value">{{folder.text}}</option>
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
  <p>Please note that if the channel has a large amount of content, YTCA-USU may take a moment to respond after Submit is selected.
  If sending a report to Google Sheets, the videos results may also take a moment to load.</p>
</template>

<script>
/* eslint-disable */
export default {
  emits: ["form-submitted"],
  methods: {
    showField(event) {
      if (event.target.value === 'Sheets') {
        this.showFolderField = true;
      } else {
        this.showFolderField = false;
        this.showSubFolderField = false;
        this.foldName = "";
      }
    },
    showTheSubFolderField(event) {
      this.showSubFolderField = true;
    },
    onSubmit() {
      if (this.channelId === "" || this.format === "") {
        //These fields are required!!
        return;
      }

      if (this.showFolderField && this.foldName === "") {
        //This field is required!!
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

      this.$emit("form-submitted", this.channelId, this.format, this.pubAfter, this.pubBefore, this.foldName);
      this.channelId = "";
      this.format = "";
      this.pubAfter = "";
      this.pubBefore = "";
      this.foldName = "";
      this.showFolderField = false;
      this.showSubFolderField = false;
    },
  },

  computed: {
    theseSubFolders() {
      return this.SUB_FOLDER_NAMES[this.bigFoldName];
    }
  },

  data() {
    return {
      channelId: "",
      format: "",
      pubAfter: "",
      pubBefore: "",
      foldName: "",
      bigFoldName: "",
      showFolderField: false,
      subFolderNames: [],
      showSubFolderField: false,
      TEST_FOLDER_NAMES: [{text: "Real", value: "Real"}, {text: "Fake", value: "Fake"}],
      TEST_SUB_FOLDER_NAMES: {
        "Real":
            [{text: "Test 1", value: "Test 1"}, {text: "Test 2", value: "Test 2"}],
        "Fake":
             [{text: "Fake 1", value: "Fake 1"}, {text: "Fake 2", value: "Fake 2"}]
      },
      FOLDER_NAMES: [
        {text: "Test", value: "Test"},
        {text: "Abandoned", value: "Abandoned"},
        {text: "Advancement", value: "Advancement"},
        {text: "Athletics", value: "Athletics"},
        {text: "CAAS", value: "CAAS"},
        {text: "CCA", value: "CCA"},
        {text: "CEHS", value: "CEHS"},
        {text: "CHaSS", value: "CHaSS"},
        {text: "College of Veterinary Medicine", value: "College of Veterinary Medicine"},
        {text: "DEI", value: "DEI"},
        {text: "Eastern", value: "Eastern"},
        {text: "Engineering", value: "Engineering"},
        {text: "EVP", value: "EVP"},
        {text: "Extension", value: "Extension"},
        {text: "Facilities", value: "Facilities"},
        {text: "FAS", value: "FAS"},
        {text: "GovR", value: "GovR"},
        {text: "Huntsman", value: "Huntsman"},
        {text: "Individual Channels", value: "Individual Channels"},
        {text: "Libraries", value: "Libraries"},
        {text: "President", value: "President"},
        {text: "Provost", value: "Provost"},
        {text: "QCNR", value: "QCNR"},
        {text: "Research", value: "Research"},
        {text: "Science", value: "Science"},
        {text: "Student Affairs", value: "Student Affairs"},
        {text: "UMAC", value: "UMAC"},
        {text: "Unknown", value: "Unknown"},
      ],
      SUB_FOLDER_NAMES: {
        "Test":
            [
              {text: "Test 1", value: "Test 1"},
              {text: "Test 2", value: "Test 2"},
            ],
        "Abandoned":
            [
              {text: "Audiology", value: "Abandoned - Audiology"},
              {text: "International Ambassadors", value: "International Ambassadors"},
              {text: "Intersections", value: "Intersections"},
              {text: "TechComm - Old", value: "TechComm - Old"},
              {text: "USU Center for Women & Gender", value: "USU Center for Women & Gender"},
              {text: "USU Eastern Athletics", value: "USU Eastern Athletics"},
              {text: "USU Eastern Blanding Campus", value: "USU Eastern Blanding Campus"},
              {text: "USU Moab Campus", value: "USU Moab Campus"},
              {text: "Utah State University - Regional Campuses", value: "Utah State University - Regional Campuses"},
            ],
        "Advancement":
            [
              {text: "Aggie Funded", value: "Aggie Funded"},
              {text: "Alumni", value: "Alumni"},
              {text: "Crowdfunding", value: "Crowdfunding"},
            ],
        "Athletics":
            [
              {text: "Athletics", value: "Athletics"},
              {text: "Football", value: "Football"},
              {text: "Gymnastics", value: "Gymnastics"},
              {text: "SAAC", value: "SAAC"},
              {text: "Strength and Conditioning", value: "Strength and Conditioning"},
              {text: "Womens Soccer", value: "Womens Soccer"},
            ],
        "CAAS":
            [
              {text: "Aggie Chocolate", value: "Aggie Chocolate"},
              {text: "ASTE", value: "ASTE"},
              {text: "CAAS", value: "CAAS"},
              {text: "Crop Physiology", value: "Crop Physiology"},
              {text: "LAEP", value: "LAEP"},
              {text: "LAEP 2022", value: "LAEP 2022"},
              {text: "LAEPUSU", value: "LAEPUSU"},
              {text: "OPDD", value: "OPDD"},
              {text: "SPARC", value: "SPARC"},
              {text: "USU MDA", value: "USU MDA"},
            ],
        "CCA":
            [
              {text: "Arts Access", value: "Arts Access"},
              {text: "CCA", value: "CCA"},
              {text: "Chamber Singers", value: "Chamber Singers"},
              {text: "Jazz Orchestra", value: "Jazz Orchestra"},
              {text: "Music", value: "Music"},
              {text: "Symphony Orchestra", value: "Symphony Orchestra"},
              {text: "Theatre", value: "Theatre"},
              {text: "Theatre Arts", value: "Theatre Arts"},
              {text: "USU Opera", value: "USU Opera"},
              {text: "Youth Conservatory", value: "Youth Conservatory"},
            ],
        "CEHS":
            [
              {text: "Aggies Elevated", value: "Aggies Elevated"},
              {text: "ASSERT", value: "ASSERT"},
              {text: "Audiology", value: "CEHS - Audiology"},
              {text: "CEHS", value: "CEHS"},
              {text: "COMD", value: "COMD"},
              {text: "GEAR UP", value: "GEAR UP"},
              {text: "GEAR UP CCSD", value: "GEAR UP CCSD"},
              {text: "HDFS", value: "HDFS"},
              {text: "Health Education", value: "Health Education"},
              {text: "Institute for Disability", value: "Institute for Disability"},
              {text: "ITLS", value: "ITLS"},
              {text: "Kinesiology", value: "Kinesiology"},
              {text: "TEAL", value: "TEAL"},
              {text: "UATP", value: "UATP"},
              {text: "WebAIM", value: "WebAIM"},
            ],
        "CHaSS":
            [
              {text: "AggieTV", value: "AggieTV"},
              {text: "CHASS", value: "CHASS"},
              {text: "Communication Studies", value: "Communication Studies"},
              {text: "History", value: "History"},
              {text: "I-System", value: "I-System"},
              {text: "IELI", value: "IELI"},
              {text: "Interfaith Fellows", value: "Interfaith Fellows"},
              {text: "Museum", value: "Museum"},
              {text: "SAAVI", value: "SAAVI"},
              {text: "TechComm", value: "TechComm"},
              {text: "UPR", value: "UPR"},
              {text: "Writing Center", value: "Writing Center"},
            ],
        "College of Veterinary Medicine":
            [
              {text: "College of Veterinary Medicine", value: "College of Veterinary Medicine"},
            ],
        "DEI":
            [
              {text: "Inclusion Center", value: "Inclusion Center"},
            ],
        "Eastern":
            [
              {text: "Eastern", value: "Eastern"},
              {text: "Eastern Spirit Squad", value: "Eastern Spirit Squad"},
            ],
        "Engineering":
            [
              {text: "ASPIRE", value: "ASPIRE"},
              {text: "Engineering", value: "Engineering"},
              {text: "Fluid Dynamics", value: "Fluid Dynamics"},
              {text: "USU Aerolab", value: "USU Aerolab"},
              {text: "Water Research Library", value: "Water Research Library"},
            ],
        "EVP":
            [
              {text: "Academic Success", value: "Academic Success"},
              {text: "Accessibility Services", value: "Accessibility Services"},
              {text: "Classroom Technology", value: "Classroom Technology"},
              {text: "Collaborative", value: "Collaborative"},
              {text: "Connections", value: "Connections"},
              {text: "Facilitator", value: "Facilitator"},
              {text: "NEH Museum", value: "NEH Museum"},
              {text: "Student Collaborative", value: "Student Collaborative"},
              {text: "USU Student Success", value: "USU Student Success"},
            ],
        "Extension":
            [
              {text: "Create Better Health", value: "Create Better Health"},
              {text: "Extension", value: "Extension"},
              {text: "Forestry", value: "Forestry"},
              {text: "Health Equity", value: "Health Equity"},
              {text: "Healthy Relationships", value: "Healthy Relationships"},
              {text: "IORT", value: "IORT"},
              {text: "Kane County 4-H", value: "Kane County 4-H"},
              {text: "Master Naturalist", value: "Master Naturalist"},
              {text: "Office of Health Equity and Community Engagement", value: "Office of Health Equity and Community Engagement"},
              {text: "ROI", value: "ROI"},
              {text: "SBDC", value: "SBDC"},
              {text: "Small Farms", value: "Small Farms"},
              {text: "Swaner Ecocenter", value: "Swaner Ecocenter"},
              {text: "TeachAg", value: "TeachAg"},
              {text: "Utah 4H", value: "Utah 4H"},
              {text: "Utah Ag Classroom", value: "Utah Ag Classroom"},
              {text: "Utah County 4H", value: "Utah County 4H"},
              {text: "Utah Marriage Commission", value: "Utah Marriage Commission"},
              {text: "Utah Pests", value: "Utah Pests"},
              {text: "Water Quality", value: "Water Quality"},
              {text: "Water Watch", value: "Water Watch"},
            ],
        "Facilities":
            [
              {text: "USU Blue Goes Green", value: "USU Blue Goes Green"},
            ],
        "FAS":
            [
              {text: "Aggie Print", value: "Aggie Print"},
              {text: "Dining", value: "Dining"},
              {text: "Event Services", value: "Event Services"},
              {text: "Housing", value: "Housing"},
              {text: "HR", value: "HR"},
              {text: "IT", value: "IT"},
              {text: "SEA", value: "SEA"},
            ],
        "GovR":
            [
              {text: "IOGP", value: "IOGP"},
            ],
        "Huntsman":
            [
              {text: "DeBug", value: "DeBug"},
              {text: "Huntsman", value: "Huntsman"},
              {text: "Shingo Institute", value: "Shingo Institute"},
              {text: "UWLP", value: "UWLP"},
            ],
        "Individual Channels":
            [
              {text: "Chemistry Unleashed", value: "Chemistry Unleashed"},
              {text: "Physics Demos", value: "Physics Demos"},
            ],
        "Libraries":
            [
              {text: "Digital Commons", value: "Digital Commons"},
              {text: "Digital Library", value: "Digital Library"},
              {text: "Libraries", value: "Libraries"},
            ],
        "President":
            [
              {text: "SDL", value: "SDL"},
            ],
        "Provost":
            [
              {text: "Career Design Center", value: "Career Design Center"},
              {text: "ETE", value: "ETE"},
              {text: "Global Engagement", value: "Global Engagement"},
              {text: "Graduate School", value: "Graduate School"},
              {text: "Honors", value: "Honors"},
              {text: "Indian SA", value: "Indian SA"},
              {text: "Registrar", value: "Registrar"},
              {text: "Writing Fellows", value: "Writing Fellows"},
            ],
        "QCNR":
            [
              {text: "Center for Colorado River Studies", value: "Center for Colorado River Studies"},
              {text: "Ecology Center", value: "Ecology Center"},
              {text: "GNAR", value: "GNAR"},
              {text: "QCNR", value: "QCNR"},
              {text: "Smart Foodscapes", value: "Smart Foodscapes"},
              {text: "Watershed Sciences", value: "Watershed Sciences"},
            ],
        "Research":
            [
              {text: "JQL Institute for Land, Water, and Air at USU", value: "JQL Institute for Land, Water, and Air at USU"},
              {text: "Research", value: "Research"},
            ],
        "Science":
            [
              {text: "Aggie Math", value: "Aggie Math"},
              {text: "College of Science", value: "College of Science"},
              {text: "Computer Science", value: "Computer Science"},
              {text: "Geosciences", value: "Geosciences"},
              {text: "Math Statistics", value: "Math Statistics"},
            ],
        "Student Affairs":
            [
              {text: "aggiementalhealth", value: "aggiementalhealth"},
              {text: "Aggiepella", value: "Aggiepella"},
              {text: "Algo Trading Club", value: "Algo Trading Club"},
              {text: "Campus Recreation", value: "Campus Recreation"},
              {text: "CAPS", value: "CAPS"},
              {text: "Country Swing", value: "Country Swing"},
              {text: "ESports", value: "ESports"},
              {text: "Hockey", value: "Hockey"},
              {text: "HURD", value: "HURD"},
              {text: "Mens Ultimate", value: "Mens Ultimate"},
              {text: "Mens Volleyball", value: "Mens Volleyball"},
              {text: "Pickleball", value: "Pickleball"},
              {text: "Quidditch", value: "Quidditch"},
              {text: "Rugby", value: "Rugby"},
              {text: "SLC", value: "SLC"},
              {text: "Soccer", value: "Soccer"},
              {text: "Social Action & Sustainability", value: "Social Action & Sustainability"},
              {text: "Spirit Squad", value: "Spirit Squad"},
              {text: "Star Wars Club", value: "Star Wars Club"},
              {text: "Student Media", value: "Student Media"},
              {text: "UCC", value: "UCC"},
            ],
        "UMAC":
            [
              {text: "USU", value: "USU"},
              {text: "USUNews", value: "USUNews"},
            ],
        "Unknown":
            [
              {text: "The Center for Growth and Opportunity at Utah State University", value: "The Center for Growth and Opportunity at Utah State University"},
              {text: "Training and Development", value: "Training and Development"},
            ],
      },
    }
  }
};
</script>