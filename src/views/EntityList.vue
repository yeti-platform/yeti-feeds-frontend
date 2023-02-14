<template>
  <div class="entity-list columns">
    <div class="column is-three-quarters">
      <b-tabs v-model="activeMainTab" position="is-left" :animated="false">
        <b-tab-item :label="entity.name" v-for="entity in entityTypes" v-bind:key="entity.type">
          <object-list
            search-type="entity"
            :search-subtype="entity.type"
            :fields="entity.fields"
            :search-query="searchQuery"
            :ref="entity.type + 'ObjectList'"
          />
        </b-tab-item>
      </b-tabs>
    </div>
    <div class="column">
      <section>
        <b-tabs v-model="activeTab" position="is-centered" :animated="false">
          <!-- Search tab item -->
          <b-tab-item label="Search">
            <div class="search">
              <div class="field">
                <b-input v-model="searchQuery" type="text" placeholder="Search query + ⏎" icon="search" />
              </div>
            </div>
            <br />
            <article class="message tip">
              <div class="message-body content">
                <p>
                  You can run complex queries against the database using the input field above.
                </p>
                <p>
                  By default, the query will be matched against the
                  <code>value</code> attribute of the entities. To match against other attributes, use
                  <code>attribute=query</code>.
                </p>

                <p>Examples:</p>
                <ul>
                  <li>
                    <strong>Generic tag query</strong>:
                    <code>tags=crimeware</code>
                  </li>
                  <li><strong>Gate URLs</strong>: <code>tags=zeus .php$</code> (regex <code>on</code>)</li>
                  <li>
                    <strong>Ransomware C2s</strong>:
                    <code>tags=c2,ransomware</code>
                  </li>
                  <li>
                    <strong>Context</strong>:
                    <code>context.source=FeodoTracker</code>
                  </li>
                </ul>
              </div>
            </article>
          </b-tab-item>

          <b-tab-item label="New entity">
            <b-field label="Entity type">
              <b-select placeholder="Select an entity type" expanded v-model="selectedEntityType">
                <option v-for="template of entityTypes" :value="template" :key="template.name">
                  {{ template.name }}
                </option>
              </b-select>
            </b-field>
            <div v-if="selectedEntityType">
              <b-field :label="field.label" v-for="field in selectedEntityType.fields" :key="field.field">
                <b-input v-model="newEntity[field.field]" v-if="field.type === 'text'" />
                <b-input type="textarea" v-model="newEntity[field.field]" v-if="field.type === 'longtext'" />
                <b-select v-if="field.type === 'option'" v-model="newEntity[field.field]">
                  <option v-for="(option, index) in field.choices" :value="String(index + 1)" :key="option">
                    {{ option }} {{ index }}</option
                  >
                </b-select>
                <b-taginput
                  label="Tags"
                  v-model="newEntity[field.field]"
                  v-if="field.type === 'list'"
                  icon="tag"
                ></b-taginput>
              </b-field>
              <div class="buttons">
                <b-button type="is-primary" @click="saveEntity">
                  Save
                </b-button>
              </div>
            </div>
          </b-tab-item>
        </b-tabs>
      </section>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import utils from "@/utils";
import ObjectList from "@/components/ObjectList";
import { ENTITY_TYPES } from "@/definitions/entityDefinitions.js";

export default {
  name: "entityList",
  components: {
    ObjectList
  },
  data() {
    return {
      // Table
      entities: [],
      tablePage: 1,
      tablePerPage: 50,
      tableTotal: 500, // 5 pages worth should be enough to have time to get a more accurate count
      loading: false,
      // New
      entityTypes: ENTITY_TYPES,
      selectedEntityType: null,
      newEntity: {},
      // Panel
      activeTab: 0,
      activeMainTab: 0,
      searchQuery: ""
    };
  },
  methods: {
    saveEntity() {
      this.newEntity.type = this.selectedEntityType.type;
      axios
        .post("/api/entity/", this.newEntity)
        .then(response => {
          this.$buefy.toast.open({
            message: `Entity ${response.name} saved`,
            type: "is-success"
          });
          // TODO: think about replacing this by an EventBus
          this.$refs[this.newEntity.type + "ObjectList"][0].searchObjects();
          this.newEntity = {};
        })
        .catch(error => {
          console.log(error);
          this.$buefy.toast.open({
            message: "Error saving entity: " + error,
            type: "is-danger"
          });
        });
    },
    formatTimestamp(timestamp, local) {
      return utils.formatTimestamp(timestamp, local);
    }
  },
  computed: {}
};
</script>

<style>
.entity-table {
  margin-top: 0.4em;
}
</style>
